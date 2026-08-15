import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

export default function BoyleLawLab() {
  const [volume, setVolume] = useState(10); // L (from 5 to 25)
  const [temperature, setTemperature] = useState(298); // K (constant for this simulation, but visible)
  const [moles, setMoles] = useState(0.5); // constant amount of gas
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  const R = 8.314; // Ideal gas constant J/(mol*K)
  const pressurePa = (moles * R * temperature) / (volume / 1000); // PV=nRT (V in m^3)
  const pressureAtm = pressurePa / 101325; // Convert Pa to atm

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setVolume(10);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      {/* Simulation Stage */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Boyle's Law: Gas Compression</h2>
            <p className="text-xs text-white/50 tracking-wide">Observing pressure-volume inverse relationship</p>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative flex justify-center items-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          
          {/* Cylinder / Syringe Simulation */}
          <div className="relative w-48 h-80 border-2 border-white/20 rounded-b-xl flex flex-col justify-end bg-white/5 overflow-hidden">
             {/* Gas Particles */}
             <div 
               className="relative w-full bg-[#D4AF37]/20 border-t border-[#D4AF37]/50 flex items-center justify-center transition-all duration-300"
               style={{ height: `${(volume / 25) * 100}%` }}
             >
                {/* Simulated particles jumping around could go here. We'll use a visual fill to represent density. */}
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: `${Math.max(4, volume)}px ${Math.max(4, volume)}px` }}></div>
                <div className="text-[#D4AF37] font-mono text-xs z-10 drop-shadow-md">Gas Volume</div>
             </div>
             
             {/* Piston */}
             <div 
               className="absolute w-[calc(100%+4px)] -left-0.5 h-6 bg-[#333] border border-white/30 rounded-sm z-20 flex items-center justify-center transition-all duration-300 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
               style={{ bottom: `${(volume / 25) * 100}%` }}
             >
                <div className="w-2 rounded bg-white/20 h-1"></div>
             </div>
             {/* Piston Rod */}
             <div 
               className="absolute w-4 bg-[#222] border-x border-white/10 z-10 left-1/2 -translate-x-1/2 transition-all duration-300"
               style={{ bottom: `calc(${(volume / 25) * 100}% + 24px)`, height: '100%' }}
             ></div>
          </div>

          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
             <div className="w-16 h-16 rounded-full border-4 border-[#1A1A1A] bg-[#0A0A0A] shadow-inner relative flex items-center justify-center">
                <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-full"></div>
                <motion.div 
                  className="absolute bottom-1/2 left-1/2 w-0.5 h-6 bg-[#D4AF37] origin-bottom shadow-[0_0_5px_#D4AF37]"
                  style={{ rotate: `${(pressureAtm / 5) * 270 - 135}deg` }}
                  transition={{ type: "spring", stiffness: 100, damping: 10 }}
                />
                <div className="w-2 h-2 rounded-full bg-white z-10"></div>
             </div>
             <div className="text-[10px] uppercase font-mono text-white/50">Pressure Gauge</div>
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Volume</span>
              <span className="text-xs font-mono text-white">{volume.toFixed(1)} L</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Pressure</span>
              <span className="text-xs font-mono text-[#D4AF37]">{pressureAtm.toFixed(2)} atm</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">P × V (const)</span>
              <span className="text-xs font-mono text-emerald-400">{(pressureAtm * volume).toFixed(1)}</span>
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
                  <label className="text-xs text-white/60">Container Volume</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{volume.toFixed(1)} <span className="text-[10px] text-white/40">L</span></span>
                </div>
                <input 
                  type="range" min="5" max="25" step="0.5" value={volume} 
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full relative z-10 accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Gas Amount</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{moles.toFixed(2)} <span className="text-[10px] text-white/40">mol</span></span>
                </div>
                <input 
                  type="range" min="0.1" max="1.0" step="0.05" value={moles} 
                  onChange={e => setMoles(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group opacity-50 pointer-events-none">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Temperature (Fixed)</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{temperature} <span className="text-[10px] text-white/40">K</span></span>
                </div>
                <input 
                  type="range" min="200" max="400" value={temperature} 
                  onChange={() => {}}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? 'Logging Data' : 'Start Logger'}
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
            <div className="flex-1 font-mono text-[11px] text-white/30 space-y-2 overflow-y-auto max-h-40 pr-2">
              <p className="text-[#D4AF37]/60">[{new Date().toISOString().split('T')[1].slice(0,8)}] Injecting ideal gas into chamber...</p>
              <p>[{new Date().toISOString().split('T')[1].slice(0,8)}] Thermal equilibrium reached at 298K.</p>
              {isRunning && <p className="text-white/60 text-xs italic mt-2 text-[#D4AF37]">Logger active. T={time.toFixed(1)}s -&gt; V: {volume}L, P: {pressureAtm.toFixed(2)}atm</p>}
              <p>_</p>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed">Experiments are logged and archived automatically to the University Central Repository.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
