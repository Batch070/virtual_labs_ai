import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Send, Loader2, BookOpen } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  subject: string;
  pageCount: number;
  chunkCount: number;
  createdAt: string;
}

interface SourceChunk {
  subject: string;
  pageNumber: number;
  content: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
}

export function SyllabusManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState('General');
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatSubject, setChatSubject] = useState(''); // Empty means all
  const [chatting, setChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Only PDF files are supported");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        await fetchDocuments();
        alert("Upload successful!");
      } else {
        const data = await res.json();
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Upload failed due to network error");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  /**
   * Properly parse SSE stream with buffering.
   * Handles chunks that span across network boundaries correctly.
   */
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatting) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatting(true);

    try {
      const res = await fetch('/api/syllabus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, subject: chatSubject || undefined })
      });

      if (!res.ok) throw new Error("Failed to start chat");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let sources: SourceChunk[] | undefined = undefined;
      let sseBuffer = ''; // Buffer for incomplete SSE events

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;
        
        // Split on double newline (SSE event boundary) or single newline for line-by-line processing
        const lines = sseBuffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        sseBuffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'sources') {
                sources = data.sources;
                setChatMessages(prev => {
                  const newArr = [...prev];
                  newArr[newArr.length - 1] = {
                    ...newArr[newArr.length - 1],
                    sources: sources,
                  };
                  return newArr;
                });
              } else if (data.error) {
                assistantMsg = `Error: ${data.error}`;
                setChatMessages(prev => {
                  const newArr = [...prev];
                  newArr[newArr.length - 1] = {
                    ...newArr[newArr.length - 1],
                    content: assistantMsg,
                  };
                  return newArr;
                });
              }
            } catch (parseError) {
              // Not valid JSON — treat as raw text content
              assistantMsg += dataStr;
              setChatMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = {
                  ...newArr[newArr.length - 1],
                  content: assistantMsg,
                };
                return newArr;
              });
            }
          } else {
            // Raw text content (not SSE formatted)
            assistantMsg += trimmedLine;
            setChatMessages(prev => {
              const newArr = [...prev];
              newArr[newArr.length - 1] = {
                ...newArr[newArr.length - 1],
                content: assistantMsg,
              };
              return newArr;
            });
          }
        }
      }
      
      // Process any remaining buffer
      if (sseBuffer.trim()) {
        assistantMsg += sseBuffer.trim();
        setChatMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = {
            ...newArr[newArr.length - 1],
            content: assistantMsg,
          };
          return newArr;
        });
      }
      
    } catch (error) {
      console.error("Chat error", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred.' }]);
    } finally {
      setChatting(false);
    }
  };

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);

  return (
    <div className="flex-1 flex gap-6 p-6 h-screen max-h-screen overflow-hidden bg-[#050505]">
      
      {/* LEFT PANEL: Upload & Manage */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="bg-[#0F0F0F] rounded-xl border border-white/10 p-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-[#D4AF37]" size={24} />
            Syllabus Library
          </h2>
          
          <div className="mb-4">
             <label className="block text-sm text-gray-400 mb-1">Subject Label</label>
             <input 
               type="text" 
               value={subject}
               onChange={(e) => setSubject(e.target.value)}
               className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
             />
          </div>

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-white/40 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <Loader2 className="animate-spin text-[#D4AF37] mb-2" size={28} />
              ) : (
                <Upload className="text-gray-400 mb-2" size={28} />
              )}
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">Click to upload PDF</span> or drag and drop
              </p>
            </div>
            <input type="file" className="hidden" accept="application/pdf" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="bg-[#0F0F0F] rounded-xl border border-white/10 p-6 flex-1 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-4">Your Documents</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center mt-10">No documents uploaded yet.</p>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="bg-[#1A1A1A] rounded-lg p-3 border border-white/5 flex items-start justify-between group">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <FileText className="text-[#D4AF37] shrink-0 mt-1" size={20} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate" title={doc.filename}>{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {doc.subject} • {doc.chunkCount} chunks
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500 text-center">
            {totalChunks} total chunks embedded using all-MiniLM-L6-v2
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: RAG Chat */}
      <div className="w-2/3 bg-[#0F0F0F] rounded-xl border border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">💬 Ask Your Syllabus</h2>
          <select 
            value={chatSubject} 
            onChange={(e) => setChatSubject(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
          >
            <option value="">All Subjects</option>
            {Array.from(new Set(documents.map(d => d.subject))).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center px-10">
                <BookOpen size={48} className="text-[#D4AF37] mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">Chat with your Study Materials</h3>
                <p className="text-gray-400">Ask questions about assignments, grading rubrics, or topics covered in your uploaded PDFs. The AI will cite its sources directly from your documents.</p>
             </div>
          ) : (
             chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-[#D4AF37] text-black' 
                      : 'bg-[#1A1A1A] border border-white/10 text-gray-200'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources</p>
                        <div className="flex flex-col gap-2">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="bg-[#222] rounded p-2 text-xs text-gray-300">
                              <span className="font-semibold text-[#D4AF37]">{src.subject}, Page {src.pageNumber}:</span> 
                              <span className="ml-2 italic line-clamp-2">"{src.content}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
             ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleChat} className="flex gap-2">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={documents.length === 0 ? "Upload a document first..." : "Ask anything about your syllabus..."}
              disabled={documents.length === 0 || chatting}
              className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={documents.length === 0 || chatting || !inputMessage.trim()}
              className="bg-[#D4AF37] text-black p-3 rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {chatting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
