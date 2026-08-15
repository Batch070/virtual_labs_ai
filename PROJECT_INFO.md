# Virtual Labs AI: Academic Division

**Virtual Labs AI** is an advanced, AI-powered educational platform designed to provide interactive, dynamic visualizations and a robust Retrieval-Augmented Generation (RAG) pipeline for students and educators. It combines modern web technologies with local machine learning models and cloud AI to create a seamless learning experience.

---

## 🌟 Introduction
The primary goal of Virtual Labs AI is to bridge the gap between static textbook learning and interactive experimentation. By providing an "AI Visualizer", users can request complex concepts (e.g., algorithms, physics simulations, biological growth models) and the system will dynamically generate a custom, interactive HTML/JS/CSS visualization on the fly. 

Additionally, the platform features a powerful document ingestion system. Users can upload academic PDFs (like syllabuses, research papers, or textbooks). The system processes these documents, understands their semantic meaning, and uses them as context to provide highly accurate, tailored responses and visualizations.

---

## 🎯 Objectives
1. **Dynamic Interactive Learning:** Allow users to instantly generate functioning, interactive web-based simulations using natural language.
2. **Context-Aware Assistance (RAG):** Enable users to upload their own study materials so the AI can ground its responses and visualizations in user-provided academic context.
3. **Seamless UX & Premium Design:** Deliver a high-quality, dark-themed user interface (glassmorphism, micro-animations) that feels responsive and professional.
4. **Persistent History:** Save all user interactions, uploaded documents, and generated code in a persistent database architecture so users never lose their work.
5. **Local First AI:** Perform heavy lifting like text-embedding entirely locally to preserve privacy and reduce API costs, relying on external APIs only for the final generative step.

---

## 🛠️ Technologies Used

This project was built using a hybrid architecture, combining a modern frontend framework with a robust backend, relational databases, and specialized vector stores for AI.

### Frontend
- **React 18 & Vite:** For building a lightning-fast, component-based user interface.
- **TypeScript:** Ensuring type safety and robust code across both the frontend and backend.
- **Tailwind CSS:** For rapid, utility-first styling. The UI utilizes a strict premium dark theme (`#050505` backgrounds, `#D4AF37` gold accents).
- **Framer Motion:** For smooth, physics-based UI animations and transitions (e.g., sidebars, loading states).
- **Lucide React:** Clean and modern SVG iconography.

### Backend & API
- **Node.js & Express.js:** The core backend server handling API routes, file uploads, and streaming responses.
- **OpenRouter API:** Acts as the LLM (Large Language Model) provider for generating the dynamic HTML visualizations. The backend handles Server-Sent Events (SSE) to stream the code live to the frontend.
- **Multer:** Middleware for handling multipart/form-data, used specifically for uploading PDF files.
- **pdf-parse:** Used to extract raw text content from uploaded academic PDFs.

### Artificial Intelligence & Data Pipeline
- **@xenova/transformers:** Runs the `all-MiniLM-L6-v2` embedding model *entirely locally* using ONNX Runtime. This is used to convert document chunks and chat messages into 384-dimensional vectors for semantic search.
- **LanceDB (`@lancedb/lancedb`):** A specialized, high-performance local Vector Database. It stores all embeddings (documents, chat history, and predefined lab metadata) and allows for lightning-fast nearest-neighbor semantic search.
- **Retrieval-Augmented Generation (RAG):** When a user asks a question, the backend embeds the query, searches LanceDB for relevant document chunks, and injects that text directly into the OpenRouter LLM prompt.

### Relational Database
- **MySQL (`mysql2/promise`):** The primary relational database used to store structural metadata.
  - **Tables:** `documents` (metadata about uploaded PDFs), `chat_sessions` (user visualization sessions), and `chat_messages` (the exact history of prompts and generated code).

---

## 🚀 Key Features

### 1. AI Visualizer (The Core Experience)
- **Live Code Synthesis:** When a user enters a prompt, the UI switches to a "Code" view, streaming the raw HTML/JS/CSS from the LLM in real-time.
- **Instant Preview:** Once generation is complete, the UI automatically flips to an isolated `<iframe>`, rendering the fully functional, interactive visualization.
- **Iterative Editing:** Users can type follow-up instructions (e.g., "Make the box bounce higher" or "Add a speed slider") and the AI will edit the existing visualization while maintaining the design system.

### 2. Syllabus & Document Pipeline
- **Smart Chunking:** Uploaded PDFs are parsed and intelligently chunked into smaller segments (around 500 tokens) with overlap to preserve context.
- **Vector Search:** These chunks are embedded locally and stored in LanceDB. The AI uses this database to instantly recall relevant paragraphs when generating answers.

### 3. State Management & Persistence
- Every prompt and visualization is saved to MySQL as a `chat_message` tied to a `chat_session`.
- Users can access a sliding sidebar to view their past sessions. Clicking an old session instantly loads the exact visualization code they generated days or weeks ago.

---

## 📂 Project Structure Overview
- `/src/components/`: Frontend React components (`AILab.tsx`, `Dashboard.tsx`, etc.)
- `/server.ts`: The main Express server entry point.
- `/server/db.ts`: MySQL connection pool and LanceDB initialization.
- `/server/documentProcessor.ts`: PDF parsing, chunking logic, and insertion into databases.
- `/server/embedder.ts`: Local ONNX model initialization and text-to-vector functions.
- `/server/vectorStore.ts`: LanceDB table definitions and semantic search queries.
- `/server/chatManager.ts`: MySQL queries for saving/loading chat sessions and messages.
- `/server/openRouterClient.ts`: HTTP client for communicating with OpenRouter and parsing the SSE streams.
