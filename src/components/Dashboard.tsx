import { PlayCircle, Clock, BookOpen, Loader2 } from 'lucide-react';
import type { Lab } from '../data';

export default function Dashboard({ 
  onSelectLab, 
  labs,
  activeView,
  isSearching = false
}: { 
  onSelectLab: (id: string) => void,
  labs: Lab[],
  activeView: string,
  isSearching?: boolean
}) {
  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      {/* Banner - Only show on main dashboard view */}
      {activeView === 'dashboard' && !isSearching && (
        <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-10 mb-10 text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-serif mb-2 tracking-tight text-white">Welcome to the Lab</h1>
            <p className="text-white/50 text-sm mb-8 leading-relaxed font-mono">
              &gt; Ready to continue your experiments? You have pending modules waiting for review.
              <br />&gt; System ready for initialization.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => onSelectLab('pendulum-01')}
                className="text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center gap-3 w-max"
              >
                <PlayCircle size={16} />
                Run Pendulum Dynamics
              </button>
              <button 
                onClick={() => onSelectLab('boyles-law-01')}
                className="text-[10px] uppercase tracking-widest border border-white/30 text-white px-6 py-3 rounded font-bold hover:bg-white/10 transition-colors flex items-center gap-3 w-max"
              >
                Launch Boyle's Law
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <h2 className="text-sm uppercase tracking-widest text-white/60 flex items-center gap-2">
          {activeView === 'dashboard' ? 'Available Experiments' : `Filtered by: ${activeView}`}
          {isSearching && <Loader2 size={14} className="animate-spin text-white/40" />}
        </h2>
        <div className="text-[10px] font-mono text-[#D4AF37]">{labs.length} MODULES ONLINE</div>
      </div>

      {labs.length === 0 ? (
         <div className="text-center py-20 bg-[#0F0F0F] border border-white/5 rounded-2xl">
            <p className="text-white/40 font-mono text-sm">No modules found matching your criteria.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {labs.map((lab: Lab) => (
            <div 
              key={lab.id}
              className="group bg-[#0F0F0F] border border-white/5 rounded-2xl transition-all duration-300 hover:border-white/20 overflow-hidden flex flex-col cursor-pointer"
              onClick={() => onSelectLab(lab.id)}
            >
              {/* Card Header graphic */}
              <div className={`h-40 bg-black/40 border-b border-white/5 p-6 flex flex-col justify-end relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.05)_0%,_transparent_70%)] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-dashed border-[#D4AF37]/20 rounded-full opacity-50 group-hover:rotate-12 transition-transform duration-700 pointer-events-none"></div>
                
                <span className={`inline-flex items-center self-start px-2 py-1 text-[9px] uppercase tracking-widest border border-white/10 text-white/60 bg-black/50 mb-3 relative z-10`}>
                  {lab.category}
                </span>
                <h3 className="font-serif text-white text-xl leading-tight relative z-10">
                  {lab.title}
                </h3>
              </div>
              
              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col bg-[#0F0F0F]">
                <p className="text-white/40 text-sm leading-relaxed flex-1 mb-6">
                  {lab.description}
                </p>
                
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#D4AF37]/60 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock size={12} className="text-white/30" />
                    {lab.estimatedTime}m
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <BookOpen size={12} className="text-white/30" />
                    {lab.difficulty}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
