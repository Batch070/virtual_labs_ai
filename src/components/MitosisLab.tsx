import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function MitosisLab() {
  const [phase, setPhase] = useState(0); // 0 to 4 (Prophase to Telophase)
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setPhase(p => {
           if (p >= 100) {
              setIsRunning(false);
              return 100;
           }
           return p + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setPhase(0);
  };

  const currentStageName = phase < 20 ? 'Interphase' : phase < 40 ? 'Prophase' : phase < 60 ? 'Metaphase' : phase < 80 ? 'Anaphase' : 'Telophase';

  // Visual layout of chromosomes based on phase 0..100
  // Interphase (0-20): scattered dot cloud
  // Prophase (20-40): distinct Xs
  // Metaphase (40-60): aligned in middle
  // Anaphase (60-80): pulling apart
  // Telophase (80-100): separating into two nuclei
  
  const getTransform = (id: number) => {
     const p = phase;
     if (p < 20) return `translate(${Math.sin(id*5)*20}px, ${Math.cos(id*3)*20}px) scale(0.5)`;
     if (p < 40) return `translate(${Math.sin(id*5)*30}px, ${Math.cos(id*3)*30}px) scale(1)`;
     if (p < 60) return `translate(0px, ${(id-2)*15}px) scale(1)`;
     if (p < 80) return `translate(${id % 2 === 0 ? -40 : 40}px, ${(id-2)*15}px) scale(0.8)`;
     return `translate(${id % 2 === 0 ? -80 : 80}px, ${Math.cos(id*3)*15}px) scale(0.5)`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Mitosis Observation</h2>
            <p className="text-xs text-white/50 tracking-wide">Cell division timeline</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1 p-10 pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none" />
          
          {/* Main Cell Membrane */}
          <div 
             className="relative border-4 border-white/10 rounded-[40%] flex items-center justify-center transition-all duration-1000"
             style={{
                width: phase > 80 ? '400px' : '300px',
                height: phase > 80 ? '200px' : '300px',
                backgroundColor: 'rgba(255,100,100,0.05)',
                boxShadow: phase > 80 ? 'inset 0 0 50px rgba(255,0,0,0.1)' : 'inset 0 0 20px rgba(255,0,0,0.1)'
             }}
          >
             {/* Nucleus / Chromosomes */}
             {[0,1,2,3,4,5].map(id => (
                <div 
                  key={id}
                  className="absolute w-2 h-8 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)] transition-all duration-1000"
                  style={{
                     transform: getTransform(id)
                  }}
                />
             ))}

             {/* Spindle Fibers (Visible in meta/ana) */}
             {(phase > 40 && phase < 80) && (
               <>
                 <div className="absolute top-1/2 left-4 w-10 h-0.5 bg-white/20 origin-left" style={{ transform: 'rotate(15deg)' }}></div>
                 <div className="absolute top-1/2 right-4 w-10 h-0.5 bg-white/20 origin-right" style={{ transform: 'rotate(-15deg)' }}></div>
               </>
             )}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Current Stage</span>
              <span className="text-xs font-mono text-[#D4AF37]">{currentStageName}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Timeline</span>
              <span className="text-xs font-mono text-emerald-400">{phase}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Controls</h3>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Manual Scrub</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{phase}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1" value={phase} 
                  onChange={e => setPhase(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? 'Pause Time' : 'Play Time'}
              </button>
              <button 
                onClick={reset}
                className="px-4 py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors"
                title="Reset Stage"
              >
                <RotateCcw size={14} />
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
