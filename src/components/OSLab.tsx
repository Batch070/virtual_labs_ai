import { useState, useEffect } from 'react';
import { Play, Pause, Cpu, Database, HardDrive, TerminalSquare, Plus, StepForward, Info } from 'lucide-react';

type ProcessState = 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

type Process = {
  id: string;
  name: string;
  short: string;
  color: string;
  totalTicks: number;
  remainingTicks: number;
  state: ProcessState;
  pagesReq: number;
  ioWaitTimer: number;
  isIoBound: boolean;
};

const RAM_PAGES = 64;

export default function OSLab() {
  const [os, setOs] = useState<{
    processes: Process[];
    ram: (string | null)[];
    clock: number;
    cpuActive: string | null;
    quantum: number;
    logs: string[];
    scheduler: 'RR' | 'FIFO' | 'SJF';
  }>({
    processes: [],
    ram: Array(RAM_PAGES).fill(null),
    clock: 0,
    cpuActive: null,
    quantum: 0,
    logs: ['OS Booted.', 'Awaiting user to start programs...'],
    scheduler: 'RR'
  });
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(800);

  const spawnProcess = (type: 'cpu' | 'mem' | 'io') => {
      const pId = Math.random().toString(36).substring(7).toUpperCase();
      
      const templates = {
          cpu: { name: 'Calculator App', short: 'CALC', color: '#10b981', pages: 4, ticks: 10, io: false },
          mem: { name: 'Video Game', short: 'GAME', color: '#d946ef', pages: 16, ticks: 12, io: false },
          io: { name: 'Web Browser', short: 'WEB', color: '#3b82f6', pages: 6, ticks: 15, io: true }
      };
      
      const t = templates[type];

      setOs(prev => {
          let freePages = prev.ram.reduce((acc, p) => p === null ? acc + 1 : acc, 0);
          let newLogs = [...prev.logs];
          
          if (freePages < t.pages) {
              newLogs.push(`[Tick ${prev.clock}] ERROR: Not enough RAM to open ${t.name}`);
              return { ...prev, logs: newLogs };
          }

          const newRam = [...prev.ram];
          let allocated = 0;
          for (let i = 0; i < RAM_PAGES && allocated < t.pages; i++) {
              if (newRam[i] === null) {
                  newRam[i] = pId;
                  allocated++;
              }
          }

          const newProcess: Process = {
              id: pId,
              name: `${t.name} (${pId.substring(0,3)})`,
              short: t.short,
              color: t.color,
              totalTicks: t.ticks,
              remainingTicks: t.ticks,
              state: 'READY',
              pagesReq: t.pages,
              ioWaitTimer: 0,
              isIoBound: t.io
          };

          newLogs.push(`[Tick ${prev.clock}] Started ${t.name}. Loaded into RAM.`);
          if (newLogs.length > 50) newLogs = newLogs.slice(newLogs.length - 50);

          return {
              ...prev,
              ram: newRam,
              processes: [...prev.processes, newProcess],
              logs: newLogs
          };
      });
  };

  const setScheduler = (scheduler: 'RR' | 'FIFO' | 'SJF') => {
      setOs(prev => ({
          ...prev,
          scheduler,
          logs: [...prev.logs.slice(-49), `[System] Scheduler changed to ${scheduler}`]
      }));
  };

  const systemTick = () => {
    setOs(prev => {
        let nextProcesses = prev.processes.map(p => ({...p}));
        let currentCpu = prev.cpuActive;
        let currentQuantum = prev.quantum;
        let nextRam = [...prev.ram];
        let nextClock = prev.clock + 1;
        let newLogs = [...prev.logs];

        const addLog = (msg: string) => {
           newLogs.push(`[Tick ${nextClock}] ${msg}`);
        };

        // 1. Process Wait Queue
        nextProcesses.forEach(p => {
             if (p.state === 'WAITING') {
                 p.ioWaitTimer--;
                 if (p.ioWaitTimer <= 0) {
                     p.state = 'READY';
                     addLog(`${p.name} finished Waiting. Moved to Ready Line.`);
                 }
             }
        });

        // 2. Process CPU Execution
        if (currentCpu) {
             const pIdx = nextProcesses.findIndex(p => p.id === currentCpu);
             if (pIdx !== -1) {
                 let p = nextProcesses[pIdx];
                 p.remainingTicks--;
                 currentQuantum++;

                 if (p.remainingTicks <= 0) {
                     p.state = 'TERMINATED';
                     currentCpu = null;
                     currentQuantum = 0;
                     addLog(`${p.name} completed. Removing from RAM.`);
                 } else if (p.isIoBound && Math.random() < 0.15) {
                     p.state = 'WAITING';
                     p.ioWaitTimer = 2; // shorter wait
                     currentCpu = null;
                     currentQuantum = 0;
                     // Move to back of line (fair scheduling)
                     nextProcesses.push(nextProcesses.splice(pIdx, 1)[0]);
                     addLog(`${p.name} needs the Internet. Paused to wait.`);
                 } else if (prev.scheduler === 'RR' && currentQuantum >= 3) {
                     p.state = 'READY';
                     currentCpu = null;
                     currentQuantum = 0;
                     // Move to back of line (round robin)
                     nextProcesses.push(nextProcesses.splice(pIdx, 1)[0]);
                     addLog(`OS paused ${p.name} to give another app a turn.`);
                 }
             } else {
                 currentCpu = null;
             }
         }

         // 3. Scheduler: Pick next process if CPU is idle
         if (!currentCpu) {
             const readyProcesses = nextProcesses.filter(p => p.state === 'READY');
             if (readyProcesses.length > 0) {
                 let nextP;
                 if (prev.scheduler === 'SJF') {
                     // Find process with shortest remaining time
                     const sorted = [...readyProcesses].sort((a, b) => a.remainingTicks - b.remainingTicks);
                     nextP = sorted[0];
                 } else {
                     // FIFO or RR (Queue based)
                     nextP = readyProcesses[0];
                 }
                 const readyIdx = nextProcesses.findIndex(p => p.id === nextP.id);
                 nextProcesses[readyIdx].state = 'RUNNING';
                 currentCpu = nextProcesses[readyIdx].id;
                 currentQuantum = 0;
                 addLog(`CPU starts working on ${nextProcesses[readyIdx].short}.`);
             }
         }

         // Clean up terminated
         const terminated = nextProcesses.filter(p => p.state === 'TERMINATED');
         if (terminated.length > 0) {
             terminated.forEach(tp => {
                 nextRam = nextRam.map(page => page === tp.id ? null : page);
             });
             nextProcesses = nextProcesses.filter(p => p.state !== 'TERMINATED');
         }

         if (newLogs.length > 50) newLogs = newLogs.slice(newLogs.length - 50);

         return {
             processes: nextProcesses,
             ram: nextRam,
             clock: nextClock,
             cpuActive: currentCpu,
             quantum: currentQuantum,
             logs: newLogs,
             scheduler: prev.scheduler
         };
    });
  };

  useEffect(() => {
     if (!isRunning) return;
     const interval = setInterval(systemTick, speed);
     return () => clearInterval(interval);
  }, [isRunning, speed]);

  const { processes, ram, clock, cpuActive, quantum, logs, scheduler } = os;
  const getProcess = (id: string) => processes.find(p => p.id === id);
  const activeProcess = cpuActive ? getProcess(cpuActive) : null;

  const displayReadyQueue = [...processes.filter(p => p.state === 'READY')];
  if (scheduler === 'SJF') {
      displayReadyQueue.sort((a, b) => a.remainingTicks - b.remainingTicks);
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto select-none">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group overflow-hidden">
        
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#0F0F0F] z-20 shrink-0">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">How an OS Works</h2>
            <p className="text-xs text-white/50 tracking-wide">A simplified visual guide to operating system management</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded">OS TICK : {clock}</span>
          </div>
        </div>
        
        <div className="flex-1 relative bg-[#050505] p-6 flex flex-col gap-6 overflow-y-auto w-full">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 shrink-0 w-full">
             
             {/* CPU Component */}
             <div className="border border-white/10 rounded-xl bg-black/40 flex flex-col p-5 relative shadow-inner overflow-hidden min-h-[220px]">
                <div className="flex items-center gap-2 text-white/80 border-b border-white/10 pb-3 mb-4">
                   <Cpu size={18} className="text-emerald-400" /> 
                   <span className="text-sm font-bold tracking-wide">1. CPU (The Brain)</span>
                </div>
                <p className="text-[10px] text-white/40 mb-4 leading-relaxed">
                   The CPU can only execute <strong>one app at a time</strong>. The OS quickly switches the active app to create the illusion that everything is running at once.
                </p>
                
                <div className="flex-1 flex items-center justify-center relative">
                    <svg className="absolute w-32 h-32 origin-center pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                      {activeProcess && (
                          <circle cx="50" cy="50" r="45" fill="none" stroke={activeProcess.color} strokeWidth="6" 
                                  strokeDasharray="40 200" strokeDashoffset={-(clock % 100) * 10} 
                                  className="transition-all duration-300" />
                      )}
                    </svg>

                    <div 
                      className="w-20 h-20 rounded-full border-4 flex items-center justify-center flex-col transition-colors shadow-2xl relative z-10"
                      style={{ 
                         borderColor: activeProcess ? activeProcess.color : 'rgba(255,255,255,0.1)',
                         backgroundColor: activeProcess ? `${activeProcess.color}20` : '#111'
                      }}
                    >
                       {activeProcess ? (
                          <>
                            <span className="font-bold text-sm text-center px-2 leading-tight" style={{ color: activeProcess.color }}>{activeProcess.short}</span>
                            <span className="text-[9px] text-white/70 mt-1">{activeProcess.remainingTicks} left</span>
                          </>
                       ) : (
                          <span className="text-xs text-white/30 font-mono">IDLE</span>
                       )}
                    </div>
                </div>
             </div>

             {/* RAM Component */}
             <div className="border border-white/10 rounded-xl bg-black/40 flex flex-col p-5 relative shadow-inner min-h-[220px]">
                <div className="flex items-center gap-2 text-white/80 border-b border-white/10 pb-3 mb-4">
                   <Database size={18} className="text-[#D4AF37]" /> 
                   <span className="text-sm font-bold tracking-wide">2. RAM (Memory Workspace)</span>
                </div>
                <p className="text-[10px] text-white/40 mb-4 leading-relaxed">
                   When you open an app, the OS loads its data from the hard drive into RAM so the CPU can access it instantly.
                </p>

                <div className="flex items-center justify-between text-white/30 mb-2 px-1">
                   <span className="text-[10px] font-mono tracking-widest uppercase">Grid Visualization</span>
                   <span className="text-[10px] font-mono bg-black/50 px-2 py-1 rounded">{ram.filter(p => !p).length} empty spots</span>
                </div>

                <div className="grid grid-cols-8 gap-1.5 flex-1 content-start mt-2">
                   {ram.map((pagePId, idx) => {
                       const p = pagePId ? getProcess(pagePId) : null;
                       return (
                          <div 
                             key={idx}
                             className="aspect-square rounded-[3px] transition-colors border border-black/20"
                             style={{
                                backgroundColor: p ? p.color : 'rgba(255,255,255,0.03)',
                                opacity: p && p.id !== cpuActive ? 0.4 : 1
                             }}
                             title={p ? `Belongs to ${p.name}` : `Empty spot`}
                          />
                       )
                   })}
                </div>
             </div>

          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px]">
             
             {/* Ready Queue */}
             <div className="border border-white/10 rounded-xl bg-black/40 flex flex-col p-5 shadow-inner">
                 <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                       <span className="text-sm">🚦</span>
                       <span className="text-xs uppercase font-bold tracking-widest">3. Ready Line</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                       {scheduler === 'RR' ? 'Round Robin' : scheduler === 'FIFO' ? 'First-In First-Out' : 'Shortest Job First'}
                    </span>
                 </div>
                 <p className="text-[10px] text-white/40 mb-4 leading-relaxed">Apps that are loaded in RAM and waiting patiently for their turn to use the CPU brain.</p>
                 
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {displayReadyQueue.map(p => (
                       <div key={p.id} className="w-full bg-[#1A1A1A] border border-white/5 rounded p-3 flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                             <span className="text-xs font-bold text-white tracking-wide">{p.name}</span>
                          </div>
                          {scheduler === 'SJF' && (
                              <span className="text-[10px] text-white/40 font-mono">{p.remainingTicks}t</span>
                          )}
                       </div>
                    ))}
                    {displayReadyQueue.length === 0 && (
                        <div className="text-[10px] text-white/20 font-mono italic text-center mt-4">The line is empty.</div>
                    )}
                 </div>
             </div>

             {/* Wait/IO Queue */}
             <div className="border border-white/10 rounded-xl bg-black/40 flex flex-col p-5 shadow-inner">
                 <div className="flex items-center gap-2 text-rose-400 mb-2 border-b border-white/5 pb-2">
                    <span className="text-sm">🛑</span>
                    <span className="text-xs uppercase font-bold tracking-widest">4. Paused / Waiting</span>
                 </div>
                 <p className="text-[10px] text-white/40 mb-4 leading-relaxed">The OS moved these apps out of the CPU because they are waiting on a slow task (like the internet or saving a file).</p>
                 
                 <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {processes.filter(p => p.state === 'WAITING').map(p => (
                       <div key={p.id} className="w-full bg-[#1A1A1A] border border-rose-500/10 rounded p-3 flex justify-between items-center opacity-80">
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                             <span className="text-xs font-bold text-white tracking-wide">{p.name}</span>
                          </div>
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold">Waiting: {p.ioWaitTimer}s</span>
                       </div>
                    ))}
                    {processes.filter(p => p.state === 'WAITING').length === 0 && (
                        <div className="text-[10px] text-white/20 font-mono italic text-center mt-4">Nobody is waiting on slow tasks right now.</div>
                    )}
                 </div>
             </div>

          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-full overflow-y-auto">
         
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold border-b border-white/5 pb-2">Action: Start Apps</h3>
            <p className="text-[10px] text-white/40 leading-relaxed mb-1">Click to open applications. The OS will automatically load them into memory and schedule them.</p>

            <div className="space-y-3">
               <button 
                  onClick={() => spawnProcess('cpu')}
                  className="w-full bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-white p-3 rounded flex items-center justify-between transition-colors shadow-sm"
               >
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-sm font-bold text-emerald-400">Calculator App</span>
                     <span className="text-[9px] text-white/50">Basic math, needs little RAM</span>
                  </div>
                  <Plus size={16} className="text-emerald-500" />
               </button>
               <button 
                  onClick={() => spawnProcess('mem')}
                  className="w-full bg-fuchsia-500/5 hover:bg-fuchsia-500/10 border border-fuchsia-500/20 text-white p-3 rounded flex items-center justify-between transition-colors shadow-sm"
               >
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-sm font-bold text-fuchsia-400">Video Game</span>
                     <span className="text-[9px] text-white/50">Complex graphics, needs lot of RAM</span>
                  </div>
                  <Plus size={16} className="text-fuchsia-500" />
               </button>
               <button 
                  onClick={() => spawnProcess('io')}
                  className="w-full bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 text-white p-3 rounded flex items-center justify-between transition-colors shadow-sm"
               >
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-sm font-bold text-blue-400">Web Browser</span>
                     <span className="text-[9px] text-white/50">Often pauses to wait for internet</span>
                  </div>
                  <Plus size={16} className="text-blue-500" />
               </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold border-b border-white/5 pb-2">Scheduling Rules</h3>
            <p className="text-[10px] text-white/40 leading-relaxed mb-1">How does the OS decide who uses the CPU next?</p>
            
            <div className="grid grid-cols-3 gap-2">
               <button 
                  onClick={() => setScheduler('RR')}
                  className={`p-2 rounded border text-[10px] flex flex-col items-center gap-1 transition-colors ${scheduler === 'RR' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80'}`}
               >
                  <span className="font-bold">RR</span>
                  <span className="text-[8px] opacity-70">(Fair turns)</span>
               </button>
               <button 
                  onClick={() => setScheduler('FIFO')}
                  className={`p-2 rounded border text-[10px] flex flex-col items-center gap-1 transition-colors ${scheduler === 'FIFO' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80'}`}
               >
                  <span className="font-bold">FIFO</span>
                  <span className="text-[8px] opacity-70">(First come)</span>
               </button>
               <button 
                  onClick={() => setScheduler('SJF')}
                  className={`p-2 rounded border text-[10px] flex flex-col items-center gap-1 transition-colors ${scheduler === 'SJF' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80'}`}
               >
                  <span className="font-bold">SJF</span>
                  <span className="text-[8px] opacity-70">(Shortest cut)</span>
               </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold border-b border-white/5 pb-2">Control Time</h3>
            
            <p className="text-[10px] text-white/40 leading-relaxed mb-1">Watch how the OS behaves step-by-step to understand the logic, or let it auto-run.</p>
            
            <button 
               onClick={systemTick}
               disabled={isRunning}
               className={`w-full py-3 border rounded transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest font-bold shadow-sm ${isRunning ? 'opacity-30 cursor-not-allowed border-white/5 bg-black text-white/30' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20'}`}
            >
               <StepForward size={14} /> Step Forward (+1 Tick)
            </button>

            <div className="flex gap-2">
               <button 
                  onClick={() => { setIsRunning(true); setSpeed(1500); }}
                  className={`flex-1 py-3 rounded flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                     isRunning && speed === 1500 ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
               >
                  <Play size={14} /> Auto (Slow)
               </button>
               <button 
                  onClick={() => { setIsRunning(true); setSpeed(300); }}
                  className={`flex-1 py-3 rounded flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                     isRunning && speed === 300 ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
               >
                  <Play size={14} /> Auto (Fast)
               </button>
               {isRunning && (
                  <button 
                     onClick={() => setIsRunning(false)}
                     className="px-4 py-3 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 flex justify-center items-center font-bold"
                     title="Pause Auto-Run"
                  >
                     <Pause size={14} />
                  </button>
               )}
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-4 overflow-hidden mb-2">
            <div className="flex items-center gap-2 mb-3 px-1 text-[#D4AF37]">
               <TerminalSquare size={14} />
               <h3 className="text-[10px] uppercase tracking-widest font-bold">OS Narrative Logs</h3>
            </div>
            <div className="flex-1 bg-[#050505] border border-white/5 rounded block p-4 overflow-y-auto font-mono text-[9px] text-white/60 space-y-2 shadow-inner">
               {logs.map((L, i) => (
                   <div key={i} className="" style={{ color: L.includes('ERROR') ? '#ef4444' : L.includes('Started') ? '#10b981' : undefined }}>
                      {L}
                   </div>
               ))}
               <div className="mt-2 animate-pulse font-bold text-white">_</div>
            </div>
         </div>

      </div>
    </div>
  );
}
