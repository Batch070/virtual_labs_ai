import { Home, Atom, Beaker, Activity, Cpu, Search, Sparkles, BookOpen } from 'lucide-react';

export default function Sidebar({ 
  activeView, 
  setActiveView,
  searchQuery,
  setSearchQuery,
  isOpen
}: { 
  activeView: string, 
  setActiveView: (v: string) => void,
  searchQuery: string,
  setSearchQuery: (s: string) => void,
  isOpen: boolean
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ai-visualizer', label: 'AI Visualizer', icon: Sparkles },
    { id: 'syllabus', label: 'Syllabus Library', icon: BookOpen },
  ];

  return (
    <aside className={`w-64 border-r border-white/10 bg-[#0A0A0A] flex flex-col h-screen fixed top-0 left-0 justify-between transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="p-8 pb-4">
        <h1 className="cursor-pointer text-2xl font-serif italic text-white tracking-tight hover:text-[#D4AF37] transition-colors" onClick={() => setActiveView('dashboard')}>Virtual Labs AI</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Academic Division</p>
      </div>

      {/* Search */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="SEARCH MODULES..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F0F0F] text-[10px] uppercase tracking-widest text-white/80 placeholder:text-white/30 rounded py-2.5 pl-9 pr-4 focus:outline-none border border-white/5 focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group ${
                isActive 
                  ? 'bg-white/5 text-white border border-white/10' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white'} />
              {item.label}
            </button>
          );
        })}

        <div className="mt-8 mb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/60">
          Laboratories
        </div>
        {[
          {name: 'Physics', icon: Atom}, 
          {name: 'Chemistry', icon: Beaker}, 
          {name: 'Biology', icon: Activity},
          {name: 'Computer Science', icon: Cpu}
        ].map(cat => {
          const isActive = activeView === cat.name;
          const Icon = cat.icon;
          return (
             <button 
                key={cat.name} 
                onClick={() => setActiveView(cat.name)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                   isActive ? 'text-white bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
             >
                <Icon size={16} className={isActive ? 'text-white' : 'text-white/30 group-hover:text-white/60'} />
                {cat.name}
             </button>
          );
        })}
      </nav>
    </aside>
  );
}
