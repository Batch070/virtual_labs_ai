import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Cpu, Download, Database } from 'lucide-react';

export default function MemoryLab() {
  const MEMORY_SIZE = 128; // 128 bytes (8 rows of 16 bytes)
  const [memory, setMemory] = useState<number[]>(Array(MEMORY_SIZE).fill(0));
  const [selectedAddr, setSelectedAddr] = useState<number>(0);
  const [byteInput, setByteInput] = useState<string>("00");
  const [stringInput, setStringInput] = useState<string>("HELLO");
  const [isWriting, setIsWriting] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBlip = (val: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    // Map 0-255 to frequency (base 200Hz + val * 5)
    osc.frequency.value = 200 + val * 3;
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const handleWriteByte = () => {
    const val = parseInt(byteInput, 16);
    if (!isNaN(val) && val >= 0 && val <= 255) {
      setMemory(prev => {
        const next = [...prev];
        next[selectedAddr] = val;
        return next;
      });
      playBlip(val);
    }
  };

  const clearMemory = () => {
    setMemory(Array(MEMORY_SIZE).fill(0));
    setSelectedAddr(0);
  };

  const handleWriteString = async () => {
    if (isWriting) return;
    setIsWriting(true);
    
    for (let i = 0; i < stringInput.length && (selectedAddr + i) < MEMORY_SIZE; i++) {
        const addr = selectedAddr + i;
        const val = stringInput.charCodeAt(i) & 0xFF;
        
        await new Promise<void>(resolve => {
           setTimeout(() => {
              setMemory(prev => {
                  const next = [...prev];
                  next[addr] = val;
                  return next;
              });
              setSelectedAddr(addr);
              playBlip(val);
              resolve();
           }, 80); // ms per byte
        });
    }
    setIsWriting(false);
  };

  // Keyboard navigation
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement) return;
        
        let newAddr = selectedAddr;
        if (e.key === 'ArrowRight') newAddr++;
        else if (e.key === 'ArrowLeft') newAddr--;
        else if (e.key === 'ArrowUp') newAddr -= 16;
        else if (e.key === 'ArrowDown') newAddr += 16;

        if (newAddr >= 0 && newAddr < MEMORY_SIZE) {
            setSelectedAddr(newAddr);
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAddr, MEMORY_SIZE]);

  useEffect(() => {
     setByteInput(memory[selectedAddr].toString(16).padStart(2, '0').toUpperCase());
  }, [selectedAddr, memory]);

  const selectedValue = memory[selectedAddr];
  const selectedBinary = selectedValue.toString(2).padStart(8, '0');
  const selectedAscii = (selectedValue >= 32 && selectedValue <= 126) ? String.fromCharCode(selectedValue) : '.';

  const rows = Math.ceil(MEMORY_SIZE / 16);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto select-none">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group overflow-hidden">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#0F0F0F] z-20 shrink-0">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">RAM Architecture</h2>
            <p className="text-xs text-white/50 tracking-wide">Hex dump array visualization</p>
          </div>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#D4AF37]" />
            <span className="font-mono text-xs text-white/50">{MEMORY_SIZE} Bytes Allocated</span>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-auto rounded-b-2xl border-t border-black/20 m-1 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none" />
          
          <div className="font-mono text-xs w-full max-w-4xl tracking-wider">
            {/* Header Offset Row */}
            <div className="flex gap-2 mb-4 text-[#D4AF37]/50 uppercase items-center pb-2 border-b border-white/10">
               <div className="w-16 shrink-0 text-center">Addr</div>
               <div className="flex gap-1.5 flex-1 justify-between px-2 border-l border-r border-[#D4AF37]/20">
                  {Array.from({length: 16}).map((_, i) => (
                      <div key={i} className="w-6 text-center">{i.toString(16).padStart(2,'0')}</div>
                  ))}
               </div>
               <div className="w-32 shrink-0 text-center">ASCII Decode</div>
            </div>

            {/* Memory Rows (Hex Dump) */}
            {Array.from({length: rows}).map((_, r) => {
               const baseAddr = r * 16;
               return (
                   <div key={r} className="flex gap-2 mb-1.5 items-center group">
                       {/* Base Address */}
                       <div className="w-16 shrink-0 text-[#D4AF37] text-center opacity-70 group-hover:opacity-100 transition-opacity">
                          0x{baseAddr.toString(16).padStart(4, '0').toUpperCase()}
                       </div>
                       
                       {/* Hex Block */}
                       <div className="flex gap-1.5 flex-1 justify-between px-2 bg-white/[0.02] rounded py-1">
                          {Array.from({length: 16}).map((_, c) => {
                              const addr = baseAddr + c;
                              const val = memory[addr];
                              const isSelected = addr === selectedAddr;
                              
                              let className = "w-6 text-center rounded transition-colors cursor-pointer py-0.5 ";
                              if (isSelected) {
                                 className += "bg-[#D4AF37] text-black font-bold shadow-[0_0_8px_#D4AF37]";
                              } else if (val > 0) {
                                 className += "text-emerald-400 hover:bg-emerald-400/20";
                              } else {
                                 className += "text-white/20 hover:bg-white/10 hover:text-white";
                              }

                              return (
                                  <div 
                                    key={c} 
                                    onClick={() => setSelectedAddr(addr)}
                                    className={className}
                                  >
                                      {val.toString(16).padStart(2, '0').toUpperCase()}
                                  </div>
                              )
                          })}
                       </div>

                       {/* ASCII Decoding */}
                       <div className="w-32 shrink-0 text-white/30 tracking-[0.25em] flex justify-center bg-black/40 rounded py-1 border border-white/5">
                          {Array.from({length: 16}).map((_, c) => {
                              const addr = baseAddr + c;
                              const val = memory[addr];
                              const isSelected = addr === selectedAddr;
                              const char = (val >= 32 && val < 127) ? String.fromCharCode(val) : '.';
                              
                              let charClass = "transition-colors ";
                              if (isSelected) charClass += "text-[#D4AF37] font-bold bg-[#D4AF37]/20 rounded";
                              else if (val >= 32 && val < 127) charClass += "text-emerald-300";
                              else charClass += "opacity-40";

                              return <span key={c} className={charClass}>{char}</span>
                          })}
                       </div>
                   </div>
               )
            })}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         {/* Inspector block */}
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Cell Inspector</h3>
            
            <div className="flex justify-between items-center bg-[#050505] p-3 rounded border border-white/5">
                <span className="text-xs font-mono text-white/50">Address</span>
                <span className="text-sm font-mono text-[#D4AF37]">0x{selectedAddr.toString(16).padStart(4, '0').toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050505] p-3 rounded border border-white/5 flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-mono uppercase text-white/40">Binary</span>
                    <span className="text-xs font-mono text-emerald-400">{selectedBinary}</span>
                </div>
                <div className="bg-[#050505] p-3 rounded border border-white/5 flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-mono uppercase text-white/40">Decimal</span>
                    <span className="text-xs font-mono text-white">{selectedValue}</span>
                </div>
                <div className="bg-[#050505] p-3 rounded border border-white/5 flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-mono uppercase text-white/40">Hex</span>
                    <span className="text-xs font-mono text-[#D4AF37]">0x{selectedValue.toString(16).padStart(2,'0').toUpperCase()}</span>
                </div>
                <div className="bg-[#050505] p-3 rounded border border-white/5 flex flex-col gap-1 items-start">
                    <span className="text-[9px] font-mono uppercase text-white/40">ASCII</span>
                    <span className="text-xs font-mono text-white">{selectedAscii}</span>
                </div>
            </div>
         </div>

         {/* Write tools */}
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6 gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Modify Memory</h3>
            
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2 block">Write Byte (Hex)</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        maxLength={2}
                        value={byteInput}
                        onChange={(e) => setByteInput(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
                        className="w-16 bg-[#050505] border border-white/10 rounded px-2 text-center text-white font-mono focus:border-[#D4AF37] outline-none"
                     />
                     <button 
                        onClick={handleWriteByte}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-mono rounded transition-colors"
                     >
                        Write to 0x{selectedAddr.toString(16).padStart(4, '0').toUpperCase()}
                     </button>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2 block">Write Payload (String)</label>
                  <div className="flex flex-col gap-2">
                     <input 
                        type="text" 
                        value={stringInput}
                        onChange={(e) => setStringInput(e.target.value.substring(0, 32))}
                        placeholder="Hello World"
                        className="w-full bg-[#050505] border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                        disabled={isWriting}
                     />
                     <button 
                        onClick={handleWriteString}
                        disabled={isWriting || !stringInput}
                        className="w-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 py-2 text-[10px] font-mono uppercase tracking-widest rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        <Download size={14} /> 
                        {isWriting ? 'Writing...' : 'Inject Payload'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="mt-auto">
               <button 
                  onClick={clearMemory}
                  className="w-full py-3 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest bg-rose-500/5 mt-4"
               >
                  <RotateCcw size={14} /> Format Memory
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
