import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";

import { initDatabases } from "./server/db.js";
import { initVectorStore, semanticSearch, searchDocuments, searchChatHistory, addChatEmbedding } from "./server/vectorStore.js";
import { processDocument, getDocuments, deleteDocument } from "./server/documentProcessor.js";
import { createSession, getSessions, getSession, deleteSession, addMessage, getSessionMessages } from "./server/chatManager.js";
import { streamChat, parseOpenRouterStream } from "./server/openRouterClient.js";
import { embedText, initEmbedder } from "./server/embedder.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// ==========================================
// RATE LIMITING (Simple in-memory)
// ==========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  }
  
  entry.count++;
  
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  
  next();
}

// Clean up rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 60_000);

// ==========================================
// SYSTEM PROMPTS — The Core AI Quality Engine
// ==========================================

const VISUALIZATION_SYSTEM_PROMPT = `You are an expert interactive visualization engineer who creates PERFECT, production-quality HTML visualizations. You must produce code that works flawlessly on first render — broken or non-functional output is unacceptable.

## OUTPUT RULES (CRITICAL — FOLLOW EXACTLY)
1. Return ONLY valid, complete HTML. No markdown, no \`\`\`html tags, no explanations.
2. Output MUST start with <!DOCTYPE html> and end with </html>.
3. Include <script src="https://cdn.tailwindcss.com"></script> in the <head>.
4. ALL JavaScript MUST be inside a <script> tag at the end of <body>.

## DESIGN SYSTEM (MANDATORY)
- Background: bg-[#050505] (near-black)
- Text: text-gray-200 (light gray)
- Primary accent: #D4AF37 (gold) — for buttons, active states, highlights
- Panel backgrounds: bg-[#0F0F0F] or bg-[#1A1A1A] with border border-white/10
- Cards: rounded-2xl with subtle shadow-lg and backdrop-blur effects
- Transitions: transition-all duration-300 on interactive elements
- Hover effects on ALL clickable elements
- Use modern, premium aesthetics: glassmorphism, gradients, micro-animations

## CODE QUALITY REQUIREMENTS (NON-NEGOTIABLE)
1. Wrap ALL JavaScript in: document.addEventListener('DOMContentLoaded', function() { ... });
2. Wrap the entire script body in try/catch with a visible error fallback:
   \`\`\`
   try { /* your code */ } catch(e) { 
     document.body.innerHTML = '<div style="color:#D4AF37;padding:40px;font-family:sans-serif;"><h2>Visualization Error</h2><p>'+e.message+'</p></div>'; 
   }
   \`\`\`
3. Use null-checks before accessing DOM elements: const el = document.getElementById('x'); if (!el) return;
4. Use requestAnimationFrame for ANY animation loops — never setInterval for rendering
5. All event listeners must use proper cleanup if applicable
6. Canvas elements MUST set width/height dynamically from container size
7. Charts MUST have labeled axes, legends, and clear data labels
8. Interactive controls (sliders, buttons) MUST show their current value
9. ALL forms/inputs must have visible labels
10. Use CSS Grid or Flexbox for layouts — never absolute positioning for layout structure

## RESPONSIVE DESIGN
- The visualization MUST fill its container (width: 100%, height: 100vh)
- Use responsive Tailwind classes (md:, lg:) for different screen sizes
- Text must be readable at any size

## INTERACTIVITY CHECKLIST
- Every slider MUST display its current value in real-time
- Every button MUST have a hover state and click feedback
- Animations MUST have play/pause/reset controls
- Data visualizations MUST update when parameters change
- Include a clear title and brief description of what the visualization shows

## BEFORE YOU RESPOND — MENTAL VERIFICATION
Verify that your code:
✅ Starts with <!DOCTYPE html> and ends with </html>
✅ Has no undefined variables or missing function definitions
✅ All getElementById calls reference elements that exist in the HTML
✅ All canvas/SVG elements are properly sized
✅ All interactive controls actually work and update the visualization
✅ Error handling wraps the entire script
✅ No external dependencies except Tailwind CDN (no Chart.js, D3, etc. unless specifically requested)
✅ The visualization renders something meaningful immediately on load`;

