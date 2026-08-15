import { getLance } from './db.js';
import { embedText, embedTexts } from './embedder.js';
import { LABS } from '../src/data.js';

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber: number;
  section: string;
  subject: string;
  vector?: number[];
}

export interface ChatEmbedding {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: number;
  vector?: number[];
}

// --- Table Handle Cache ---
// Avoids calling db.openTable() on every single request
const tableCache = new Map<string, { handle: any; cachedAt: number }>();
const TABLE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedTable(tableName: string): Promise<any | null> {
  const cached = tableCache.get(tableName);
  if (cached && (Date.now() - cached.cachedAt) < TABLE_CACHE_TTL_MS) {
    return cached.handle;
  }
  
  const db = await getLance();
  const tableNames = await db.tableNames();
  if (!tableNames.includes(tableName)) return null;
  
  const handle = await db.openTable(tableName);
  tableCache.set(tableName, { handle, cachedAt: Date.now() });
  return handle;
}

function invalidateTableCache(tableName: string) {
  tableCache.delete(tableName);
}

// --- Input Sanitization for LanceDB filter queries ---
function sanitizeFilterValue(value: string): string {
  // Remove any single quotes and backslashes that could break/inject into filter strings
  return value.replace(/['\\]/g, '');
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function initVectorStore() {
  console.log("[VectorStore] Initializing LanceDB Tables...");
  const db = await getLance();

  // Initialize Labs Table
  try {
    const tableNames = await db.tableNames();
    
    if (!tableNames.includes('lab_embeddings')) {
      console.log("[VectorStore] Creating lab_embeddings table...");
      const texts = LABS.map((lab) => `Category: ${lab.category}. Title: ${lab.title}. Description: ${lab.description}.`);
      const vectors = await embedTexts(texts);
      
      const data = LABS.map((lab, i) => ({
        id: lab.id,
        text: texts[i],
        vector: vectors[i]
      }));
      
      await db.createTable('lab_embeddings', data);
      console.log(`[VectorStore] Successfully embedded ${data.length} labs into LanceDB.`);
    }
  } catch (error) {
    console.error("[VectorStore] Failed to initialize:", error);
  }
}

export async function semanticSearch(query: string, topK: number = 5) {
  try {
    const table = await getCachedTable('lab_embeddings');
    if (!table) return [];

    const queryVector = await embedText(query);

    const results = await table
      .vectorSearch(queryVector)
      .limit(topK)
      .toArray();

    return results.map((r: any) => ({
      id: r.id,
      score: 1 - (r._distance || 0), // LanceDB returns distance, we want similarity
    }));
  } catch (error) {
    console.error("Semantic search error:", error);
    return [];
  }
}

export async function addDocumentChunks(chunks: DocumentChunk[]) {
  const db = await getLance();
  const tableNames = await db.tableNames();

  if (!tableNames.includes('document_chunks')) {
    await db.createTable('document_chunks', chunks as unknown as Record<string, unknown>[]);
  } else {
    const table = await db.openTable('document_chunks');
    await table.add(chunks as unknown as Record<string, unknown>[]);
  }
  
  // Invalidate cache since table data changed
  invalidateTableCache('document_chunks');
}

export async function searchDocuments(query: string, subject?: string, topK: number = 5) {
  try {
    const table = await getCachedTable('document_chunks');
    if (!table) return [];

    const queryVector = await embedText(query);

    let queryBuilder = table.vectorSearch(queryVector);
    if (subject) {
      // SECURITY: Sanitize subject to prevent filter injection
      const safeSubject = sanitizeFilterValue(subject);
      queryBuilder = queryBuilder.where(`subject = '${safeSubject}'`);
    }

    const results = await queryBuilder.limit(topK).toArray();
    return results;
  } catch (error) {
    console.error("Document search error:", error);
    return [];
  }
}

export async function addChatEmbedding(msg: ChatEmbedding) {
  const db = await getLance();
  const tableNames = await db.tableNames();

  if (!tableNames.includes('chat_embeddings')) {
    await db.createTable('chat_embeddings', [msg] as unknown as Record<string, unknown>[]);
  } else {
    const table = await db.openTable('chat_embeddings');
    await table.add([msg] as unknown as Record<string, unknown>[]);
  }
  
  // Invalidate cache since table data changed
  invalidateTableCache('chat_embeddings');
}

export async function searchChatHistory(query: string, excludeSessionId: string, topK: number = 3) {
  try {
    const table = await getCachedTable('chat_embeddings');
    if (!table) return [];

    const queryVector = await embedText(query);

    // SECURITY: Validate sessionId format (should be a UUID)
    const safeSessionId = isValidUUID(excludeSessionId) 
      ? excludeSessionId 
      : sanitizeFilterValue(excludeSessionId);

    const results = await table
      .vectorSearch(queryVector)
      .where(`sessionId != '${safeSessionId}'`)
      .limit(topK)
      .toArray();

    return results;
  } catch (error) {
    console.error("Chat history search error:", error);
    return [];
  }
}

export async function deleteDocumentChunks(documentId: string) {
  try {
    const table = await getCachedTable('document_chunks');
    if (!table) return;

    // SECURITY: Validate documentId is a UUID
    const safeId = isValidUUID(documentId) 
      ? documentId 
      : sanitizeFilterValue(documentId);

    await table.delete(`documentId = '${safeId}'`);
    invalidateTableCache('document_chunks');
  } catch (error) {
    console.error("Delete document chunks error:", error);
  }
}
