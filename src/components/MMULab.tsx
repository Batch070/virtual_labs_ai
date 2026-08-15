import { useState, useRef } from 'react';
import { Cpu, HardDrive, RotateCcw, MousePointerClick, Zap, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

type MemoryItem = {
  id: string;
  icon: string;
  name: string;
  color: string;
};

const APP_ITEMS: MemoryItem[] = [
  { id: 'v0', icon: '📝', name: 'Startup Code', color: '#10b981' }, // Emerald
  { id: 'v1', icon: '🖼️', name: 'Menu Graphics', color: '#3b82f6' }, // Blue
  { id: 'v2', icon: '🎵', name: 'Background Music', color: '#8b5cf6' }, // Violet
  { id: 'v3', icon: '⚙️', name: 'Physics Engine', color: '#f59e0b' }, // Amber
  { id: 'v4', icon: '🗺️', name: 'Level 1 Map', color: '#ec4899' }, // Pink
  { id: 'v5', icon: '🗺️', name: 'Level 2 Map', color: '#06b6d4' }, // Cyan
  { id: 'v6', icon: '🎬', name: 'Cutscene Video', color: '#f43f5e' }, // Rose
  { id: 'v7', icon: '💾', name: 'Save Data', color: '#d946ef' }, // Fuchsia
];

const NUM_RAM_SLOTS = 4;

export default function MMULab() {
  // State: Which items are in which RAM slots? (null = empty)
  const [ram, setRam] = useState<(string | null)[]>([null, null, null, null]);
  
  // State: Track when an item was last used for LRU eviction
  const [lastUsedTick, setLastUsedTick] = useState<Record<string, number>>({});
  
  // System tick (time)
  const [tick, setTick] = useState(0);

  // Animation & Status states
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState({ text: 'Waiting for you to click an app resource...', type: 'info' });

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleAccess = async (item: MemoryItem) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveItem(item.id);
    
    const currentTick = tick + 1;
    setTick(currentTick);

    // Step 1: Request
    setStatusMsg({ text: `CPU wants "${item.name}". Checking the Address Book...`, type: 'info' });
    await wait(800);

    const isInRam = ram.includes(item.id);

    if (isInRam) {
        // HIT (Fast Access)
        const slotIdx = ram.indexOf(item.id);
        setStatusMsg({ text: `YES! Instantly found in RAM Slot ${slotIdx + 1}.`, type: 'success' });
        
        // Update LRU time
        setLastUsedTick(prev => ({ ...prev, [item.id]: currentTick }));
        await wait(1000);
    } else {
        // MISS (Page Fault)
        setStatusMsg({ text: `Uh oh! It's not in RAM! (This is called a "Page Fault")`, type: 'error' });
        await wait(1200);

        setStatusMsg({ text: `Pausing CPU. Fetching it from the slow Hard Drive...`, type: 'warning' });
        await wait(1000);

        // Find a spot in RAM
        const emptySlotIdx = ram.findIndex(slot => slot === null);
        let targetSlot = emptySlotIdx;

        if (targetSlot === -1) {
            // RAM is full, need to evict oldest (LRU)
            setStatusMsg({ text: `RAM is full! Need to make room...`, type: 'warning' });
            await wait(1000);

            let oldestTick = Infinity;
            let oldestSlotIdx = 0;
            
            ram.forEach((ramItemId, idx) => {
                if (ramItemId) {
                    const usedTime = lastUsedTick[ramItemId] || 0;
                    if (usedTime < oldestTick) {
                        oldestTick = usedTime;
                        oldestSlotIdx = idx;
                    }
                }
            });

            targetSlot = oldestSlotIdx;
            const evictedId = ram[targetSlot];
            const evictedItem = APP_ITEMS.find(i => i.id === evictedId);
            
            setStatusMsg({ text: `Removing oldest item "${evictedItem?.name}" back to disk to free up Slot ${targetSlot + 1}.`, type: 'warning' });
            await wait(1500);
        }

        // Put new item in RAM
        setRam(prev => {
            const next = [...prev];
            next[targetSlot] = item.id;
            return next;
        });
        setLastUsedTick(prev => ({ ...prev, [item.id]: currentTick }));
        
        setStatusMsg({ text: `Moved "${item.name}" into RAM Slot ${targetSlot + 1}. CPU resumes!`, type: 'success' });
        await wait(1200);
    }

    setStatusMsg({ text: 'Ready. Click another resource.', type: 'info' });
    setActiveItem(null);
    setIsAnimating(false);
  };

  const reset = () => {
      setRam([null, null, null, null]);
      setLastUsedTick({});
      setTick(0);
      setActiveItem(null);
      setStatusMsg({ text: 'System reset. Memory is completely empty.', type: 'info' });
  };

  // Status Banner colors
  const bannerColors = {
      info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      error: 'bg-rose-500/10 border-rose-500/30 text-rose-400'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full gap-6 max-w-[1400px] mx-auto select-none overflow-y-auto pb-8">
      
      {/* Header & Status */}
      <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 shrink-0 flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-white mb-2">Memory Management Made Simple</h2>
            <p className="text-sm text-white/50 tracking-wide max-w-xl">
               An Operating System tricks apps into thinking they have <b>infinite memory</b>. 
               In reality, the OS secretly shuttles chunks of data back and forth between a huge, slow Hard Drive and tiny, fast RAM.
            </p>
          </div>
          
          <div className={`flex-1 border rounded-xl p-4 flex items-center gap-4 transition-all duration-300 shadow-inner ${bannerColors[statusMsg.type as keyof typeof bannerColors]}`}>
             <div className="shrink-0 bg-black/20 p-2 rounded-lg">
                {statusMsg.type === 'error' ? <AlertCircle size={24} /> : 
                 statusMsg.type === 'warning' ? <Zap size={24} /> : 
                 statusMsg.type === 'success' ? <CheckCircle2 size={24} /> : 
                 <BookOpen size={24} />}
             </div>
             <div className="font-bold tracking-wide leading-tight">
                 {statusMsg.text}
             </div>
          </div>
      </div>

      {/* Main Interactive Metaphor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
          
          {/* Column 1: The App's Virtual View */}
          <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col shadow-lg">
              <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                 <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Cpu size={20} /></div>
                 <div>
                     <h3 className="font-bold text-white tracking-wide">1. App Data (Virtual Memory)</h3>
                     <p className="text-[10px] text-white/40 leading-tight mt-1">The app thinks all 8 of these are always ready. <b>Click one to make the CPU use it.</b></p>
                 </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-3 mt-4 content-start">
                  {APP_ITEMS.map((item) => {
                      const isActive = activeItem === item.id;
                      const isInRam = ram.includes(item.id);

                      return (
                          <button
                             key={item.id}
                             disabled={isAnimating}
                             onClick={() => handleAccess(item)}
                             className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 text-center
                                ${isActive ? 'scale-105 border-white bg-white/10 z-10 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'border-white/5 bg-[#1A1A1A] hover:bg-white/5'}
                             `}
                          >
                             <div className="text-2xl drop-shadow-lg scale-125">{item.icon}</div>
                             <div className="text-xs font-bold text-white mt-1 leading-tight">{item.name}</div>
                             
                             {/* Indicator dot */}
                             <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isInRam ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500/50'}`} 
                                  title={isInRam ? 'Ready in RAM' : 'On slow Disk'} 
                             />
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Column 2: The OS Directory / Page Table */}
          <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4 relative z-10">
                 <div className="bg-[#D4AF37]/20 p-2 rounded-lg text-[#D4AF37]"><BookOpen size={20} /></div>
                 <div>
                     <h3 className="font-bold text-white tracking-wide">2. The "Address Book"</h3>
                     <p className="text-[10px] text-white/40 leading-tight mt-1">The OS uses this "Page Table" to secretly track where the data actually lives right now.</p>
                 </div>
              </div>

              <div className="flex-1 mt-4 space-y-2 relative z-10 overflow-y-auto pr-2">
                  {APP_ITEMS.map((item) => {
                      const isActive = activeItem === item.id;
                      const ramSlotIdx = ram.indexOf(item.id);
                      const isLoaded = ramSlotIdx !== -1;

                      return (
                          <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isActive ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-inner' : 'bg-black/50 border-white/5'}`}>
                              <div className="flex items-center gap-2">
                                  <span className="text-sm">{item.icon}</span>
                                  <span className={`text-xs font-bold ${isActive ? 'text-[#D4AF37]' : 'text-white/60'}`}>{item.name}</span>
                              </div>
                              
                              <div className="flex items-center">
                                  <div className="w-8 flex justify-center">
                                     <ArrowRight size={14} className={isActive ? 'text-[#D4AF37]' : 'text-white/20'} />
                                  </div>
                                  <div className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded w-24 text-center ${isLoaded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 text-rose-400/50'}`}>
                                      {isLoaded ? `Slot ${ramSlotIdx + 1}` : 'On Disk'}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Column 3: The Physical Hardware */}
          <div className="flex flex-col gap-6">
              
              {/* RAM */}
              <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex-1 flex flex-col shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Zap size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white tracking-wide">3. Fast RAM (4 Slots)</h3>
                            <p className="text-[10px] text-white/40 leading-tight mt-1">Super fast, but very small capacity.</p>
                        </div>
                     </div>
                     <button onClick={reset} disabled={isAnimating} className="text-[10px] text-white/30 hover:text-white transition-colors flex flex-col items-center gap-1 disabled:opacity-30">
                        <RotateCcw size={14} /> Reset
                     </button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 gap-3">
                      {ram.map((itemId, idx) => {
                          const item = itemId ? APP_ITEMS.find(i => i.id === itemId) : null;
                          const isJustLoaded = activeItem === itemId && statusMsg.type === 'success';

                          return (
                              <div key={idx} className={`relative flex items-center p-3 rounded-lg border-2 h-full transition-all duration-500 ${item ? 'bg-[#1A1A1A] border-white/10' : 'bg-black border-dashed border-white/5'}`}>
                                  
                                  <div className={`absolute -left-3 -top-3 w-6 h-6 rounded-full bg-black border ${item ? 'border-emerald-500 text-emerald-500' : 'border-white/20 text-white/30'} flex items-center justify-center text-[10px] font-bold z-10`}>
                                     {idx + 1}
                                  </div>

                                  {isJustLoaded && (
                                     <div className="absolute inset-0 bg-emerald-500/20 animate-pulse rounded-lg pointer-events-none" />
                                  )}

                                  {item ? (
                                      <div className="flex items-center justify-between w-full z-10 pl-2">
                                          <div className="flex items-center gap-3">
                                             <span className="text-2xl">{item.icon}</span>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold text-white">{item.name}</span>
                                                 <span className="text-[9px] text-emerald-400/70 font-mono tracking-widest uppercase">Loaded</span>
                                             </div>
                                          </div>
                                          <div className="text-[9px] text-white/30 text-right pr-2">
                                              Used Tick<br/><span className="text-white font-bold">{lastUsedTick[item.id]}</span>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="w-full text-center text-[10px] text-white/20 uppercase tracking-widest font-bold z-10">
                                          - Empty Slot -
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Disk */}
              <div className="bg-[#0F0F0F] rounded-2xl border border-rose-500/10 p-4 shrink-0 shadow-lg relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none rounded-2xl"></div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400 border border-rose-500/20"><HardDrive size={24} /></div>
                    <div>
                        <h3 className="font-bold text-rose-200 tracking-wide">Slow Hard Drive</h3>
                        <p className="text-[10px] text-rose-400/60 leading-tight mt-1 max-w-[200px]">Massive capacity, but too slow for the CPU to read from directly. Data must be copied into RAM first.</p>
                    </div>
                 </div>
              </div>

          </div>

      </div>
    </div>
  );
}

// Inline helper icon for arrows to avoid missing imports
function ArrowRight(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

