import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Console from './views/Console';
import Inspector from './views/Inspector';
import Catalog from './views/Catalog';
import PackStudio from './views/PackStudio';
import Landing from './views/Landing';

export default function App() {
  const [isDashboard, setIsDashboard] = useState(false);
  const [activeView, setActiveView] = useState('console');
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const startTour = () => {
    setActiveView('console');
    setShowTour(true);
    setTourStep(1);
  };

  const handleNextTour = () => {
    if (tourStep === 1) {
      setTourStep(2);
    } else if (tourStep === 2) {
      setTourStep(3);
    } else if (tourStep === 3) {
      setActiveView('inspector');
      setTourStep(4);
    } else if (tourStep === 4) {
      setActiveView('studio');
      setTourStep(5);
    } else if (tourStep === 5) {
      setShowTour(false);
      setActiveView('console');
    }
  };

  const tourSteps = {
    1: {
      title: "🏰 Welcome to GuildHouse",
      text: "This is a Sovereign AI Clerk Appliance powered by AMD ROCm hardware. Let's take a 45-second tour of the main features.",
      pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    },
    2: {
      title: "💬 Live Clerk Console",
      text: "Select a capability pack in the dropdown and converse with the clerk. You can click 'Simulate File' below to test local Vision/OCR tool pipelines (like receipts and video processing).",
      pos: "bottom-4 left-1/2 -translate-x-1/2 md:bottom-32 md:right-12 md:left-auto md:translate-x-0"
    },
    3: {
      title: "🔒 Strict Sovereign Switch",
      text: "Toggle the Sovereign Switch in the sidebar card to cut off external APIs completely. Sending a complex prompt with Sovereign Mode active forces a secure local fallback, preventing unredacted data leaks under PDPA.",
      pos: "bottom-4 left-1/2 -translate-x-1/2 md:bottom-12 md:left-72 md:translate-x-0"
    },
    4: {
      title: "📖 Audit Ledger & compliance",
      text: "Check compliance ledger records to verify redacted boundary crossings, or check cost vitals tracking Fireworks AI API spend against the shared $50 cap.",
      pos: "top-24 left-1/2 -translate-x-1/2"
    },
    5: {
      title: "🛠️ Hot-Reload Pack Studio",
      text: "Open any installed pack file, edit validation rules directly in YAML, and click Hot-Reload to swap active configurations in memory in real-time.",
      pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    }
  };

  if (!isDashboard) {
    return <Landing onEnter={() => setIsDashboard(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30 relative overflow-hidden bg-grid-pattern flex-col md:flex-row">
      
      {/* Mobile Header (Hidden on md and larger) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <span className="text-[#58a6ff] drop-shadow-[0_0_8px_rgba(88,166,255,0.4)]">🏰</span> GuildHouse
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white bg-[#21262d] border border-[#30363d] p-2 rounded-xl text-lg hover:bg-[#30363d] transition-all"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar - Mobile Drawer Transition */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => {
            setActiveView(view);
            setIsMobileMenuOpen(false);
          }} 
          startTour={startTour} 
          onExit={() => setIsDashboard(false)} 
        />
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        />
      )}

      {/* Main Panel views */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeView === 'console' && <Console />}
        {activeView === 'inspector' && <Inspector />}
        {activeView === 'catalog' && <Catalog />}
        {activeView === 'studio' && <PackStudio />}
      </div>

      {/* Floating Tour Guide Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-auto" onClick={() => setShowTour(false)} />
          
          <div className={`absolute p-6 rounded-2xl bg-[#161b22] border-2 border-[#58a6ff]/40 text-[#c9d1d9] shadow-2xl max-w-[90%] sm:max-w-sm w-full pointer-events-auto animate-slideUp ${tourSteps[tourStep].pos}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{tourSteps[tourStep].title}</span>
                <span className="text-[10px] bg-[#30363d] px-2 py-0.5 rounded font-mono text-[#8b949e]">Step {tourStep} of 5</span>
              </h4>
              <button 
                onClick={() => setShowTour(false)}
                className="text-[#8b949e] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-[#8b949e] leading-relaxed mb-4">{tourSteps[tourStep].text}</p>
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setShowTour(false)} 
                className="text-xs text-[#8b949e] hover:text-white font-bold"
              >
                Skip Tour
              </button>
              <button 
                onClick={handleNextTour} 
                className="bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                {tourStep === 5 ? 'Finish Tour 🚀' : 'Next Step ➔'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


