import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function EnzymeLab() {
  const [substrate, setSubstrate] = useState(10); // [S]
  const [vmax, setVmax] = useState(50); 
  const [km, setKm] = useState(15); 
  
  // Rate calc
  const velocity = (vmax * substrate) / (km + substrate);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Enzyme Kinetics</h2>
            <p className="text-xs text-white/50 tracking-wide">Michaelis-Menten Plotting</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1 p-10 pb-20">
          
          <div className="w-full h-full border-l border-b border-white/20 relative flex items-end">
             {/* Chart logic */}
             <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
               {/* Theoretical curve */}
               <path 
                 d={`M 0 100 ` + Array.from({length: 100}).map((_, i) => {
                    const s = i; 
                    const v = (vmax * s) / (km + s);
                    // scale visually. max v is 100.
                    return `L ${i} ${100 - v}`;
                 }).join(' ')}
                 fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
               />
               
               {/* Current point */}
               <circle cx={substrate} cy={100 - velocity} r="2" fill="#D4AF37" className="transition-all duration-300" />
             </svg>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Substrate [S]</span>
              <span className="text-xs font-mono text-white">{substrate} mM</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Reaction Rate (V)</span>
              <span className="text-xs font-mono text-[#D4AF37]">{velocity.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Parameters</h3>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Substrate Concentration</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{substrate} <span className="text-[10px] text-white/40">mM</span></span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1" value={substrate} 
                  onChange={e => setSubstrate(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Vmax</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{vmax}</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="1" value={vmax} 
                  onChange={e => setVmax(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Km (Michaelis Constant)</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{km} <span className="text-[10px] text-white/40">mM</span></span>
                </div>
                <input 
                  type="range" min="5" max="50" step="1" value={km} 
                  onChange={e => setKm(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
