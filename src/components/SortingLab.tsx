import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle, BarChart2 } from 'lucide-react';

type SortStep = {
  arr: number[];
  active: number[];
  sorted: number[];
};

function* bubbleSort(initialArr: number[]): Generator<SortStep, void, unknown> {
  const arr = [...initialArr];
  const sorted: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let swapped = false;
    for (let j = 0; j < arr.length - i - 1; j++) {
      yield { arr, active: [j, j + 1], sorted };
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
        yield { arr, active: [j, j + 1], sorted };
      }
    }
    sorted.push(arr.length - 1 - i);
    yield { arr, active: [], sorted };
    if (!swapped) {
      for (let k = 0; k < arr.length - i - 1; k++) {
        sorted.unshift(k);
      }
      yield { arr, active: [], sorted: [...sorted] };
      break;
    }
  }
  yield { arr, active: [], sorted: arr.map((_, i) => i) };
}

function* selectionSort(initialArr: number[]): Generator<SortStep, void, unknown> {
  const arr = [...initialArr];
  const sorted: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
       yield { arr, active: [minIdx, j], sorted };
       if (arr[j] < arr[minIdx]) {
          minIdx = j;
       }
    }
    if (minIdx !== i) {
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
      yield { arr, active: [i, minIdx], sorted };
    }
    sorted.push(i);
    yield { arr, active: [], sorted };
  }
  yield { arr, active: [], sorted: arr.map((_, i) => i) };
}

function* insertionSort(initialArr: number[]): Generator<SortStep, void, unknown> {
  const arr = [...initialArr];
  const sorted: number[] = [0]; 
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0 && arr[j - 1] > arr[j]) {
       yield { arr, active: [j - 1, j], sorted };
       const temp = arr[j];
       arr[j] = arr[j - 1];
       arr[j - 1] = temp;
       yield { arr, active: [j - 1, j], sorted };
       j--;
    }
    sorted.push(i);
    yield { arr, active: [], sorted };
  }
  yield { arr, active: [], sorted: arr.map((_, i) => i) };
}

const COMPLEXITIES = {
  Bubble: { best: 'Ω(n)', avg: 'Θ(n²)', worst: 'O(n²)' },
  Selection: { best: 'Ω(n²)', avg: 'Θ(n²)', worst: 'O(n²)' },
  Insertion: { best: 'Ω(n)', avg: 'Θ(n²)', worst: 'O(n²)' },
};

