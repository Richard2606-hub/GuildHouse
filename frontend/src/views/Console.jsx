import React, { useState, useEffect } from 'react';

export default function Console() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        setPacks(data.packs);
        if (data.packs.length > 0) setSelectedPack(data.packs[0].name.toLowerCase().replace(' ', '_'));
      });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedPack) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, pack_id: selectedPack })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'clerk', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'clerk', content: 'Error communicating with the house.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117]">
      <div className="h-16 border-b border-[#30363d] flex items-center justify-between px-8 bg-[#161b22]">
        <h2 className="text-xl font-semibold text-white">Live Console</h2>
        <select 
          value={selectedPack} 
          onChange={(e) => setSelectedPack(e.target.value)}
          className="bg-[#0d1117] border border-[#30363d] text-white text-sm rounded-lg px-4 py-2 focus:ring-[#58a6ff] focus:border-[#58a6ff]"
        >
          {packs.map(p => (
            <option key={p.name} value={p.name.toLowerCase().replace(' ', '_')}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-2xl px-6 py-4 ${
              msg.role === 'user' 
                ? 'bg-[#1f6feb] text-white' 
                : 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9]'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#161b22] border border-[#30363d] text-[#8b949e] rounded-2xl px-6 py-4 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce"></div>
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style={{animationDelay: '0.2s'}}></div>
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#161b22] border-t border-[#30363d]">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Speak with the clerk..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-6 py-4 text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
