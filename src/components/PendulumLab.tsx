import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

export default function PendulumLab() {
  const [length, setLength] = useState(200); // map conceptually to 1.00m-3.50m visually
  const [mass, setMass] = useState(10); // 1 to 50
  const [gravity, setGravity] = useState(9.8); // 1 to 25
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  // Math: Period of a pendulum T = 2 * PI * sqrt(L/g)
  const actualLength = length / 100; // conceptually meters
  const period = 2 * Math.PI * Math.sqrt(actualLength / gravity);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + 0.016); // ~16ms ticks
      }, 16);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
  };

  // Angular displacement: theta(t) = theta_max * cos(sqrt(g/L) * t)
  const maxAngle = 35; // degrees initial drop
  const currentAngle = isRunning 
    ? maxAngle * Math.cos(Math.sqrt(gravity / actualLength) * time) 
    : maxAngle;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      
      {/* Simulation Stage */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Simple Pendulum Dynamics</h2>
            <p className="text-xs text-white/50 tracking-wide">Visualizing harmonic motion in vacuum</p>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative flex justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          <div className="absolute inset-0 border-2 border-dashed border-[#D4AF37]/5 m-8 rounded-full pointer-events-none"></div>
          
          {/* Anchor */}
          <div className="w-12 h-1 bg-white/20 rounded-full absolute top-12 left-1/2 -translate-x-1/2 z-10" />
          
          {/* Pendulum Motion Container */}
          <motion.div 
            className="absolute top-12 origin-top flex flex-col items-center"
            style={{ 
              height: length,
              rotate: currentAngle,
            }}
          >
            {/* String */}
            <div className="w-[1px] bg-white/30 flex-1 relative" />
            
            {/* Bob */}
            <div 
              className="rounded-full bg-[#D4AF37] shadow-[0_0_20px_#D4AF37] absolute bottom-0 translate-y-1/2 flex items-center justify-center text-black/50 text-[10px] font-bold"
              style={{ 
                width: Math.max(16, mass + 8), 
                height: Math.max(16, mass + 8),
              }}
            >
              m
            </div>
          </motion.div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Angle</span>
              <span className="text-xs font-mono text-[#D4AF37]">{Math.abs(currentAngle).toFixed(1)}°</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Length</span>
              <span className="text-xs font-mono text-white">{actualLength.toFixed(2)}m</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Period</span>
              <span className="text-xs font-mono text-white">{period.toFixed(2)}s</span>
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
                  <label className="text-xs text-white/60">String Length</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{actualLength.toFixed(2)} <span className="text-[10px] text-white/40">m</span></span>
                </div>
                <input 
                  type="range" min="100" max="350" value={length} 
                  onChange={e => setLength(Number(e.target.value))}
                  className="w-full relative z-10 accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Bob Mass</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{mass.toFixed(1)} <span className="text-[10px] text-white/40">kg</span></span>
                </div>
                <input 
                  type="range" min="1" max="50" value={mass} 
                  onChange={e => setMass(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Gravity Config</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{gravity.toFixed(1)} <span className="text-[10px] text-white/40">m/s²</span></span>
                </div>
                <input 
                  type="range" min="1" max="25" step="0.1" value={gravity} 
                  onChange={e => setGravity(Number(e.target.value))}
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
                {isRunning ? 'Pause' : 'Run'}
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
            <div className="flex-1 font-mono text-[11px] text-white/30 space-y-2">
              <p className="text-[#D4AF37]/60">[{new Date().toISOString().split('T')[1].slice(0,8)}] Initializing vacuum chamber...</p>
              <p>[{new Date().toISOString().split('T')[1].slice(0,8)}] Calibrating variables...</p>
              {isRunning && <p className="text-white/60 text-xs italic mt-2 text-[#D4AF37]">Simulation running. T={time.toFixed(1)}s</p>}
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