export default function SortingLab() {
  const [array, setArray] = useState<number[]>([]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<'Bubble'|'Selection'|'Insertion'>('Bubble');
  const [speed, setSpeed] = useState(100); // 10 to 200
  
  const generatorRef = useRef<Generator<SortStep, void, unknown> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNote = (val: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    const freq = 150 + val * 8; // map 10-100 to sensible frequencies
    osc.frequency.value = freq;
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const generateArray = () => {
    // Reduced element count to 25 for better visibility of numbers
    const newArr = Array.from({ length: 25 }, () => Math.floor(Math.random() * 90) + 10);
    setArray(newArr);
    setActiveIndices([]);
    setSortedIndices([]);
    setIsRunning(false);
    generatorRef.current = null;
  };

  useEffect(() => {
    generateArray();
  }, []);

  // When changing algorithm, reset.
  useEffect(() => {
    generateArray();
  }, [algorithm]);

  const toggleRun = () => {
    if (!isRunning) {
      if (sortedIndices.length === array.length) {
         generateArray();
         return; 
      }
      if (!generatorRef.current) {
        if (algorithm === 'Bubble') generatorRef.current = bubbleSort(array);
        else if (algorithm === 'Selection') generatorRef.current = selectionSort(array);
        else if (algorithm === 'Insertion') generatorRef.current = insertionSort(array);
      }
      setIsRunning(true);
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
         audioCtxRef.current.resume();
      }
    } else {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
       if (!generatorRef.current) return;
       const { value, done } = generatorRef.current.next();
       
       if (done) {
          setIsRunning(false);
          setActiveIndices([]);
          setSortedIndices(prev => {
             // play a little sweep for completion
             if (audioCtxRef.current) {
                let time = audioCtxRef.current.currentTime;
                array.forEach((val, idx) => {
                   const osc = audioCtxRef.current!.createOscillator();
                   const gain = audioCtxRef.current!.createGain();
                   osc.frequency.value = 150 + val * 8;
                   osc.connect(gain);
                   gain.connect(audioCtxRef.current!.destination);
                   gain.gain.setValueAtTime(0.02, time + idx * 0.02);
                   gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.02 + 0.05);
                   osc.start(time + idx * 0.02);
                   osc.stop(time + idx * 0.02 + 0.05);
                });
             }
             return array.map((_, i) => i);
          });
          return;
       }

       if (value) {
          setArray([...value.arr]);
          setActiveIndices(value.active);
          setSortedIndices([...value.sorted]);
          if (value.active.length > 0) {
             playNote(value.arr[value.active[0]]);
          }
       }
       
       // map slider 10-200 to timeout duration (210 - speed gives 200ms to 10ms)
       timeout = setTimeout(tick, 210 - speed); 
    };

    tick();
    return () => clearTimeout(timeout);
  }, [isRunning, speed]); // No array dependency, avoiding resetting timeout on state change

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Sorting Visualized</h2>
            <p className="text-xs text-white/50 tracking-wide">Algorithm step-through representation with audio</p>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-end justify-center bg-[#050505] overflow-hidden rounded-b-2xl border-t border-black/20 m-1 p-10 pb-20 gap-1">
          {array.map((val, idx) => {
             const isActive = activeIndices.includes(idx);
             const isSorted = sortedIndices.includes(idx);
             
             let bgClass = "bg-white/20";
             let textClass = "text-white/40";
             if (isActive) {
                 bgClass = "bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]";
                 textClass = "text-black";
             }
             else if (isSorted) {
                 bgClass = "bg-emerald-500/50 border-t border-emerald-400";
                 textClass = "text-emerald-100";
             }

             return (
               <div 
                 key={idx}
                 className={`flex-1 flex flex-col justify-end items-center transition-all duration-75 rounded-t-sm ${bgClass}`}
                 style={{ height: `${val}%` }}
               >
                  <span className={`text-[10px] font-mono font-bold mb-1 ${textClass}`}>{val}</span>
               </div>
             );
          })}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Algorithm</span>
              <span className="text-xs font-mono text-[#D4AF37]">{algorithm}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Elements</span>
              <span className="text-xs font-mono text-white">{array.length}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-widest text-white/40">Status</span>
              <span className="text-xs font-mono text-emerald-400">
                {sortedIndices.length === array.length ? 'SORTED' : isRunning ? 'RUNNING' : 'IDLE'}
              </span>
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
                  <label className="text-xs text-white/60">Sorting Strategy</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{algorithm}</span>
                </div>
                <div className="flex gap-2">
                   {['Bubble', 'Selection', 'Insertion'].map(algo => (
                      <button 
                         key={algo}
                         onClick={() => setAlgorithm(algo as any)}
                         className={`flex-1 py-1 px-1 text-[9px] uppercase tracking-widest rounded border transition-colors ${algorithm === algo ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-white/40 hover:bg-white/5'}`}
                      >
                         {algo}
                      </button>
                   ))}
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-end pb-2 border-b border-white/5 mb-3">
                  <label className="text-xs text-white/60">Speed</label>
                  <span className="text-sm font-mono text-[#E0E0E0]">{speed}</span>
                </div>
                <input 
                  type="range" min="10" max="200" step="10" value={speed} 
                  onChange={e => setSpeed(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={toggleRun}
                className="flex-1 text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button 
                onClick={generateArray}
                className="px-4 py-3 border border-white/20 rounded hover:bg-white/5 text-white transition-colors flex justify-center items-center"
                title="Shuffle Array"
              >
                <Shuffle size={14} />
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Time Complexity</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60 font-mono">Best Case:</span>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded font-mono text-sm border border-emerald-500/30">
                    {COMPLEXITIES[algorithm].best}
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60 font-mono">Average:</span>
                  <div className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded font-mono text-sm border border-amber-500/30">
                    {COMPLEXITIES[algorithm].avg}
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60 font-mono">Worst Case:</span>
                  <div className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded font-mono text-sm border border-rose-500/30">
                    {COMPLEXITIES[algorithm].worst}
                  </div>
               </div>
            </div>
            <div className="mt-auto p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/40 leading-relaxed">
                Big O (O) measures upper bound. <br/>
                Big Omega (Ω) measures lower bound. <br/>
                Big Theta (Θ) measures tight bound.
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}
