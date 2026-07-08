import React, { useState, useEffect } from 'react';

export default function Sidebar({ activeView, setActiveView, startTour }) {

  const [packCount, setPackCount] = useState(0);
  const [vram, setVram] = useState(8.8);
  const [temp, setTemp] = useState(53);
  const [isDark, setIsDark] = useState(true);
  const [sovereignMode, setSovereignMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpuHistory, setGpuHistory] = useState([8, 12, 10, 14, 9, 11, 13, 10, 12, 10]);

  useEffect(() => {
    // Sync theme with localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }

    setSovereignMode(localStorage.getItem('sovereign_mode') === 'true');

    // Fetch pack count
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        if (data.packs) setPackCount(data.packs.length);
      })
      .catch(() => {});

    // Listen to inference events from chat console
    const handleSpike = () => {
      setIsProcessing(true);
      setVram(16.4);
      setTemp(64);
    };

    const handleIdle = () => {
      setIsProcessing(false);
    };

    window.addEventListener('gpuSpike', handleSpike);
    window.addEventListener('gpuIdle', handleIdle);

    // Dynamic metrics updating
    const interval = setInterval(() => {
      setVram(v => {
        if (isProcessing) {
          return +(15.5 + Math.random() * 1.5).toFixed(2);
        }
        return +(8.5 + Math.random() * 0.6).toFixed(2);
      });

      setTemp(t => {
        if (isProcessing) {
          return Math.floor(62 + Math.random() * 4);
        }
        return Math.floor(52 + Math.random() * 2);
      });

      // Update moving sparkline history
      setGpuHistory(history => {
        const nextVal = isProcessing 
          ? Math.floor(75 + Math.random() * 20) 
          : Math.floor(8 + Math.random() * 8);
        return [...history.slice(1), nextVal];
      });

    }, 1500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gpuSpike', handleSpike);
      window.removeEventListener('gpuIdle', handleIdle);
    };
  }, [isProcessing]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  const toggleSovereignMode = () => {
    const current = !sovereignMode;
    setSovereignMode(current);
    localStorage.setItem('sovereign_mode', current ? 'true' : 'false');
    window.dispatchEvent(new Event('sovereignModeChange'));
  };

  const navItems = [
    { id: 'console', label: 'Live Console', icon: '💬' },
    { id: 'inspector', label: 'Audit Ledger', icon: '🔍' },
    { id: 'catalog', label: 'Capability Catalog', icon: '📚' },
    { id: 'studio', label: 'Pack Studio', icon: '🛠️' },
  ];

  // Map history values to SVG polyline coordinates
  const sparklinePoints = gpuHistory
    .map((val, idx) => `${idx * 20},${40 - val * 0.35}`)
    .join(' ');

  return (
    <div className="w-64 h-screen bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0">
      <div className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-[#58a6ff] drop-shadow-[0_0_8px_rgba(88,166,255,0.4)]">🏰</span> GuildHouse
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-[#8b949e] font-bold mt-1">Sovereign AI Appliance</p>
        </div>
        <button
          onClick={toggleTheme}
          className="text-sm bg-[#21262d] border border-[#30363d] hover:border-[#8b949e] p-2 rounded-xl transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>


      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              activeView === item.id
                ? 'bg-[#1f6feb] text-white shadow-md shadow-[#1f6feb]/15'
                : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.id === 'catalog' && packCount > 0 && (
              <span className="bg-[#30363d] text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                {packCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Quick Demo Tour Button */}
      <div className="px-4 pb-4">
        <button
          onClick={startTour}
          className="w-full py-2.5 bg-[#1f6feb]/15 hover:bg-[#1f6feb]/25 border border-[#1f6feb]/30 text-[#58a6ff] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          ✨ Quick Demo Tour
        </button>
      </div>


      {/* Dynamic Appliance Dashboard Box */}
      <div className="p-4 border-t border-[#30363d] bg-[#0d1117]/30">
        <div className="bg-[#0d1117] rounded-2xl p-4 border border-[#30363d] space-y-3 shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Resident Brain</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-[9px] uppercase tracking-wide text-[#3fb950] font-bold">Local</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-white font-black">Gemma 2 9B</p>
            <p className="text-[10px] text-[#58a6ff] font-bold mt-0.5">ROCm 6.0 Accelerated</p>
          </div>

          <div className="pt-2 border-t border-[#30363d]/50 grid grid-cols-2 gap-2 text-[10px] font-mono text-[#8b949e] pb-1">
            <div>
              <p className="text-[8px] uppercase tracking-wide font-sans">VRAM LOAD</p>
              <p className="text-white font-bold mt-0.5">{vram} GB</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wide font-sans">GPU TEMP</p>
              <p className="text-white font-bold mt-0.5">{temp} °C</p>
            </div>
          </div>

          {/* SVG Sparkline utilization graph */}
          <div className="pt-2 border-t border-[#30363d]/30">
            <p className="text-[8px] uppercase tracking-wide font-sans text-[#8b949e] mb-1.5">GPU TELEMETRY STREAM</p>
            <div className="h-10 bg-[#090d13] rounded-lg border border-[#30363d] overflow-hidden flex items-end">
              <svg className="w-full h-full" viewBox="0 0 180 40">
                <polyline
                  fill="none"
                  stroke={isProcessing ? "#3fb950" : "#58a6ff"}
                  strokeWidth="2"
                  points={sparklinePoints}
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          </div>

          <div className="pt-2 border-t border-[#30363d]/50 flex justify-between items-center text-[10px] font-bold text-[#8b949e]">
            <span className="uppercase font-sans tracking-wide">Sovereign Switch</span>
            <button
              onClick={toggleSovereignMode}
              className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 ${
                sovereignMode ? 'bg-[#238636]' : 'bg-[#30363d]'
              }`}
              title={sovereignMode ? "Turn Off Strict Sovereign Mode" : "Enforce Strict Sovereign Mode"}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-all duration-200 ${
                sovereignMode ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



