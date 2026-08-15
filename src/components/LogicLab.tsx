import React, { useState, useEffect } from 'react';
import { MousePointer2, Plus, Zap, Trash2, RotateCcw } from 'lucide-react';

type NodeType = 'switch' | 'bulb' | 'and' | 'or' | 'not' | 'xor';
type Node = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  val?: boolean;
};

type Connection = {
  id: string;
  fromNode: string;
  toNode: string;
  toInputIdx: number;
};

const getNumInputs = (t: NodeType) => (t === 'switch' ? 0 : t === 'bulb' || t === 'not' ? 1 : 2);
const getNumOutputs = (t: NodeType) => (t === 'bulb' ? 0 : 1);

const getNodeDim = (type: NodeType) => {
    if (type === 'bulb') return { w: 50, h: 50 };
    return { w: 80, h: 50 };
};

export default function LogicLab() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'switch', x: 50, y: 100, val: false },
    { id: '2', type: 'switch', x: 50, y: 220, val: false },
    { id: '3', type: 'and', x: 250, y: 160 },
    { id: '4', type: 'bulb', x: 450, y: 160 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { id: 'c1', fromNode: '1', toNode: '3', toInputIdx: 0 },
    { id: 'c2', fromNode: '2', toNode: '3', toInputIdx: 1 },
    { id: 'c3', fromNode: '3', toNode: '4', toInputIdx: 0 },
  ]);
  
  const [activeTool, setActiveTool] = useState<NodeType | 'select'>('select');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<{type: 'node'|'connection', id: string} | null>(null);
  
  const [connectingStart, setConnectingStart] = useState<{ nodeId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Evaluate circuit logic
  const evaluateVars = () => {
     const vals: Record<string, { in: boolean[], out: boolean }> = {};
     nodes.forEach(n => {
        vals[n.id] = { in: [false, false], out: n.type === 'switch' ? !!n.val : false };
     });

     for (let step = 0; step < nodes.length; step++) {
        let changed = false;
        
        connections.forEach(c => {
           if (vals[c.toNode] && vals[c.fromNode]) {
               vals[c.toNode].in[c.toInputIdx] = vals[c.fromNode].out;
           }
        });

        nodes.forEach(n => {
           let newOut = vals[n.id].out;
           if (n.type === 'not') newOut = !vals[n.id].in[0];
           else if (n.type === 'and') newOut = vals[n.id].in[0] && vals[n.id].in[1];
           else if (n.type === 'or') newOut = vals[n.id].in[0] || vals[n.id].in[1];
           else if (n.type === 'xor') newOut = vals[n.id].in[0] !== vals[n.id].in[1];
           else if (n.type === 'bulb') newOut = vals[n.id].in[0];
           
           if (newOut !== vals[n.id].out) {
               vals[n.id].out = newOut;
               changed = true;
           }
        });
        if (!changed) break;
     }
     return vals;
  };
  
  const evaluatedValues = evaluateVars();

  // Dragging and connecting visual updates
  const handleMouseMove = (e: React.MouseEvent) => {
     const rect = e.currentTarget.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     setMousePos({ x, y });

     if (draggingNode) {
         setNodes(prev => prev.map(n => {
            if (n.id === draggingNode) {
                const { w, h } = getNodeDim(n.type);
                return { ...n, x: x - w/2, y: y - h/2 };
            }
            return n;
         }));
     }
  };

  const handleMouseUp = () => {
     setDraggingNode(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
     if (activeTool !== 'select') {
        const rect = e.currentTarget.getBoundingClientRect();
        const { w, h } = getNodeDim(activeTool);
        const x = e.clientX - rect.left - w/2;
        const y = e.clientY - rect.top - h/2;
        
        setNodes(prev => [...prev, { 
            id: Date.now().toString() + Math.random().toString(36).substring(7), 
            type: activeTool, x, y, val: false 
        }]);
        setActiveTool('select');
     } else {
        setConnectingStart(null);
        setSelectedElement(null);
     }
  };

  const handleInputClick = (nodeId: string, idx: number) => {
     if (connectingStart) {
         const existing = connections.find(c => c.toNode === nodeId && c.toInputIdx === idx);
         if (existing) {
             setConnections(prev => [...prev.filter(c => c.id !== existing.id), { id: Date.now().toString(), fromNode: connectingStart.nodeId, toNode: nodeId, toInputIdx: idx }]);
         } else {
             setConnections(prev => [...prev, { id: Date.now().toString(), fromNode: connectingStart.nodeId, toNode: nodeId, toInputIdx: idx }]);
         }
         setConnectingStart(null);
     }
  };

  const handleDeleteSelected = () => {
      if (selectedElement) {
          if (selectedElement.type === 'node') {
              setNodes(prev => prev.filter(n => n.id !== selectedElement.id));
              setConnections(prev => prev.filter(c => c.fromNode !== selectedElement.id && c.toNode !== selectedElement.id));
          } else {
              setConnections(prev => prev.filter(c => c.id !== selectedElement.id));
          }
          setSelectedElement(null);
      }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Backspace' || e.key === 'Delete') {
              handleDeleteSelected();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const getOutputPos = (n: Node) => {
     const { w, h } = getNodeDim(n.type);
     return { x: n.x + w, y: n.y + h/2 };
  };
  const getInputPos = (n: Node, idx: number) => {
     const { h } = getNodeDim(n.type);
     const numIn = getNumInputs(n.type);
     if (numIn === 1) return { x: n.x, y: n.y + h/2 };
     return { x: n.x, y: n.y + (idx === 0 ? h*0.3 : h*0.7) };
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] w-full gap-8 max-w-[1400px] mx-auto select-none">
      <div className="flex-1 bg-[#0F0F0F] rounded-2xl border border-white/5 flex flex-col relative group overflow-hidden">
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0F0F0F] z-20">
          <div>
            <h2 className="text-2xl font-serif text-white mb-1">Logic Circuits</h2>
            <p className="text-xs text-white/50 tracking-wide">Connect gates and form logic chains</p>
          </div>
          {selectedElement && (
             <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 px-4 py-2 rounded border border-rose-500/20 transition-colors"
                title="Delete Selected (Backspace)"
             >
                <Trash2 size={16} /> <span className="text-xs uppercase tracking-widest">Delete</span>
             </button>
          )}
        </div>
        
        <div 
          className="flex-1 relative bg-[#050505] overflow-hidden rounded-b-2xl"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
          
          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             {connections.map(c => {
                 const fromNode = nodes.find(n => n.id === c.fromNode);
                 const toNode = nodes.find(n => n.id === c.toNode);
                 if (!fromNode || !toNode) return null;
                 
                 const start = getOutputPos(fromNode);
                 const end = getInputPos(toNode, c.toInputIdx);
                 const isSelected = selectedElement?.id === c.id;
                 const isActive = evaluatedValues[fromNode.id]?.out;

                 return (
                    <path 
                      key={c.id} 
                      d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`}
                      fill="none"
                      stroke={isSelected ? '#fff' : isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)'}
                      strokeWidth={isSelected ? 4 : 2}
                      className="pointer-events-auto cursor-pointer transition-colors duration-200"
                      onClick={(e) => { e.stopPropagation(); setSelectedElement({type: 'connection', id: c.id}); setConnectingStart(null); }}
                    />
                 )
             })}
             {connectingStart && (
                 (() => {
                     const fromNode = nodes.find(n => n.id === connectingStart.nodeId)!;
                     const start = getOutputPos(fromNode);
                     const isActive = evaluatedValues[fromNode.id]?.out;
                     return (
                         <path d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${mousePos.x - 50} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`} 
                               fill="none" stroke={isActive ? '#D4AF37' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeDasharray="5,5" />
                     );
                 })()
             )}
          </svg>

          {/* Nodes */}
          {nodes.map(n => {
             const dim = getNodeDim(n.type);
             const isSelected = selectedElement?.id === n.id;
             const isOutActive = evaluatedValues[n.id]?.out;

             return (
               <div 
                 key={n.id} 
                 className={`absolute transition-shadow ${isSelected ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.8)_intset] rounded-md' : ''}`} 
                 style={{ left: n.x, top: n.y, width: dim.w, height: dim.h }}
                 onMouseDown={(e) => { 
                    e.stopPropagation(); 
                    if (activeTool === 'select') {
                       setDraggingNode(n.id); 
                       setSelectedElement({type: 'node', id: n.id}); 
                    }
                 }}
                 onClick={(e) => e.stopPropagation()}
               >
                  {/* Gate Core Rendering */}
                  {n.type === 'switch' ? (
                     <div 
                        className={`w-full h-full bg-[#1A1A1A] rounded flex flex-col items-center justify-center cursor-pointer border ${isSelected ? 'border-white' : isOutActive ? 'border-[#D4AF37]' : 'border-white/20'}`}
                        onClick={() => { setNodes(prev => prev.map(m => m.id === n.id ? {...m, val: !m.val} : m)) }}
                     >
                        <span className="text-[9px] text-white/50 mb-1 absolute top-1 left-2">IN</span>
                        <div className={`w-10 h-5 text-[10px] font-mono flex items-center justify-center rounded transition-colors ${n.val ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/10 text-white/50'} `}>
                            {n.val ? 'ON' : 'OFF'}
                        </div>
                     </div>
                  ) : n.type === 'bulb' ? (
                     <div className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isOutActive ? 'bg-[#D4AF37] border-white shadow-[0_0_30px_#D4AF37]' : isSelected ? 'bg-[#111] border-white' : 'bg-[#111] border-white/20'}`}>
                         <Zap size={20} className={isOutActive ? 'text-black' : 'text-white/20'} />
                     </div>
                  ) : (
                     <div className={`w-full h-full bg-[#1A1A1A] border rounded flex items-center justify-center font-bold font-mono text-sm shadow-xl transition-colors ${isSelected ? 'border-white bg-[#222]' : 'border-white/20'}`}>
                         <span className={isOutActive ? 'text-[#D4AF37]' : 'text-white/80'}>{n.type.toUpperCase()}</span>
                     </div>
                  )}
                  
                  {/* Inputs */}
                  {getNumInputs(n.type) > 0 && Array.from({length: getNumInputs(n.type)}).map((_, i) => (
                     <div 
                        key={i} 
                        className="absolute w-3 h-3 bg-[#050505] border border-white/50 rounded-full cursor-crosshair hover:bg-white hover:scale-150 transition-all z-10"
                        style={{ left: -6, top: getNumInputs(n.type) === 1 ? dim.h/2-6 : (i===0 ? dim.h*0.3-6 : dim.h*0.7-6) }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); handleInputClick(n.id, i); }}
                        title="Connect to Input"
                     />
                  ))}

                  {/* Outputs */}
                  {getNumOutputs(n.type) > 0 && (
                     <div 
                        className={`absolute w-3 h-3 rounded-full cursor-crosshair hover:bg-white hover:scale-150 transition-all border z-10 ${isOutActive ? 'bg-[#D4AF37] border-white' : 'bg-[#1A1A1A] border-white/50'}`}
                        style={{ right: -6, top: dim.h/2-6 }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); setConnectingStart({ nodeId: n.id }); setSelectedElement(null); }}
                        title="Start Connection"
                     />
                  )}
               </div>
             );
          })}
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Components Library</h3>
            
            <div className="grid grid-cols-2 gap-3">
               {[
                 { type: 'select', label: 'Select / Move', icon: <MousePointer2 size={16} /> },
                 { type: 'switch', label: 'Input Switch', icon: <Plus size={16} /> },
                 { type: 'bulb', label: 'Output Bulb', icon: <Zap size={16} /> },
                 { type: 'and', label: 'AND Gate', icon: <span className="font-mono text-xs font-bold">AND</span> },
                 { type: 'or', label: 'OR Gate', icon: <span className="font-mono text-xs font-bold">OR</span> },
                 { type: 'not', label: 'NOT Gate', icon: <span className="font-mono text-xs font-bold">NOT</span> },
                 { type: 'xor', label: 'XOR Gate', icon: <span className="font-mono text-xs font-bold">XOR</span> },
               ].map((tool) => (
                  <button 
                     key={tool.type}
                     onClick={() => setActiveTool(tool.type as any)}
                     className={`flex flex-col items-center justify-center p-3 gap-2 rounded-lg border transition-all ${
                         activeTool === tool.type ? 'bg-white/10 border-[#D4AF37] text-white shadow-inner' : 'bg-[#1A1A1A] border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                     }`}
                  >
                     <div className={activeTool === tool.type ? 'text-[#D4AF37]' : ''}>{tool.icon}</div>
                     <span className="text-[10px] uppercase tracking-widest font-mono">{tool.label}</span>
                  </button>
               ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5 mt-2">
              <button 
                onClick={() => {
                   setNodes([]);
                   setConnections([]);
                   setSelectedElement(null);
                }}
                className="w-full py-3 border border-rose-500/20 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded transition-colors flex justify-center items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                <RotateCcw size={14} /> Clear Canvas
              </button>
            </div>
         </div>

         <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 flex-1 flex flex-col p-6">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Instructions</h3>
            <div className="space-y-4 text-xs font-mono text-white/50 leading-relaxed">
               <p>1. <strong className="text-white">Add parts</strong> by selecting them from the library and clicking on the canvas.</p>
               <p>2. <strong className="text-[#D4AF37]">Connect nodes</strong> by clicking the right output dot of one gate, and clicking the left input dot of another.</p>
               <p>3. <strong className="text-white">Toggle switches</strong> by clicking them directly on the canvas.</p>
               <p>4. <strong className="text-white">Move parts</strong> around using the Select tool.</p>
               <p>5. <strong className="text-rose-400">Delete items</strong> by clicking on them and pressing Backspace or clicking Delete.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
