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
      pos: "bottom-32 right-12"
    },
    3: {
      title: "🔒 Strict Sovereign Switch",
      text: "Toggle the Sovereign Switch in the sidebar card to cut off external APIs completely. Sending a complex prompt with Sovereign Mode active forces a secure local fallback, preventing unredacted data leaks under PDPA.",
      pos: "bottom-12 left-72"
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
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30 relative overflow-hidden bg-grid-pattern">
      <Sidebar activeView={activeView} setActiveView={setActiveView} startTour={startTour} onExit={() => setIsDashboard(false)} />
      
      {activeView === 'console' && <Console />}
      {activeView === 'inspector' && <Inspector />}
      {activeView === 'catalog' && <Catalog />}
      {activeView === 'studio' && <PackStudio />}

      {/* Floating Tour Guide Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-auto" onClick={() => setShowTour(false)} />
          
          <div className={`absolute p-6 rounded-2xl bg-[#161b22] border-2 border-[#58a6ff]/40 text-[#c9d1d9] shadow-2xl max-w-sm w-full pointer-events-auto animate-slideUp ${tourSteps[tourStep].pos}`}>
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


