import { useState, useEffect } from 'react';
import { RotateCcw, Droplets } from 'lucide-react';

export default function TitrationLab() {
  const [volBase, setVolBase] = useState(0); // mL added
  const [isDispensing, setIsDispensing] = useState(false);
  const volAcid = 50; // mL
  const molarityAcid = 0.1; // M
  const molarityBase = 0.1; // M

  // Math for strong acid/base titration
  const molesAcid = (volAcid * molarityAcid) / 1000;
  const molesBase = (volBase * molarityBase) / 1000;
  
  let pH = 7.0;
  const totalVol = volAcid + volBase;
  if (molesAcid > molesBase) {
    const conc = (molesAcid - molesBase) / (totalVol / 1000);
    pH = -Math.log10(conc);
  } else if (molesBase > molesAcid) {
    const conc = (molesBase - molesAcid) / (totalVol / 1000);
    pH = 14 + Math.log10(conc);
  } else {
    pH = 7.0;
  }

  let color = 'rgba(255, 255, 255, 0.05)';
  if (pH > 8.2) {
    const intensity = Math.min(1, (pH - 8.2) / 1.8);
    color = `rgba(236, 72, 153, ${Math.min(1, intensity * 0.6 + 0.1)})`; // Pink
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isDispensing) {
      interval = setInterval(() => {
        setVolBase(v => Math.min(100, v + 0.25));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDispensing]);

  const reset = () => {
    setIsDispensing(false);
    setVolBase(0);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      {/* Simulation Stage */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Acid-Base Titration</h2>
            <p className="text-xs text-white/50 tracking-wide">0.1M HCl vs 0.1M NaOH with Phenolphthalein</p>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          
          <div className="relative flex flex-col items-center">
            {/* Burette */}
            <div className="w-8 h-48 border-2 border-white/20 rounded-t-sm border-b-0 relative flex justify-center bg-white/5">
              {/* Scale marks */}
              <div className="absolute left-0 top-0 h-full w-2 flex flex-col justify-between py-2 opacity-30">
                {[...Array(10)].map((_, i) => <div key={i} className="border-b border-white w-full h-[1px]"></div>)}
              </div>
              {/* Liquid in Burette */}
              <div 
                className="absolute bottom-0 w-full bg-slate-200/40 transition-all"
                style={{ height: `${100 - (volBase)}%` }} // 100mL capacity
              />
            </div>
            
            {/* Valve / Stopcock */}
            <div className="w-4 h-6 border-x-2 border-white/20 relative">
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 rounded-full transition-colors ${isDispensing ? 'bg-[#D4AF37]' : 'bg-white/40'}`}></div>
            </div>

            {/* Droplets (Simulated visually) */}
            <div className="h-16 w-1 border-r border-dashed border-white/20 relative">
               {isDispensing && <div className="absolute left-1/2 -translate-x-1/2 top-0 w-2 h-2 rounded-full bg-slate-200/50 animate-bounce"></div>}
            </div>
            
            {/* Flask */}
            <div className="relative w-32 h-32 mt-2">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
                {/* Flask Outline */}
                <path d="M40,0 L60,0 L60,40 L90,90 C95,98 90,105 80,105 L20,105 C10,105 5,98 10,90 L40,40 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                {/* Liquid Fill */}
                <path d="M25,65 L75,65 L88,88 C91,93 88,100 80,100 L20,100 C12,100 9,93 12,88 Z" fill={color} />
              </svg>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/50 px-2 py-0.5 border border-white/10 rounded font-mono">
                {totalVol.toFixed(1)} mL total
              </div>
            </div>
          </div>

          <div className="absolute right-12 top-10 flex flex-col items-center gap-2">
             <div className="w-24 h-24 rounded-full border-4 border-[#1A1A1A] bg-[#0A0A0A] shadow-inner relative flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">pH</span>
                <span className="text-2xl font-mono text-[#D4AF37]">{pH.toFixed(2)}</span>
             </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">NaOH Added</span>
              <span className="text-xs font-mono text-white">{volBase.toFixed(1)} mL</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Indicator</span>
              <span className="text-xs font-mono text-[#D4AF37]">Phenolphthalein</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Current pH</span>
              <span className="text-xs font-mono text-emerald-400">{pH.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Area */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Titration Controls</h3>
            
            <div className="space-y-6">
              <div className="group opacity-50 pointer-events-none">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Acid (HCl) Volume</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">50.0 <span className="text-[10px] text-white/40">mL</span></span>
                </div>
              </div>

              <div className="group opacity-50 pointer-events-none">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Base (NaOH) Conc.</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">0.1 <span className="text-[10px] text-white/40">M</span></span>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-xs text-white/50 font-mono mb-2">Stopcock Valve:</p>
                <button 
                  onMouseDown={() => setIsDispensing(true)}
                  onMouseUp={() => setIsDispensing(false)}
                  onMouseLeave={() => setIsDispensing(false)}
                  onTouchStart={() => setIsDispensing(true)}
                  onTouchEnd={() => setIsDispensing(false)}
                  className={`w-full py-4 flex flex-col items-center justify-center gap-2 rounded transition-colors ${isDispensing ? 'bg-[#D4AF37]/20 border-[#D4AF37] border' : 'bg-[#1A1A1A] border border-white/20 hover:bg-white/10'}`}
                >
                  <Droplets size={20} className={isDispensing ? 'text-[#D4AF37]' : 'text-white/40'} />
                  <span className="text-[10px] uppercase tracking-widest text-white">Press & Hold to Dispense</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={reset}
                className="w-full py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"
                title="Reset Titration"
              >
                <RotateCcw size={14} /> Reset Experiment
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Simulation Output</h3>
            <div className="flex-1 font-mono text-[11px] text-white/30 space-y-2 overflow-y-auto max-h-40 pr-2">
              <p className="text-[#D4AF37]/60">[{new Date().toISOString().split('T')[1].slice(0,8)}] Burette filled with 0.1M NaOH.</p>
              <p>[{new Date().toISOString().split('T')[1].slice(0,8)}] Erlenmeyer flask contains 50mL 0.1M HCl.</p>
              {volBase > 0 && <p className="text-white/60">Titrating... Added {volBase.toFixed(1)}mL, pH={pH.toFixed(2)}</p>}
              {pH > 8.2 && <p className="text-[#D4AF37]">Endpoint reached! Phenolphthalein turned pink.</p>}
              <p>_</p>
            </div>
         </div>
      </div>
    </div>
  );
}
