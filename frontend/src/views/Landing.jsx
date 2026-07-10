import React from 'react';

export default function Landing({ onEnter }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d1117] text-[#c9d1d9] font-sans relative overflow-hidden bg-grid-pattern">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1f6feb]/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="z-10 text-center flex flex-col items-center space-y-8 animate-fadeIn max-w-2xl px-6">
        <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(88,166,255,0.6)]">🏰</div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
          Guild<span className="text-[#58a6ff]">House</span>
        </h1>
        <p className="text-lg md:text-xl text-[#8b949e] font-medium max-w-xl mx-auto leading-relaxed">
          A Sovereign AI Clerk Runtime with Installable Capability Packs on AMD Infrastructure. 
          Keep your data safe, deploy specialized clerks, and govern your costs.
        </p>
        
        <div className="pt-8">
          <button
            onClick={onEnter}
            className="group relative px-10 py-5 bg-[#238636] hover:bg-[#2ea043] text-white text-lg font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(46,160,67,0.4)] hover:shadow-[0_0_30px_rgba(46,160,67,0.6)] hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Enter Dashboard
              <span className="group-hover:translate-x-1 transition-transform inline-block">➔</span>
            </span>
            <div className="absolute inset-0 h-full w-full scale-[1.5] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-[#30363d]/50 w-full">
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-sm font-bold text-white mb-1">Local-First Privacy</h3>
            <p className="text-xs text-[#8b949e]">Sensitive data never leaves your infrastructure.</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📦</div>
            <h3 className="text-sm font-bold text-white mb-1">Pack Ecosystem</h3>
            <p className="text-xs text-[#8b949e]">Install specific domain clerks like apps.</p>
          </div>
          <div>
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="text-sm font-bold text-white mb-1">AMD Accelerated</h3>
            <p className="text-xs text-[#8b949e]">Powered by ROCm and Fireworks AI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
