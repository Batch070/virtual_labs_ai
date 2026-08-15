import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { getMysql } from './db.js';
import { embedTexts } from './embedder.js';
import { addDocumentChunks, deleteDocumentChunks, DocumentChunk } from './vectorStore.js';

export interface Document {
  id: string;
  filename: string;
  subject?: string;
  chunkCount: number;
  createdAt: string;
}

export async function processDocument(
  fileBuffer: Buffer,
  filename: string,
  subject: string = 'General'
): Promise<{ documentId: string; chunksCreated: number }> {
  // 1. Extract text from PDF
  const parser = new PDFParse({ data: fileBuffer });
  const textResult = await parser.getText();
  const text = textResult.text;
  const pageCount = textResult.pages?.length || 1;

  if (!text || text.trim().length === 0) {
    throw new Error('PDF appears to be empty or contains no extractable text.');
  }

  // 2. Chunk text (smart strategy: ~500 tokens / ~2000 chars, with overlap for context continuity)
  const chunks: string[] = [];
  const chunkSize = 2000; // rough characters approx 500 tokens
  const overlap = 200;
  
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    let chunkText = text.slice(i, end);
    if (end < text.length) {
      const lastNewline = chunkText.lastIndexOf('\n');
      if (lastNewline > chunkSize * 0.8) {
        chunkText = chunkText.slice(0, lastNewline);
        i = i + lastNewline;
      } else {
        const lastSpace = chunkText.lastIndexOf(' ');
        if (lastSpace > chunkSize * 0.8) {
          chunkText = chunkText.slice(0, lastSpace);
          i = i + lastSpace;
        } else {
           i = end - overlap;
        }
      }
    } else {
      i = end;
    }
    if (chunkText.trim().length > 0) {
      chunks.push(chunkText.trim());
    }
  }

  if (chunks.length === 0) {
    throw new Error('Failed to extract meaningful text chunks from the PDF.');
  }

  const documentId = uuidv4();

  // 3. Generate embeddings for all chunks (batch)
  const vectors = await embedTexts(chunks);

  // 4. Create DocumentChunk objects
  const documentChunks: DocumentChunk[] = chunks.map((chunkText, index) => ({
    id: uuidv4(),
    documentId,
    chunkIndex: index,
    content: chunkText,
    pageNumber: Math.max(1, Math.floor((index / chunks.length) * pageCount)),
    section: 'Unknown',
    subject,
    vector: vectors[index]
  }));

  // 5. Store in LanceDB
  await addDocumentChunks(documentChunks);

  // 6. Store metadata in MySQL
  const db = getMysql();
  await db.execute(
    'INSERT INTO documents (id, filename, subject, chunkCount) VALUES (?, ?, ?, ?)',
    [documentId, filename, subject, chunks.length]
  );

  return { documentId, chunksCreated: chunks.length };
}

export async function getDocuments(): Promise<Document[]> {
  const db = getMysql();
  const [rows] = await db.query('SELECT * FROM documents ORDER BY createdAt DESC');
  return rows as Document[];
}

export async function deleteDocument(documentId: string): Promise<void> {
  // 1. Delete from MySQL (parameterized — safe)
  const db = getMysql();
  await db.execute('DELETE FROM documents WHERE id = ?', [documentId]);

  // 2. Delete from LanceDB (uses sanitized helper from vectorStore)
  await deleteDocumentChunks(documentId);
}
