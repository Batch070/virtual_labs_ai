import { useState, useEffect } from 'react';
import { ArrowRight, Plus, Minus, Info } from 'lucide-react';

export default function DSLab() {
  const [activeTab, setActiveTab] = useState('array');

  const tabs = [
    { id: 'array', label: 'Array', type: 'linear' },
    { id: 'linkedlist', label: 'Linked List', type: 'linear' },
    { id: 'stack', label: 'Stack', type: 'linear' },
    { id: 'queue', label: 'Queue', type: 'linear' },
    { id: 'tree', label: 'Tree (BST)', type: 'non-linear' },
    { id: 'graph', label: 'Graph', type: 'non-linear' }
  ];

  // Random item utility
  const r = () => Math.floor(Math.random() * 99) + 1;

  // States for each DS
  const [array, setArray] = useState([12, 45, 7, 89]);
  const [list, setList] = useState([10, 20, 30]);
  const [stack, setStack] = useState([5, 15, 25]);
  const [queue, setQueue] = useState([9, 8, 7]);
  
  // BST Array rep (up to level 4)
  const initialBst = Array(15).fill(null);
  initialBst[0] = 50; initialBst[1] = 25; initialBst[2] = 75; 
  initialBst[3] = 12; initialBst[4] = 37; initialBst[5] = 60; initialBst[6] = 85;
  const [bst, setBst] = useState<(number | null)[]>(initialBst);

  // Graph state
  const [graphNodes, setGraphNodes] = useState([
    { id: 'A', x: 20, y: 30 },
    { id: 'B', x: 50, y: 20 },
    { id: 'C', x: 80, y: 40 },
    { id: 'D', x: 30, y: 70 },
    { id: 'E', x: 70, y: 80 },
  ]);
  const [graphEdges, setGraphEdges] = useState([
    ['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'E'], ['B', 'E'], ['C', 'E']
  ]);

  // -- Use Cases & Problems Data --
  const useCases = {
      array: {
          scenarios: ['Storing homogeneous, sequential data', 'Implementing fast lookup tables', 'Matrix mathematics and image processing (2D arrays)'],
          problems: ['Two Sum (Find pairs summing to target)', 'Maximum Subarray (Kadane\'s Algorithm)', 'Binary Search']
      },
      linkedlist: {
          scenarios: ['Dynamic memory allocation (no fixed contiguous size)', 'Implementing queues and stacks', 'Undo functionality browsers (Double Linked Lists)'],
          problems: ['Reverse a Linked List', 'Detect a Cycle (Floyd’s Hare & Tortoise)', 'Merge Two Sorted Lists']
      },
      stack: {
          scenarios: ['Undo/Redo functionality in editors', 'Tracking function calls (Call Stack)', 'Syntax parsing (Matching parentheses)'],
          problems: ['Valid Parentheses', 'Evaluate Reverse Polish Notation', 'Next Greater Element']
      },
      queue: {
          scenarios: ['Task scheduling (Print queues, CPU tasks)', 'Handling web server requests', 'Breadth-First Search (BFS) routing'],
          problems: ['Implement Queue using Stacks', 'Sliding Window Maximum', 'Design Circular Queue']
      },
      tree: {
          scenarios: ['Hierarchical data (File systems, HTML DOM)', 'Fast searching & sorting (Database Indexing)', 'Autocompletion (Tries)'],
          problems: ['Lowest Common Ancestor', 'Invert a Binary Tree', 'Validate Binary Search Tree']
      },
      graph: {
          scenarios: ['Social networks (Friends of friends)', 'Maps and routing (GPS shortest path)', 'Network topologies and the Internet'],
          problems: ['Dijkstra\'s Shortest Path', 'Number of Islands (Grid traversal)', 'Course Schedule (Topological Sort)']
      }
  };

  const renderUseCases = (id: string) => {
      const data = useCases[id as keyof typeof useCases];
      if (!data) return null;
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
             <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80 mb-3 flex items-center gap-2"><Info size={14}/> Real-world Uses</h4>
                <ul className="text-[11px] text-white/50 space-y-2 list-disc pl-4">
                   {data.scenarios.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
             </div>
             <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80 mb-3 flex items-center gap-2"><Info size={14}/> Classic Problems</h4>
                <ul className="text-[11px] text-white/50 space-y-2 list-disc pl-4">
                   {data.problems.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
             </div>
          </div>
      );
  };

  // -- Renderers --

  const renderArray = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-emerald-400 mb-2">Array</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           A contiguous block of memory. Elements are stored next to each other, allowing for very fast <span className="text-emerald-400 font-mono">O(1)</span> lookups using an index. However, inserting or deleting elements at the beginning is slow <span className="text-rose-400 font-mono">O(n)</span> because all other elements must be shifted.
         </p>
      </div>
      <div className="flex flex-wrap gap-3">
         <button onClick={() => setArray([...array, r()])} className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center gap-2 text-xs hover:bg-emerald-500/20"><Plus size={14}/> Append (End) <span className="text-[9px] opacity-50">O(1)</span></button>
         <button onClick={() => setArray([r(), ...array])} className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded flex items-center gap-2 text-xs hover:bg-emerald-500/20"><Plus size={14}/> Prepend (Start) <span className="text-[9px] text-rose-400">O(n)</span></button>
         <button onClick={() => setArray(array.slice(0, -1))} disabled={array.length === 0} className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded flex items-center gap-2 text-xs hover:bg-rose-500/20 disabled:opacity-30"><Minus size={14}/> Pop (End) <span className="text-[9px] text-emerald-400">O(1)</span></button>
         <button onClick={() => setArray(array.slice(1))} disabled={array.length === 0} className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded flex items-center gap-2 text-xs hover:bg-rose-500/20 disabled:opacity-30"><Minus size={14}/> Shift (Start) <span className="text-[9px] text-rose-400">O(n)</span></button>
      </div>
      <div className="flex justify-start">
         <div className="flex flex-wrap gap-0 bg-[#050505] p-6 rounded-xl border border-white/5 relative items-end">
            {array.length === 0 && <span className="text-white/30 text-sm">Array is empty</span>}
            {array.map((val, i) => (
               <div key={i} className={`flex flex-col items-center group transition-all duration-300 ${i === 0 ? 'bg-white/5 rounded-l-lg' : ''} ${i === array.length - 1 ? 'bg-white/5 rounded-r-lg' : ''}`}>
                  <div className="text-[10px] font-mono text-emerald-500/50 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Idx {i}</div>
                  <div className={`w-14 h-14 border border-emerald-500/30 flex items-center justify-center text-lg font-bold text-white shadow-sm transition-transform hover:scale-110 hover:bg-emerald-500/20 hover:z-10 bg-[#1A1A1A] ${i===0?'rounded-l-lg':''} ${i===array.length-1?'rounded-r-lg':''}`}>
                     {val}
                  </div>
               </div>
            ))}
         </div>
      </div>
      {renderUseCases('array')}
    </div>
  );

  const renderLinkedList = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-blue-400 mb-2">Linked List</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           Nodes scattered in memory, connected by pointers. Fast insertions/deletions at the head <span className="text-emerald-400 font-mono">O(1)</span>, but slow lookups <span className="text-rose-400 font-mono">O(n)</span> because you must walk through the list linearly.
         </p>
      </div>
      <div className="flex flex-wrap gap-3">
         <button onClick={() => setList([r(), ...list])} className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded flex items-center gap-2 text-xs hover:bg-blue-500/20"><Plus size={14}/> Insert Head <span className="text-[9px] text-emerald-400">O(1)</span></button>
         <button onClick={() => setList([...list, r()])} className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded flex items-center gap-2 text-xs hover:bg-blue-500/20"><Plus size={14}/> Insert Tail <span className="text-[9px] text-rose-400">O(n)*</span></button>
         <button onClick={() => setList(list.slice(1))} disabled={list.length === 0} className="px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded flex items-center gap-2 text-xs hover:bg-rose-500/20 disabled:opacity-30"><Minus size={14}/> Remove Head <span className="text-[9px] text-emerald-400">O(1)</span></button>
      </div>
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto p-8 bg-[#050505] border border-white/5 rounded-xl min-h-[160px]">
         {list.length === 0 && <span className="text-white/30 text-sm">Empty List</span>}
         {list.map((val, i) => (
            <div key={i} className="flex items-center group animate-in slide-in-from-left duration-300">
               <div className="flex flex-col relative">
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400/50 font-mono text-center uppercase tracking-widest">{i === 0 ? 'Head' : ''}</div>
                   <div className="w-20 h-10 flex border border-blue-500/50 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform bg-blue-500/5 mb-1">
                      <div className="flex-1 border-r border-blue-500/30 flex items-center justify-center font-bold text-white text-sm">{val}</div>
                      <div className="w-6 flex flex-col items-center justify-center bg-blue-500/10 gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      </div>
                   </div>
               </div>
               {i < list.length - 1 ? (
                   <ArrowRight className="mx-2 text-blue-500" size={18} />
               ) : (
                   <div className="mx-2 text-blue-500/50 flex items-center gap-1 font-mono text-[10px]"><ArrowRight size={14} /> NULL</div>
               )}
            </div>
         ))}
      </div>
      {renderUseCases('linkedlist')}
    </div>
  );

  const renderStack = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-fuchsia-400 mb-2">Stack (LIFO)</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           Last-In, First-Out. Imagine a stack of plates; you can only add or remove the top plate. Fast push/pop <span className="text-emerald-400 font-mono">O(1)</span>.
         </p>
      </div>
      <div className="flex gap-3 mb-2">
         <button onClick={() => setStack([...stack, r()])} className="px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 font-bold rounded-lg text-sm hover:bg-fuchsia-500/20 transition-colors">Push <span className="text-[10px] opacity-70 font-mono">O(1)</span></button>
         <button onClick={() => setStack(stack.slice(0, -1))} disabled={stack.length === 0} className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-lg text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-30">Pop <span className="text-[10px] opacity-70 font-mono">O(1)</span></button>
      </div>
      <div className="flex justify-center bg-[#050505] border border-white/5 p-8 rounded-xl h-[280px]">
          <div className="w-48 border-b-4 border-x-4 border-fuchsia-500/40 rounded-b-xl flex flex-col-reverse justify-start items-center p-3 gap-2 relative">
             {stack.length === 0 && <span className="text-white/30 text-sm absolute top-1/2 -translate-y-1/2">Empty Stack</span>}
             {stack.map((val, i) => (
                 <div key={i} className={`animate-in slide-in-from-top-4 w-full h-10 border rounded flex items-center justify-center font-bold shadow-lg transition-colors ${i === stack.length - 1 ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100' : 'border-fuchsia-900 bg-fuchsia-900/10 text-white/50'}`}>
                    {val} {i === stack.length - 1 && <span className="text-[10px] ml-2 text-fuchsia-400 uppercase tracking-widest absolute right-[-50px] font-mono">← Top</span>}
                 </div>
             ))}
          </div>
      </div>
      {renderUseCases('stack')}
    </div>
  );

  const renderQueue = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-amber-400 mb-2">Queue (FIFO)</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           First-In, First-Out. Like a waiting line. Enter at the back (Enqueue), exit at the front (Dequeue) <span className="text-emerald-400 font-mono">O(1)</span>.
         </p>
      </div>
      <div className="flex gap-3 mb-2">
         <button onClick={() => setQueue([r(), ...queue])} className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-sm hover:bg-amber-500/20 transition-colors">Enqueue (Back)</button>
         <button onClick={() => setQueue(queue.slice(0, -1))} disabled={queue.length === 0} className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-lg text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-30">Dequeue (Front)</button>
      </div>
      
      <div className="overflow-x-auto flex items-center p-8 bg-[#050505] rounded-xl relative border border-white/5 shadow-inner min-h-[160px]">
          <div className="absolute left-4 text-xs font-mono text-amber-500/70 uppercase tracking-widest font-bold hidden sm:block">Exit (Front) ←</div>
          <div className="absolute right-4 text-xs font-mono text-amber-500/70 uppercase tracking-widest font-bold hidden sm:block">← Enter (Back)</div>
          
          <div className="flex gap-3 w-full items-center justify-end px-2 sm:px-24">
             {queue.length === 0 && <div className="w-full text-center text-white/30 text-sm">Empty Queue</div>}
             {queue.map((val, i) => (
                <div key={i} className={`animate-in slide-in-from-right w-14 h-14 shrink-0 border-2 rounded-lg flex flex-col items-center justify-center font-bold relative shadow-lg ${i === queue.length - 1 ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-amber-900 bg-amber-900/20 text-white/70'}`}>
                   {val}
                </div>
             ))}
          </div>
      </div>
      {renderUseCases('queue')}
    </div>
  );

  // BST Helper
  const getBstPos = (index: number) => {
      let level = Math.floor(Math.log2(index + 1));
      let nodesInLevel = Math.pow(2, level);
      let indexInLevel = index - (nodesInLevel - 1);
      
      let y = 15 + level * 25;
      let x = ((indexInLevel + 0.5) / nodesInLevel) * 100;
      return { x, y };
  };

  const insertBstRandom = () => {
      const val = r();
      const newTree = [...bst];
      let curr = 0;
      while (curr < 15) { 
          if (newTree[curr] === null) {
              newTree[curr] = val;
              break;
          }
          if (val < newTree[curr]!) {
              curr = 2 * curr + 1; // Left child
          } else {
              curr = 2 * curr + 2; // Right child
          }
      }
      setBst(newTree);
  };

  const renderTree = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-emerald-400 mb-2">Binary Search Tree (BST)</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           Hierarchical data structure. Left child is smaller, right child is larger. Allows for very fast <span className="text-emerald-400 font-mono">O(log n)</span> search, insertion, and deletion if balanced.
         </p>
      </div>
      <div className="flex gap-3 mb-2">
         <button onClick={insertBstRandom} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-sm hover:bg-emerald-500/20 transition-colors">Insert Random Node</button>
         <button onClick={() => setBst(Array(15).fill(null))} className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-lg text-sm hover:bg-rose-500/20 transition-colors">Clear Tree</button>
      </div>
      <div className="relative w-full h-[320px] bg-[#050505] border border-white/5 rounded-xl overflow-hidden shadow-inner">
         <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {bst.map((val, i) => {
               if (val === null) return null;
               const leftIdx = 2 * i + 1;
               const rightIdx = 2 * i + 2;
               const p1 = getBstPos(i);
               
               const lines = [];
               if (leftIdx < 15 && bst[leftIdx] !== null) {
                   const p2 = getBstPos(leftIdx);
                   lines.push(<line key={`l-${i}`} x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" />);
               }
               if (rightIdx < 15 && bst[rightIdx] !== null) {
                   const p2 = getBstPos(rightIdx);
                   lines.push(<line key={`r-${i}`} x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" />);
               }
               return lines;
            })}
         </svg>
         {bst.map((val, i) => {
            if (val === null) return null;
            const pos = getBstPos(i);
            return (
                <div key={i} 
                     className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-emerald-500/80 bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-emerald-100 z-10 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:scale-110 hover:bg-emerald-500/20 transition-all cursor-pointer animate-in zoom-in"
                     style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                   {val}
                </div>
            )
         })}
      </div>
      {renderUseCases('tree')}
    </div>
  );

  const addGraphNode = () => {
     const id = String.fromCharCode(65 + graphNodes.length); // A, B...
     const x = 10 + Math.random() * 80;
     const y = 10 + Math.random() * 80;
     setGraphNodes(n => [...n, { id, x, y }]);
  };

  const addGraphEdgeRandom = () => {
     if (graphNodes.length < 2) return;
     const n1 = graphNodes[Math.floor(Math.random() * graphNodes.length)].id;
     let n2 = graphNodes[Math.floor(Math.random() * graphNodes.length)].id;
     let attempts = 0;
     while(n1 === n2 && attempts < 10) {
         n2 = graphNodes[Math.floor(Math.random() * graphNodes.length)].id;
         attempts++;
     }
     if (n1 !== n2) {
         setGraphEdges(e => [...e, [n1, n2]]);
     }
  };

  const renderGraph = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-white border-b border-white/10 pb-6">
         <h3 className="text-2xl font-bold text-purple-400 mb-2">Graph</h3>
         <p className="text-sm text-white/50 max-w-2xl">
           A network of nodes (vertices) connected by edges. Powerful for modeling real-world connections. Can be directed or undirected, cyclical or acyclic. Operations depend heavily on traversal algorithms like BFS or DFS.
         </p>
      </div>
      <div className="flex gap-3 mb-2">
         <button onClick={addGraphNode} className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold rounded-lg text-sm hover:bg-purple-500/20 transition-colors">Add Node</button>
         <button onClick={addGraphEdgeRandom} disabled={graphNodes.length < 2} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold rounded-lg text-sm hover:bg-indigo-500/20 transition-colors disabled:opacity-30">Add Random Edge</button>
         <button onClick={() => { setGraphNodes([]); setGraphEdges([]); }} className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold rounded-lg text-sm hover:bg-rose-500/20 transition-colors">Clear</button>
      </div>
      <div className="relative w-full h-[320px] bg-[#050505] border border-white/5 rounded-xl overflow-hidden shadow-inner">
         <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {graphEdges.map((edge, i) => {
               const n1 = graphNodes.find(n => n.id === edge[0]);
               const n2 = graphNodes.find(n => n.id === edge[1]);
               if(!n1 || !n2) return null;
               return (
                  <line key={i} x1={`${n1.x}%`} y1={`${n1.y}%`} x2={`${n2.x}%`} y2={`${n2.y}%`} stroke="rgba(167, 139, 250, 0.4)" strokeWidth="2" className="animate-in fade-in" />
               )
            })}
         </svg>
         {graphNodes.map(node => (
            <div key={node.id} 
                 className="absolute w-10 h-10 -ml-5 -mt-5 rounded-xl border border-purple-500/60 bg-[#1A1A1A] flex items-center justify-center text-sm font-bold text-purple-200 z-10 shadow-[0_0_10px_rgba(167,139,250,0.2)] rotate-45 hover:scale-110 hover:bg-purple-500/20 transition-all cursor-pointer animate-in zoom-in"
                 style={{ left: `${node.x}%`, top: `${node.y}%` }}>
               <div className="-rotate-45">{node.id}</div>
            </div>
         ))}
      </div>
      {renderUseCases('graph')}
    </div>
  );

  const getRender = () => {
     switch(activeTab) {
        case 'array': return renderArray();
        case 'linkedlist': return renderLinkedList();
        case 'stack': return renderStack();
        case 'queue': return renderQueue();
        case 'tree': return renderTree();
        case 'graph': return renderGraph();
        default: return null;
     }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto select-none pb-8">
      {/* Sidebar */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
          <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 shadow-lg flex-1 overflow-y-auto">
             <h2 className="text-xl text-white font-serif mb-6 ml-2">Data Structures</h2>
             
             <div className="space-y-6">
                <div>
                   <h3 className="text-[10px] uppercase font-bold text-emerald-400/50 tracking-widest pl-2 mb-3">Linear</h3>
                   <div className="space-y-1">
                      {tabs.filter(t => t.type === 'linear').map(t => (
                         <button key={t.id} onClick={() => setActiveTab(t.id)} 
                                 className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === t.id ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                            {t.label}
                         </button>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-[10px] uppercase font-bold text-purple-400/50 tracking-widest pl-2 mb-3">Non-Linear</h3>
                   <div className="space-y-1">
                      {tabs.filter(t => t.type === 'non-linear').map(t => (
                         <button key={t.id} onClick={() => setActiveTab(t.id)} 
                                 className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === t.id ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                            {t.label}
                         </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
      </div>
      
      {/* Main View */}
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 p-8 overflow-y-auto shadow-lg relative">
          {getRender()}
      </div>
    </div>
  )
}