const EDIT_SYSTEM_PROMPT = `You are editing an existing HTML visualization. You will receive the current HTML and the user's change request.

## RULES
1. Make ONLY the requested changes. Keep everything else identical.
2. Ensure the design continues to use the Virtual Labs theme (bg-[#050505], accent #D4AF37, premium Tailwind UI).
3. Return the COMPLETE modified HTML document.
4. Do NOT explain anything. Do NOT use markdown code blocks like \`\`\`html.
5. Start exactly with <!DOCTYPE html> and end with </html>.
6. Preserve ALL existing error handling (try/catch, DOMContentLoaded wrapper).
7. If adding new interactive elements, they MUST:
   - Show current values for sliders/inputs
   - Have hover states for buttons
   - Be wired up to actually modify the visualization
8. Test mentally that all getElementById calls reference elements that exist.
9. Do NOT break existing functionality while adding new features.
10. If the edit request is about fixing something broken, fix the root cause — don't just hide the problem.`;

// ==========================================
// INPUT VALIDATORS
// ==========================================
function validateString(val: any, fieldName: string, maxLen: number = 10000): string {
  if (!val || typeof val !== 'string') {
    throw new Error(`${fieldName} is required and must be a string.`);
  }
  if (val.length > maxLen) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLen} characters.`);
  }
  return val.trim();
}

function validateOptionalString(val: any, maxLen: number = 10000): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val !== 'string') return undefined;
  return val.substring(0, maxLen).trim();
}

// ==========================================
// SERVER STARTUP
// ==========================================
async function startServer() {
  await initDatabases();
  
  // Eagerly initialize the embedding model at startup (not on first request)
  await initEmbedder();
  
  await initVectorStore();

  const app = express();
  const PORT = 3000;

  // --- Security Middleware ---
  app.use(express.json({ limit: '5mb' })); // Limit JSON body size
  
  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Rate limiting on API routes
  app.use('/api/', rateLimiter);

  // ==========================================
  // SHARED ROUTES
  // ==========================================
  app.post("/api/search-labs", async (req, res) => {
    try {
      const query = validateString(req.body.query, 'query', 500);
      const results = await semanticSearch(query, 10);
      res.json({ results });
    } catch (error: any) {
      console.error("Semantic search error in API:", error);
      res.status(error.message.includes('required') ? 400 : 500).json({ error: error.message || "Failed to perform semantic search" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // ==========================================
  // FEATURE 1: SYLLABUS RAG
  // ==========================================
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Validate file type (server-side validation in addition to client)
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: "Only PDF files are supported" });
      }
      
      const subject = validateOptionalString(req.body.subject, 255) || 'General';
      const result = await processDocument(req.file.buffer, req.file.originalname, subject);
      res.json(result);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/documents', async (req, res) => {
    try {
      const docs = await getDocuments();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
    try {
      await deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/syllabus/chat', async (req, res) => {
    try {
      const question = validateString(req.body.question, 'question', 2000);
      const subject = validateOptionalString(req.body.subject, 255);

      // 1. Retrieve chunks
      const chunks = await searchDocuments(question, subject, 5);
      const contextText = chunks.map((c: any) => `[Source: ${c.subject}, Page ${c.pageNumber}]\n${c.content}`).join("\n\n");

      // 2. Build prompt
      const systemPrompt = `You are an AI teaching assistant. Answer the user's question using ONLY the provided syllabus context. 
If the answer is not in the context, say "I cannot find the answer in the provided syllabus."
Include citations to the source document (e.g. "[Source: Physics, Page 12]").

