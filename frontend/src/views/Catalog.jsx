import React, { useState, useEffect } from 'react';

export default function Catalog() {
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => setPacks(data.packs));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117] overflow-y-auto">
      <div className="p-12">
        <h1 className="text-3xl font-bold text-white mb-2">Capability Packs</h1>
        <p className="text-[#8b949e] mb-8">Installed domain expertise for your sovereign runtime.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack, idx) => (
            <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 hover:border-[#8b949e] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{pack.name}</h3>
                <span className="bg-[#238636]/20 text-[#3fb950] px-2 py-1 rounded text-xs font-bold border border-[#2ea043]/30">
                  v{pack.version}
                </span>
              </div>
              <p className="text-[#8b949e] text-sm mb-6 h-10">{pack.description}</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-1 font-semibold">Persona Voice</p>
                  <p className="text-sm text-[#c9d1d9] truncate">{pack.persona?.voice || 'Standard'}</p>
                </div>
                <div className="flex gap-2">
                  {pack.languages?.map(lang => (
                     <span key={lang} className="bg-[#1f6feb]/20 text-[#58a6ff] px-2 py-0.5 rounded text-xs font-mono uppercase">
                       {lang}
                     </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
