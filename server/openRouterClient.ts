// --- Configuration ---
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 120_000; // 120 seconds for streaming responses

/**
 * Stream a chat completion from OpenRouter with timeout, retries, and keep-alive.
 */
export async function streamChat(
  messages: { role: string; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is missing.');
  }

  const temperature = options?.temperature ?? 0.3; // Lower = more deterministic & accurate
  const maxTokens = options?.maxTokens ?? 16000; // Generous but bounded
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Virtual Labs AI',
          'Connection': 'keep-alive', // Reuse TCP connections
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages: messages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter] API error (attempt ${attempt + 1}):`, response.status, errorText);

        // Don't retry on 4xx client errors (except 429 rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        lastError = new Error(`OpenRouter API error: ${response.status}`);
        
        // Wait before retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`[OpenRouter] Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      } else {
        return response;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        lastError = new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
        console.error(`[OpenRouter] Request timed out (attempt ${attempt + 1})`);
      } else {
        lastError = error;
        console.error(`[OpenRouter] Request failed (attempt ${attempt + 1}):`, error.message);
      }

      // Wait before retry
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`[OpenRouter] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('OpenRouter request failed after all retries');
}

/**
 * Parse an OpenRouter SSE stream into content chunks.
 * Handles buffering of partial lines across network chunks.
 */
export async function* parseOpenRouterStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Partial JSON — may arrive in next chunk, skip silently
          }
        }
      }
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.slice(6).trim();
        if (dataStr !== '[DONE]') {
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors on final buffer
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
