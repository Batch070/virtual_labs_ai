import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

export default function PopulationLab() {
  const [capacity, setCapacity] = useState(1000); 
  const [growthRate, setGrowthRate] = useState(0.1); 
  const [population, setPopulation] = useState(10); 
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [history, setHistory] = useState<{t: number, p: number}[]>([{t: 0, p: 10}]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => {
          const nextT = t + 1;
          setPopulation(p => {
             // Logistic growth formula: dN/dt = rN(1 - N/K)
             const dp = growthRate * p * (1 - p / capacity);
             const nextP = Math.max(0, p + dp * 10); // scale up dt for visual
             
             setHistory(h => {
               const newH = [...h, { t: nextT, p: nextP }];
               if (newH.length > 50) newH.shift();
               return newH;
             });
             return nextP;
          });
          return nextT;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isRunning, capacity, growthRate]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setPopulation(10);
    setHistory([{t: 0, p: 10}]);
  };

  const getVisualCount = (pop: number) => {
     // Scale down for visual performance
     return Math.min(200, Math.floor(pop / 10));
  };

  const visualBugs = Array.from({ length: getVisualCount(population) }).map((_, i) => ({
    id: i,
    x: (Math.sin(i * 1.5) * 40 + 50) % 100,
    y: (Math.cos(i * 3.1) * 40 + 50) % 100,
    scale: 0.5 + (i % 5) * 0.1
  }));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      {/* Simulation Stage */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Bacterial Population Growth</h2>
            <p className="text-xs text-white/50 tracking-wide">Observing logistic growth and carrying capacity</p>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative flex justify-center items-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          
          {/* Petri Dish */}
          <div className="relative w-80 h-80 rounded-full border-4 border-white/10 bg-[#1A1111]/80 shadow-2xl flex items-center justify-center overflow-hidden">
             {/* Culture medium */}
             <div className="absolute inset-2 rounded-full border border-rose-900/30 bg-[radial-gradient(ellipse_at_center,_rgba(159,18,57,0.1)_0%,_transparent_70%)]"></div>
             
             {/* Bacteria */}
             {visualBugs.map((bug) => (
                <div 
                  key={bug.id}
                  className="absolute w-2 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)] opacity-80"
                  style={{
                    left: `${bug.x}%`,
                    top: `${bug.y}%`,
                    transform: `scale(${bug.scale}) rotate(${bug.id * 45}deg)`,
                    transition: 'all 0.5s ease-out'
                  }}
                />
             ))}

             <div className="absolute w-full h-full rounded-full shadow-inner border border-white/5 pointer-events-none"></div>
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Population</span>
              <span className="text-xs font-mono text-rose-400">{Math.floor(population)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Time (hrs)</span>
              <span className="text-xs font-mono text-white">{(time).toFixed(1)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">% of Capacity</span>
              <span className="text-xs font-mono text-white">{((population / capacity) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Area */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         {/* Variables Control */}
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Environment Matrix</h3>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Carrying Capacity (K)</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{capacity} <span className="text-[10px] text-white/40">cells</span></span>
                </div>
                <input 
                  type="range" min="100" max="5000" step="100" value={capacity} 
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full relative z-10 accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Growth Rate (r)</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{growthRate.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.01" max="0.30" step="0.01" value={growthRate} 
                  onChange={e => setGrowthRate(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? 'Pause' : 'Incubate'}
              </button>
              <button 
                onClick={reset}
                className="px-4 py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center"
                title="Reset Simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>
         </div>

         {/* Log / Output Card */}
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Simulation Output</h3>
            
            {/* Simple graph visualization */}
            <div className="h-24 w-full border-b border-l border-white/10 mb-4 relative flex items-end pt-2 pb-1">
               {history.map((pt, i) => {
                 const x = (i / 50) * 100;
                 const h = Math.min(100, (pt.p / Math.max(capacity, 1000)) * 100);
                 return (
                   <div key={i} className="absolute bottom-0 w-[2%] bg-rose-500/50" style={{ left: `${x}%`, height: `${h}%` }}></div>
                 );
               })}
               <div className="absolute left-0 bottom-[100%] w-full border-t border-dashed border-white/10" style={{ bottom: `${(capacity / Math.max(capacity, 1000)) * 100}%` }}></div>
            </div>

            <div className="flex-1 font-mono text-[11px] text-white/30 space-y-2 overflow-y-auto pr-2">
              <p className="text-[#D4AF37]/60">[{new Date().toISOString().split('T')[1].slice(0,8)}] Preparing culture medium...</p>
              <p>[{new Date().toISOString().split('T')[1].slice(0,8)}] Inoculating with N0=10.</p>
              <p>_</p>
            </div>
         </div>
      </div>
    </div>
  );
}
