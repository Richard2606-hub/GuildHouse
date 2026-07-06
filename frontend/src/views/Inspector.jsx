import React, { useState, useEffect } from 'react';

export default function Inspector() {
  const [events, setEvents] = useState([]);

  const fetchLedger = () => {
    fetch('/api/ledger')
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events.reverse());
      });
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117]">
      <div className="h-16 border-b border-[#30363d] flex items-center justify-between px-8 bg-[#161b22]">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-[#d2a8ff]">📖</span> House Ledger
        </h2>
        <button onClick={fetchLedger} className="text-[#58a6ff] hover:text-[#79c0ff] text-sm font-medium">
          Refresh Stream
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          {events.map((evt, idx) => (
            <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <div className="px-6 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    evt.event_type === 'escalation' ? 'bg-[#da3633]/20 text-[#ff7b72]' :
                    evt.event_type === 'local_draft' ? 'bg-[#238636]/20 text-[#3fb950]' :
                    'bg-[#1f6feb]/20 text-[#58a6ff]'
                  }`}>
                    {evt.event_type.toUpperCase()}
                  </span>
                  <span className="text-[#8b949e] text-sm">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="px-6 py-4">
                <pre className="text-[#c9d1d9] text-sm overflow-x-auto font-mono">
                  {JSON.stringify(evt.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
