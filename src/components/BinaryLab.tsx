import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function BinaryLab() {
  const [bits, setBits] = useState<number[]>(Array(8).fill(0));

  const toggleBit = (index: number) => {
    const newBits = [...bits];
    newBits[index] = newBits[index] === 0 ? 1 : 0;
    setBits(newBits);
  };

  const setDecimal = (value: number) => {
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 255) value = 255;
    const binaryStr = value.toString(2).padStart(8, '0');
    setBits(binaryStr.split('').map(Number));
  };

  const decimalValue = bits.reduce((acc, bit, idx) => acc + bit * Math.pow(2, 7 - idx), 0);
  const hexValue = decimalValue.toString(16).toUpperCase().padStart(2, '0');

  const placeValues = [128, 64, 32, 16, 8, 4, 2, 1];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Binary Systems</h2>
            <p className="text-xs text-white/50 tracking-wide">Base-2 to Base-10 conversion</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex flex-col items-center justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
          
          {/* Main Visualizer */}
          <div className="relative flex flex-col items-center gap-12 z-10 w-full px-10">
            
            <div className="flex gap-4 w-full justify-center">
              {bits.map((bit, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4 cursor-pointer group" onClick={() => toggleBit(idx)}>
                  <div className="text-[10px] text-white/30 font-mono group-hover:text-white/50 transition-colors">
                     2<sup className="text-[8px]">{7-idx}</sup>
                  </div>
                  <div className="text-xs text-white/50 font-mono mb-2">
                     {placeValues[idx]}
                  </div>
                  
                  {/* Bit Toggle Visualization */}
                  <div 
                    className={`w-16 h-24 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                       bit === 1 
                         ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                         : 'bg-black border-white/10 shadow-inner'
                    }`}
                  >
                     <span className={`text-4xl font-mono transition-colors ${bit === 1 ? 'text-[#D4AF37]' : 'text-white/20'}`}>
                       {bit}
                     </span>
                  </div>

                  {/* Math representation below */}
                  <div className={`text-xs font-mono transition-colors mt-2 ${bit === 1 ? 'text-emerald-400' : 'text-white/20'}`}>
                    {bit === 1 ? placeValues[idx] : 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Summation Display */}
            <div className="flex items-center gap-4 text-white/40 font-mono text-sm border-t border-white/10 pt-8 mt-4 w-full justify-center flex-wrap px-10">
               {bits.map((bit, idx) => (
                 <span key={idx} className={bit === 1 ? 'text-emerald-400' : 'text-white/20'}>
                   {bit === 1 ? placeValues[idx] : 0}
                   {idx < 7 && ' + '}
                 </span>
               ))}
               <span className="text-white">=</span>
               <span className="text-2xl text-white font-bold">{decimalValue}</span>
            </div>

          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Binary (Base 2)</span>
              <span className="text-xs font-mono text-[#D4AF37] tracking-[0.2em]">{bits.join('')}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Decimal (Base 10)</span>
              <span className="text-xs font-mono text-emerald-400">{decimalValue}</span>
            </div>
             <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Hex (Base 16)</span>
              <span className="text-xs font-mono text-rose-400">0x{hexValue}</span>
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
                  <label className="text-xs text-white/60">Decimal Input</label>
                </div>
                <input 
                  type="number" min="0" max="255" value={decimalValue} 
                  onChange={e => setDecimal(parseInt(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="0 - 255"
                />
                <p className="text-[10px] text-white/30 mt-2">Enter a number between 0 and 255</p>
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Hexadecimal Input</label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono">0x</span>
                  <input 
                    type="text" maxLength={2} value={hexValue} 
                    onChange={e => {
                       const val = parseInt(e.target.value, 16);
                       if (!isNaN(val)) setDecimal(val);
                    }}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 pl-8 text-white font-mono focus:outline-none focus:border-[#D4AF37] transition-colors uppercase"
                    placeholder="00 - FF"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => setBits(Array(8).fill(0))}
                className="w-full py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                <RotateCcw size={14} /> Clear Bits
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
             <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">ASCII Character</h3>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-col shadow-inner">
                <span className="text-[10px] text-white/30 mb-2 uppercase tracking-widest">Char</span>
                <span className="text-5xl font-mono text-white">
                  {decimalValue >= 32 && decimalValue <= 126 ? String.fromCharCode(decimalValue) : '·'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                Click individual bits to toggle between 0 and 1. Watch how the powers of 2 sum to create the decimal value.
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}
