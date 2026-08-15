import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = true;
env.useBrowserCache = false;

let embedderPipeline: any = null;

// --- LRU Embedding Cache ---
// Avoids re-embedding identical text strings (huge speed boost for repeated queries)
const CACHE_MAX_SIZE = 500;
const embeddingCache = new Map<string, number[]>();

function getCachedEmbedding(text: string): number[] | undefined {
  const cached = embeddingCache.get(text);
  if (cached) {
    // Move to end (most recently used) by re-inserting
    embeddingCache.delete(text);
    embeddingCache.set(text, cached);
  }
  return cached;
}

function setCachedEmbedding(text: string, embedding: number[]): void {
  // Evict oldest if at capacity
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) {
      embeddingCache.delete(firstKey);
    }
  }
  embeddingCache.set(text, embedding);
}

/**
 * Initialize the embedding model.
 * Downloads the model on first run (~22MB) and caches it locally.
 * Call this eagerly at server startup for faster first requests.
 */
export async function initEmbedder(): Promise<void> {
  if (!embedderPipeline) {
    console.log('[Embedder] Initializing local embedding model (all-MiniLM-L6-v2)...');
    const startTime = Date.now();
    embedderPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true, // Uses less memory
    } as any);
    console.log(`[Embedder] Model initialized in ${Date.now() - startTime}ms.`);
  }
}

/**
 * Generate an embedding for a single text string.
 * Uses LRU cache for repeated queries.
 */
export async function embedText(text: string): Promise<number[]> {
  // Check cache first
  const cached = getCachedEmbedding(text);
  if (cached) return cached;

  if (!embedderPipeline) {
    await initEmbedder();
  }
  const result = await embedderPipeline(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(result.data) as number[];
  
  // Cache the result
  setCachedEmbedding(text, embedding);
  return embedding;
}

/**
 * Generate embeddings for multiple text strings.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!embedderPipeline) {
    await initEmbedder();
  }
  
  // Check which texts need embedding vs which are cached
  const results: (number[] | null)[] = texts.map(t => getCachedEmbedding(t) || null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  
  results.forEach((r, i) => {
    if (r === null) {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  });
  
  // Only embed uncached texts
  if (uncachedTexts.length > 0) {
    const result = await embedderPipeline(uncachedTexts, { pooling: 'mean', normalize: true });
    
    // result.tolist() returns an array of arrays
    const newEmbeddings: number[][] = result.tolist();
    
    uncachedIndices.forEach((originalIdx, newIdx) => {
      results[originalIdx] = newEmbeddings[newIdx];
      setCachedEmbedding(texts[originalIdx], newEmbeddings[newIdx]);
    });
  }
  
  return results as number[][];
}
