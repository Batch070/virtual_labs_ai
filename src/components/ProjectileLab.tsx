import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function ProjectileLab() {
  const [velocity, setVelocity] = useState(25); // m/s
  const [angle, setAngle] = useState(45); // deg
  const [gravity, setGravity] = useState(9.8); // m/s²
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  const angleRad = (angle * Math.PI) / 180;
  const tMax = (2 * velocity * Math.sin(angleRad)) / gravity;
  const xMax = (velocity * velocity * Math.sin(2 * angleRad)) / gravity;
  const yMax = (velocity * velocity * Math.pow(Math.sin(angleRad), 2)) / (2 * gravity);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => {
          if (t >= tMax) {
            setIsRunning(false);
            return tMax;
          }
          return t + 0.05;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRunning, tMax]);

  const currentX = velocity * Math.cos(angleRad) * time;
  const currentY = velocity * Math.sin(angleRad) * time - 0.5 * gravity * time * time;

  const reset = () => {
    setIsRunning(false);
    setTime(0);
  };

  // Canvas mapping (scaling to fit visually)
  const scale = Math.min(600 / Math.max(100, xMax), 300 / Math.max(50, yMax));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Projectile Motion</h2>
            <p className="text-xs text-white/50 tracking-wide">Kinematic trajectory visualization</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-end justify-start bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1 pl-10 pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
          
          {/* Grid setup */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '50px 50px', backgroundPosition: 'left bottom' }}></div>

          {/* Theoretical Trajectory Arc */}
          <svg className="absolute left-10 bottom-20 overflow-visible pointer-events-none" style={{ width: xMax * scale, height: yMax * scale }}>
             <path 
                fill="transparent" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
                d={`M 0,${yMax * scale} Q ${xMax/2 * scale},${-yMax * scale} ${xMax * scale},${yMax * scale}`}
             />
          </svg>

          {/* The Projectile */}
          <div 
             className="absolute w-4 h-4 bg-[#D4AF37] rounded-full shadow-[0_0_15px_#D4AF37] z-10 -ml-2 -mb-2"
             style={{
                left: `calc(2.5rem + ${currentX * scale}px)`,
                bottom: `calc(5rem + ${currentY * scale}px)`
             }}
          ></div>
          
          {/* Ground */}
          <div className="absolute bottom-0 left-0 w-full h-20 border-t border-white/20 bg-white/5"></div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10 z-20">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Dist (X)</span>
              <span className="text-xs font-mono text-white">{currentX.toFixed(1)} m</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Height (Y)</span>
              <span className="text-xs font-mono text-[#D4AF37]">{Math.max(0, currentY).toFixed(1)} m</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Time</span>
              <span className="text-xs font-mono text-emerald-400">{time.toFixed(1)} s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Launch Matrix</h3>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Initial Velocity</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{velocity} <span className="text-[10px] text-white/40">m/s</span></span>
                </div>
                <input 
                  type="range" min="5" max="50" step="1" value={velocity} 
                  onChange={e => setVelocity(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Launch Angle</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{angle}°</span>
                </div>
                <input 
                  type="range" min="10" max="80" step="1" value={angle} 
                  onChange={e => setAngle(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  disabled={isRunning}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Gravity</label>
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
                {isRunning ? 'Pause' : 'Fire'}
              </button>
              <button 
                onClick={reset}
                className="px-4 py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center"
                title="Reset Sim"
              >
                <RotateCcw size={14} />
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Calculated Bounds</h3>
            <div className="space-y-4">
               <div className="flex justify-between">
                  <span className="text-xs text-white/60 font-mono">Max Range (R):</span>
                  <span className="text-xs text-white font-mono">{xMax.toFixed(2)} m</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-xs text-white/60 font-mono">Max Height (H):</span>
                  <span className="text-xs text-white font-mono">{yMax.toFixed(2)} m</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-xs text-white/60 font-mono">Flight Time (T):</span>
                  <span className="text-xs text-[#D4AF37] font-mono">{tMax.toFixed(2)} s</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
