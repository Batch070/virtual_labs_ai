import { useState } from 'react';
import { RotateCcw, Zap } from 'lucide-react';

export default function CircuitLab() {
  const [voltage, setVoltage] = useState(12); // V
  const [resistance, setResistance] = useState(100); // Ohms

  const current = voltage / resistance; // I = V / R (Amps)
  const power = voltage * current; // P = V * I (Watts)

  // Visuals
  const currentSpeed = current > 0 ? Math.max(0.5, 3 - current * 5) : 0; // faster animation for higher current
  // Intensity of light bulb/resistor
  const glowIntensity = Math.min(100, power * 2); // W -> scale to glow

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      {/* Simulation Stage */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Ohm's Law in DC Circuits</h2>
            <p className="text-xs text-white/50 tracking-wide">Interactive V = IR verification</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          
          <div className="relative w-96 h-64 border-4 border-[#333] rounded-lg">
             {/* Battery component (Left) */}
             <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-20 bg-[#1A1A1A] border-2 border-white/20 flex flex-col items-center justify-between py-2 z-10 shadow-lg">
                <div className="text-rose-500 font-bold">+</div>
                <div className="text-xs font-mono text-white/50">{voltage}V</div>
                <div className="text-blue-500 font-bold">-</div>
             </div>

             {/* Resistor / Bulb component (Right) */}
             <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-24 flex items-center justify-center z-10">
                <div 
                  className="w-16 h-16 rounded-full border-2 border-white/20 bg-black/50 transition-all duration-300 flex items-center justify-center relative"
                  style={{ 
                     boxShadow: `0 0 ${glowIntensity}px ${glowIntensity/2}px rgba(255, 200, 50, ${glowIntensity/100})`,
                     backgroundColor: power > 0 ? `rgba(255, 230, 100, ${glowIntensity/200})` : 'rgba(0,0,0,0.5)'
                  }}
                >
                   {power > 0 && <Zap size={24} className="text-[#D4AF37] absolute" style={{ opacity: glowIntensity/100 }} />}
                   <div className="absolute -bottom-8 text-xs font-mono text-white/50 bg-[#0F0F0F] px-2 py-0.5 border border-white/10 rounded whitespace-nowrap">
                      {resistance} Ω
                   </div>
                </div>
             </div>

             {/* Ammeter (Top) */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#1A1A1A] rounded-full border-4 border-[#333] flex flex-col items-center justify-center z-10 shadow-lg">
                <span className="text-[10px] text-white/40 uppercase">Amps</span>
                <span className="font-mono text-[#D4AF37] font-bold">{(current * 1000).toFixed(0)}m</span>
             </div>

             {/* Animated Current flow (simulated with CSS keyframes if needed, or visual dashed border) */}
             <div 
               className="absolute inset-0 border-4 border-dashed border-white/10"
               style={{ 
                  animation: current > 0 ? `dash ${currentSpeed}s linear infinite` : 'none',
               }}
             >
               <style>{`
                 @keyframes dash {
                   to {
                     stroke-dashoffset: -100;
                   }
                 }
               `}</style>
             </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Voltage (V)</span>
              <span className="text-xs font-mono text-white">{voltage} V</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Current (I)</span>
              <span className="text-xs font-mono text-[#D4AF37]">{current.toFixed(4)} A</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Power (P)</span>
              <span className="text-xs font-mono text-emerald-400">{power.toFixed(2)} W</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Module Parameters</h3>
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Source Voltage</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{voltage} <span className="text-[10px] text-white/40">V</span></span>
                </div>
                <input 
                  type="range" min="0" max="24" step="1" value={voltage} 
                  onChange={e => setVoltage(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Load Resistance</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{resistance} <span className="text-[10px] text-white/40">Ω</span></span>
                </div>
                <input 
                  type="range" min="10" max="500" step="10" value={resistance} 
                  onChange={e => setResistance(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => { setVoltage(12); setResistance(100); }}
                className="w-full py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                <RotateCcw size={14} /> Reset Circuit
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Live Telemetry</h3>
            <div className="space-y-4">
               <div className="flex justify-between">
                  <span className="text-xs text-white/60 font-mono">Current (mA):</span>
                  <span className="text-xs text-[#D4AF37] font-mono">{(current * 1000).toFixed(1)} mA</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-xs text-white/60 font-mono">Dissipation:</span>
                  <span className="text-xs text-white font-mono">{power.toFixed(3)} W</span>
               </div>
            </div>
            <div className="mt-auto p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                Verified: V = IR <br/>
                {voltage} = {current.toFixed(3)} * {resistance}
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}
