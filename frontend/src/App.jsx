import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Console from './views/Console';
import Inspector from './views/Inspector';
import Catalog from './views/Catalog';

export default function App() {
  const [activeView, setActiveView] = useState('console');

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {activeView === 'console' && <Console />}
      {activeView === 'inspector' && <Inspector />}
      {activeView === 'catalog' && <Catalog />}
      {activeView === 'studio' && (
        <div className="flex-1 flex items-center justify-center">
           <div className="text-center">
             <h2 className="text-2xl font-bold text-white mb-2">Pack Studio</h2>
             <p className="text-[#8b949e]">The hot-reload editor is under construction.</p>
           </div>
        </div>
      )}
    </div>
  );
}
