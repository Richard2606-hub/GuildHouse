import React from 'react';

export default function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'console', label: 'Console', icon: '💬' },
    { id: 'inspector', label: 'Inspector', icon: '🔍' },
    { id: 'catalog', label: 'Catalog', icon: '📚' },
    { id: 'studio', label: 'Pack Studio', icon: '🛠️' },
  ];

  return (
    <div className="w-64 h-screen bg-[#161b22] border-r border-[#30363d] flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-[#58a6ff]">🏰</span> GuildHouse
        </h1>
        <p className="text-xs text-[#8b949e] mt-1">Sovereign AI Appliance</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.id
                ? 'bg-[#1f6feb] text-white'
                : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#30363d]">
        <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
          <p className="text-xs text-[#8b949e] mb-1">Resident Brain</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-sm text-white font-medium">Gemma 2</p>
          </div>
          <p className="text-xs text-[#58a6ff] mt-1">ROCm Accelerated</p>
        </div>
      </div>
    </div>
  );
}
