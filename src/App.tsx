import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Beaker, Menu, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PendulumLab from './components/PendulumLab';
import BoyleLawLab from './components/BoyleLawLab';
import PopulationLab from './components/PopulationLab';
import TitrationLab from './components/TitrationLab';
import CircuitLab from './components/CircuitLab';
import SortingLab from './components/SortingLab';
import ProjectileLab from './components/ProjectileLab';
import MitosisLab from './components/MitosisLab';
import EnzymeLab from './components/EnzymeLab';
import BinaryLab from './components/BinaryLab';
import LogicLab from './components/LogicLab';
import MemoryLab from './components/MemoryLab';
import OSLab from './components/OSLab';
import MMULab from './components/MMULab';
import DSLab from './components/DSLab';
import AILab from './components/AILab';
import { SyllabusManager } from './components/SyllabusManager';
import { LABS } from './data';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'experiments', 'library', 'progress', 'settings', 'logout', or Categories
  const [activeLabId, setActiveLabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [filteredLabs, setFilteredLabs] = useState(LABS);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      let currentFiltered = LABS;
      if (['Physics', 'Chemistry', 'Biology', 'Computer Science'].includes(activeView)) {
        currentFiltered = currentFiltered.filter(l => l.category === activeView);
      }
      
      if (searchQuery.trim() !== '') {
        setIsSearching(true);
        try {
          const res = await fetch('/api/search-labs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery }),
          });
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          if (data.results && isMounted) {
            const semanticResultIds = data.results.map((r: any) => r.id);
            currentFiltered = currentFiltered
               .filter(l => semanticResultIds.includes(l.id))
               .sort((a, b) => semanticResultIds.indexOf(a.id) - semanticResultIds.indexOf(b.id));
          }
        } catch (err) {
          console.error("Semantic search failed, falling back to text search:", err);
          // Fallback to text search if API fails
          if (isMounted) {
            const q = searchQuery.toLowerCase();
            currentFiltered = currentFiltered.filter(l => 
              l.title.toLowerCase().includes(q) || 
              l.description.toLowerCase().includes(q) ||
              l.category.toLowerCase().includes(q)
            );
          }
        } finally {
          if (isMounted) setIsSearching(false);
        }
      } else {
        if (isMounted) setIsSearching(false);
      }
      
      if (isMounted) {
         setFilteredLabs(currentFiltered);
      }
    }, 500); // 500ms debounce
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, activeView]);

  const handleSelectLab = (id: string) => {
    setActiveLabId(id);
  };

  const handleBackToDashboard = () => {
    setActiveLabId(null);
  };

  const activeLab = LABS.find(l => l.id === activeLabId);

  return (
    <div className="flex bg-[#050505] min-h-screen text-[#E0E0E0] font-sans selection:bg-[#D4AF37]/30 selection:text-white overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={(v) => { setActiveView(v); setActiveLabId(null); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isOpen={isSidebarOpen} />
      
      <main className={`flex-1 flex flex-col h-screen overflow-hidden bg-[#050505] transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header Ribbon */}
        <header className="h-20 bg-[#070707] border-b border-white/10 flex items-center px-6 z-10 shrink-0 gap-4">
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="p-2 hover:bg-white/5 rounded transition-colors text-white/50 hover:text-white flex-shrink-0"
             title="Toggle Sidebar"
          >
             <Menu size={20} />
          </button>
          
          <nav className="flex items-center text-[10px] uppercase tracking-widest text-white/30 truncate flex-1 min-w-0">
            <button 
               onClick={handleBackToDashboard}
               className="hover:text-white transition-colors"
            >
              {activeView.toUpperCase()}
            </button>
            {activeLab && (
              <>
                <ChevronRight size={14} className="mx-2 text-white/20" />
                <span className="font-mono text-sm text-[#D4AF37] uppercase tracking-normal">{activeLab.title}</span>
              </>
            )}
          </nav>
        </header>

        {/* Dynamic Canvas Container */}
        <div className="flex-1 overflow-auto relative scroll-smooth bg-[#050505] p-10">
          <AnimatePresence mode="wait">
            {activeLabId ? (
              <motion.div 
                key="lab" 
                initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                {activeLabId === 'pendulum-01' ? (
                  <PendulumLab />
                ) : activeLabId === 'boyles-law-01' ? (
                  <BoyleLawLab />
                ) : activeLabId === 'population-01' ? (
                  <PopulationLab />
                ) : activeLabId === 'titration-01' ? (
                  <TitrationLab />
                ) : activeLabId === 'circuit-01' ? (
                  <CircuitLab />
                ) : activeLabId === 'algo-01' ? (
                  <SortingLab />
                ) : activeLabId === 'projectile-01' ? (
                  <ProjectileLab />
                ) : activeLabId === 'cell-01' ? (
                  <MitosisLab />
                ) : activeLabId === 'enzyme-01' ? (
                  <EnzymeLab />
                ) : activeLabId === 'binary-01' ? (
                  <BinaryLab />
                ) : activeLabId === 'logic-01' ? (
                  <LogicLab />
                ) : activeLabId === 'memory-01' ? (
                  <MemoryLab />
                ) : activeLabId === 'os-01' ? (
                  <OSLab />
                ) : activeLabId === 'mmu-01' ? (
                  <MMULab />
                ) : activeLabId === 'ds-01' ? (
                  <DSLab />
                ) : null}
              </motion.div>
            ) : activeView === 'ai-visualizer' ? (
               <motion.div 
                 key="ai-visualizer" 
                 initial={{ opacity: 0, y: 15 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
                 className="h-[calc(100vh-6rem)]"
               >
                 <AILab />
               </motion.div>
            ) : activeView === 'syllabus' ? (
               <motion.div 
                 key="syllabus" 
                 initial={{ opacity: 0, y: 15 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
                 className="h-[calc(100vh-6rem)]"
               >
                 <SyllabusManager />
               </motion.div>
            ) : (
                  <motion.div 
                    key="dashboard" 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Dashboard onSelectLab={handleSelectLab} labs={filteredLabs} activeView={activeView} isSearching={isSearching} />
                  </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
