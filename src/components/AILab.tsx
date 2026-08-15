import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Terminal, Loader2, ArrowRight, Maximize2, Minimize2, Save, History, X, MessageSquare, Plus, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ==========================================
// HTML EXTRACTION & VALIDATION UTILITIES
// ==========================================

/**
 * Robustly extract clean HTML from potentially markdown-wrapped AI responses.
 * Handles multiple edge cases: ```html fences, leading whitespace, partial fences, etc.
 */
function extractHtml(text: string): string {
  let html = text;
  
  // Remove any leading/trailing whitespace
  html = html.trim();
  
  // Strip markdown code fences (various formats the AI might use)
  // Handle: ```html\n...```, ```HTML\n...```, ```\n...```, etc.
  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "");
  html = html.replace(/\n?```\s*$/, "");
  
  // If the response starts with explanation text before the HTML, strip it
  const doctypeIndex = html.indexOf('<!DOCTYPE');
  const htmlTagIndex = html.indexOf('<html');
  const startIndex = doctypeIndex !== -1 ? doctypeIndex : htmlTagIndex;
  
  if (startIndex > 0) {
    html = html.substring(startIndex);
  }
  
  return html.trim();
}

/**
 * Validate that the generated HTML is structurally complete.
 * Returns { valid: boolean, error?: string }
 */
function validateHtml(html: string): { valid: boolean; error?: string } {
  if (!html || html.trim().length === 0) {
    return { valid: false, error: "Empty response received" };
  }
  
  const trimmed = html.trim();
  
  // Must start with <!DOCTYPE html> or <html
  if (!trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html') && !trimmed.startsWith('<!doctype')) {
    return { valid: false, error: "Response does not appear to be valid HTML" };
  }
  
  // Must contain closing </html> tag
  if (!trimmed.includes('</html>')) {
    return { valid: false, error: "HTML appears to be truncated (missing </html>)" };
  }
  
  // Must have a <body> section
  if (!trimmed.includes('<body') && !trimmed.includes('<BODY')) {
    return { valid: false, error: "HTML is missing <body> section" };
  }
  
  return { valid: true };
}

/**
 * Attempt to repair common HTML issues from AI output.
 */
function repairHtml(html: string): string {
  let repaired = html.trim();
  
  // Add DOCTYPE if missing
  if (!repaired.startsWith('<!DOCTYPE') && !repaired.startsWith('<!doctype')) {
    if (repaired.startsWith('<html')) {
      repaired = '<!DOCTYPE html>\n' + repaired;
    }
  }
  
  // Add closing </html> if truncated
  if (!repaired.includes('</html>')) {
    // Try to close any open script/body tags first
    if (repaired.includes('<script') && !repaired.includes('</script>')) {
      repaired += '\n</script>';
    }
    if (repaired.includes('<body') && !repaired.includes('</body>')) {
      repaired += '\n</body>';
    }
    repaired += '\n</html>';
  }
  
  return repaired;
}


export default function AILab() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  
  const [topic, setTopic] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [streamingCode, setStreamingCode] = useState<string | null>(null); // Separate state for streaming display
  const [error, setError] = useState<string | null>(null);
  const [htmlWarning, setHtmlWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [showSessions, setShowSessions] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const outputRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.session.id);
        setHistory(data.messages);
        
        // Find the last assistant message and set it as HTML
        const lastMsg = [...data.messages].reverse().find((m: any) => m.role === 'assistant');
        if (lastMsg && (lastMsg.content.includes('<html') || lastMsg.content.includes('<!DOCTYPE'))) {
          const cleaned = extractHtml(lastMsg.content);
          setGeneratedHtml(cleaned);
          setStreamingCode(null);
          setViewMode("preview");
        } else {
          setGeneratedHtml(null);
          setStreamingCode(null);
        }
        setShowSessions(false);
        setError(null);
        setHtmlWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Visualization' })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
        setHistory([]);
        setGeneratedHtml(null);
        setStreamingCode(null);
        setError(null);
        setHtmlWarning(null);
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentSessionId === id) {
          setCurrentSessionId(null);
          setHistory([]);
          setGeneratedHtml(null);
          setStreamingCode(null);
        }
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      outputRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  /**
   * Process completed AI response: extract, validate, repair, and display HTML.
   */
  const finalizeHtml = useCallback((rawHtml: string): void => {
    let html = extractHtml(rawHtml);
    const validation = validateHtml(html);
    
    if (!validation.valid) {
      // Try to repair
      html = repairHtml(html);
      const revalidation = validateHtml(html);
      
      if (!revalidation.valid) {
        setHtmlWarning(validation.error || "The generated visualization may have issues.");
      } else {
        setHtmlWarning("Auto-repaired: " + (validation.error || "minor HTML issues"));
      }
    } else {
      setHtmlWarning(null);
    }
    
    setGeneratedHtml(html);
    setStreamingCode(null);
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setHtmlWarning(null);
    setGeneratedHtml(null);
    setStreamingCode("");
    setViewMode("code");

    // Create session if it doesn't exist
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const res = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: topic.substring(0, 40) + (topic.length > 40 ? '...' : '') })
        });
        if (res.ok) {
          const data = await res.json();
          sessionId = data.id;
          setCurrentSessionId(sessionId);
          fetchSessions();
        } else {
          throw new Error("Failed to create session");
        }
      } catch (e: any) {
        setError(e.message);
        setIsLoading(false);
        return;
      }
    }

    const currentTopic = topic;
    setTopic("");

    try {
      const response = await fetch("/api/generate-viz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: currentTopic, sessionId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to generate' }));
        throw new Error(errData.error || "Failed to generate");
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulatedHtml = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream complete — finalize and validate
          finalizeHtml(accumulatedHtml);
          loadSession(sessionId!); // Reload to get messages with IDs
          setViewMode("preview");
          break;
        }
        accumulatedHtml += decoder.decode(value, { stream: true });
        // During streaming, show raw code (not in iframe — to avoid broken partial renders)
        setStreamingCode(accumulatedHtml);
      }
    } catch (err: any) {
      setError(err.message);
      setStreamingCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editInstruction.trim() || !generatedHtml || !currentSessionId) return;

    setIsLoading(true);
    setError(null);
    setHtmlWarning(null);
    setStreamingCode("");
    setViewMode("code");

    const currentInstruction = editInstruction;
    setEditInstruction("");

    try {
      const response = await fetch("/api/edit-viz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: currentSessionId, 
          currentHtml: generatedHtml, 
          editInstruction: currentInstruction 
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Failed to edit' }));
        throw new Error(errData.error || "Failed to edit");
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulatedHtml = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          finalizeHtml(accumulatedHtml);
          loadSession(currentSessionId);
          setViewMode("preview");
          break;
        }
        accumulatedHtml += decoder.decode(value, { stream: true });
        setStreamingCode(accumulatedHtml);
      }
    } catch (err: any) {
      setError(err.message);
      setStreamingCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (generatedHtml) {
      // Try re-rendering by forcing iframe refresh
      const html = generatedHtml;
      setGeneratedHtml(null);
      setTimeout(() => setGeneratedHtml(html), 50);
    }
  };

  const hasOutput = generatedHtml || streamingCode || isLoading;
  const displayCode = streamingCode || generatedHtml || "";

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full mx-auto overflow-hidden bg-[#050505]">
      
      {/* Sessions Sidebar - Slidable */}
      <AnimatePresence>
        {showSessions && (
          <motion.div 
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0F0F0F] border-r border-white/10 z-40 flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Your Sessions</h2>
              <button onClick={() => setShowSessions(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
               <button 
                 onClick={createNewSession}
                 className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#D4AF37] p-3 rounded-lg border border-[#D4AF37]/30 transition-colors"
               >
                 <Plus size={18} /> New Visualization
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => loadSession(s.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-colors ${currentSessionId === s.id ? 'bg-[#1A1A1A] border border-[#D4AF37]/50' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-white truncate">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(s.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(s.id, e)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-full">
        
        {/* Output Frame */}
        {hasOutput && (
          <div className="absolute inset-0 z-0 flex flex-col bg-[#050505]">
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {(generatedHtml || streamingCode) && !isLoading && (
                    <>
                       <button
                         onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
                         className="bg-black/80 hover:bg-black text-white px-4 py-2 text-xs uppercase tracking-widest font-mono rounded-full backdrop-blur-md flex items-center gap-2 transition-all shadow-lg"
                       >
                         <Terminal size={14} /> {viewMode === 'preview' ? 'Code' : 'Preview'}
                       </button>
                       <button
                          onClick={toggleFullscreen}
                          className="bg-black/80 hover:bg-black text-white w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg"
                       >
                          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                       </button>
                       {htmlWarning && (
                         <button
                            onClick={handleRetry}
                            className="bg-yellow-600/80 hover:bg-yellow-600 text-white w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg"
                            title="Retry rendering"
                         >
                            <RefreshCw size={16} />
                         </button>
                       )}
                       <button
                          onClick={() => {
                            setGeneratedHtml(null);
                            setStreamingCode(null);
                            setViewMode("preview");
                            setHtmlWarning(null);
                          }}
                          className="bg-black/80 hover:bg-black text-white w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-lg ml-2"
                       >
                          <X size={16} />
                       </button>
                    </>
                )}
            </div>

            <div ref={outputRef} className="flex-1 w-full h-full relative bg-[#050505] pb-32">
              {isLoading && !streamingCode ? (
                 <div className="absolute inset-0 bg-[#050505] flex flex-col pt-12 p-6 z-10">
                   <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                         <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
                         <span className="text-white font-mono tracking-widest uppercase text-sm">Synthesizing...</span>
                         <span className="text-gray-500 text-xs">This may take 10–30 seconds</span>
                      </div>
                   </div>
                 </div>
              ) : viewMode === 'preview' && generatedHtml ? (
                <>
                  <iframe
                    ref={iframeRef}
                    srcDoc={generatedHtml}
                    title="Generated Visualization"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0"
                  />
                  {htmlWarning && (
                    <div className="absolute bottom-36 left-4 right-4 mx-auto max-w-xl">
                      <div className="bg-yellow-900/80 backdrop-blur-md border border-yellow-600/50 rounded-xl px-4 py-2 text-yellow-200 text-xs text-center">
                        ⚠️ {htmlWarning}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-[#050505] relative overflow-hidden flex flex-col pt-16 pb-20">
                  <div className="absolute top-0 left-0 right-0 bg-[#0A0A0A] border-b border-white/5 py-2 px-4 flex items-center gap-2 z-10">
                    <Terminal size={14} className="text-[#D4AF37]" />
                    <span className="text-xs text-gray-400 font-mono">
                      {isLoading ? "Synthesizing Code..." : "Source Code"}
                    </span>
                    {isLoading && (
                      <Loader2 size={12} className="animate-spin text-[#D4AF37] ml-2" />
                    )}
                  </div>
                  <textarea
                    className="flex-1 w-full bg-transparent text-emerald-400 font-mono text-sm p-6 focus:outline-none resize-none pt-6"
                    value={displayCode}
                    onChange={(e) => {
                      if (!isLoading) {
                        setGeneratedHtml(e.target.value);
                      }
                    }}
                    readOnly={isLoading}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {/* AI Edit Bar (Visible when output exists) */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 p-4">
              <div className="max-w-4xl mx-auto flex gap-4">
                <button 
                  onClick={() => setShowSessions(!showSessions)}
                  className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                  title="Sessions"
                >
                  <History size={20} />
                </button>
                <form onSubmit={handleEdit} className="flex-1 relative">
                  <Sparkles className="absolute left-3 top-3 text-[#D4AF37]" size={20} />
                  <input
                    type="text"
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="Ask AI to edit this visualization (e.g., 'Make it dark mode', 'Add a speed slider')"
                    className="w-full bg-[#1A1A1A] text-white rounded-xl pl-10 pr-12 py-3 border border-white/10 focus:outline-none focus:border-[#D4AF37]"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !editInstruction.trim()}
                    className="absolute right-2 top-2 bg-[#D4AF37] text-black p-1.5 rounded-lg disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                </form>
              </div>
              {error && (
                 <div className="max-w-4xl mx-auto mt-2 text-center">
                   <span className="text-red-400 text-sm">{error}</span>
                 </div>
              )}
            </div>

          </div>
        )}

        {/* Initial Empty State & Prompt */}
        {!hasOutput && (
          <div className="w-full max-w-3xl mx-auto mt-auto mb-[25vh] px-4 flex flex-col items-center">
             <div className="text-center space-y-6 mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/5 border border-white/10 mb-2">
                    <Sparkles className="text-[#D4AF37]" size={32} />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tight">What do you want to visualize?</h2>
                <p className="text-white/40 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Describe a concept, algorithm, or interactive visualization.
                </p>
             </div>
             
             <form onSubmit={handleGenerate} className="w-full relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 via-[#D4AF37]/20 to-blue-500/10 rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                
                <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowSessions(!showSessions)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <History size={20} />
                  </button>
                  <input
                    type="text"
                    placeholder="E.g. Build an interactive solar system simulation..."
                    className="flex-1 bg-transparent border-none text-white py-3 focus:outline-none text-lg"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!topic.trim() || isLoading}
                    className="w-10 h-10 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  </button>
                </div>
                {error && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}
             </form>
          </div>
        )}

      </div>
    </div>
  );
}