Context:
${contextText}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ];

      // 3. Stream response
      const response = await streamChat(messages, { temperature: 0.2, maxTokens: 4000 });
      
      // Forward the OpenRouter stream headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // Send the sources as the first chunk so the UI can display them
      res.write(`data: ${JSON.stringify({ type: 'sources', sources: chunks })}\n\n`);

      if (response.body) {
         for await (const content of parseOpenRouterStream(response.body)) {
            res.write(content);
         }
         res.end();
      } else {
         res.end();
      }

    } catch (error: any) {
      console.error("Syllabus chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }
    }
  });

  // ==========================================
  // FEATURE 2: AI VISUALIZER WITH SESSIONS
  // ==========================================
  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const title = validateOptionalString(req.body.title, 255) || 'New Session';
      const session = await createSession(title);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/sessions', async (req, res) => {
    try {
      res.json(await getSessions());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/chat/sessions/:id', async (req, res) => {
    try {
      const session = await getSession(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const messages = await getSessionMessages(req.params.id);
      res.json({ session, messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/chat/sessions/:id', async (req, res) => {
    try {
      await deleteSession(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-viz', async (req, res) => {
    try {
      const topic = validateString(req.body.topic, 'topic', 5000);
      const sessionId = validateString(req.body.sessionId, 'sessionId', 255);
      const context = validateOptionalString(req.body.context, 5000);
      
      console.log(`[generate-viz] topic: ${topic.substring(0, 80)}, sessionId: ${sessionId}`);

      // PERFORMANCE: Run independent operations in parallel
      const [msgs, semanticContext, queryVec] = await Promise.all([
        getSessionMessages(sessionId, 6),
        searchChatHistory(topic, sessionId, 2),
        embedText(topic),
      ]);

      const recentMessages = msgs.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // Build memory context from similar past discussions
      let memoryText = "";
      if (semanticContext.length > 0) {
        memoryText = "Relevant past discussions from other sessions:\n" + 
                     semanticContext.map((c: any) => `- ${c.content}`).join("\n");
      }

      const currentPrompt = `${memoryText}\n\nTopic: ${topic}\n${context ? `Additional Context: ${context}` : ""}`;
      
      const messages = [
        { role: "system", content: VISUALIZATION_SYSTEM_PROMPT },
        ...recentMessages,
        { role: "user", content: currentPrompt }
      ];

      // Save user message and embedding in parallel
      const savePromise = Promise.all([
        addMessage(sessionId, 'user', topic),
        addChatEmbedding({
          id: crypto.randomUUID(),
          sessionId,
          role: 'user',
          content: topic,
          createdAt: Date.now(),
          vector: queryVec
        }),
      ]);

      const response = await streamChat(messages, { temperature: 0.3, maxTokens: 16000 });
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let fullResponse = "";

      if (response.body) {
         for await (const content of parseOpenRouterStream(response.body)) {
            res.write(content);
            fullResponse += content;
         }
         res.end();
      } else {
         res.end();
      }

      // Wait for save operations, then save assistant message
      await savePromise;
      if (fullResponse) {
        await addMessage(sessionId, 'assistant', fullResponse);
      }

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  app.post('/api/edit-viz', async (req, res) => {
    try {
      const sessionId = validateString(req.body.sessionId, 'sessionId', 255);
      const currentHtml = validateString(req.body.currentHtml, 'currentHtml', 500000); // HTML can be large
      const editInstruction = validateString(req.body.editInstruction, 'editInstruction', 5000);

      const userPrompt = `Current HTML:\n${currentHtml}\n\nChange requested: "${editInstruction}"`;

      const messages = [
        { role: 'system', content: EDIT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ];

      // Save user message (don't await — fire and forget for speed)
      addMessage(sessionId, 'user', `Edit Request: ${editInstruction}`).catch(e => console.error('Save failed:', e));

      const response = await streamChat(messages, { temperature: 0.2, maxTokens: 16000 });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let fullResponse = "";

      if (response.body) {
         for await (const content of parseOpenRouterStream(response.body)) {
            res.write(content);
            fullResponse += content;
         }
         res.end();
      } else {
         res.end();
      }

      if (fullResponse) {
        addMessage(sessionId, 'assistant', fullResponse).catch(e => console.error('Save failed:', e));
      }

    } catch (error: any) {
      console.error("AI Edit Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const rootPath = __dirname || process.cwd();
    const distPath = path.join(rootPath, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
