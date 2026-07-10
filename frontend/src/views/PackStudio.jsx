import React, { useState, useEffect } from 'react';

export default function PackStudio() {
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [yamlContent, setYamlContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [versionBumped, setVersionBumped] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor' | 'reference'

  const fetchPacks = () => {
    setLoading(true);
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        setPacks(data.packs);
        if (data.packs.length > 0 && !selectedPack) {
          const firstPack = data.packs[0];
          setSelectedPack(firstPack);
          fetchRawPack(firstPack.name);
        } else if (selectedPack) {
          // Keep current selection but refresh details
          const updated = data.packs.find(p => p.name === selectedPack.name);
          if (updated) setSelectedPack(updated);
        }
        setLoading(false);
      })
      .catch(err => {
        setStatus({ type: 'error', message: 'Failed to load packs registry.' });
        setLoading(false);
      });
  };

  const fetchRawPack = (packName) => {
    setEditorLoading(true);
    const id = packName.toLowerCase().replaceAll(' ', '_');
    fetch(`/api/packs/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.json();
      })
      .then(data => {
        setYamlContent(data.content);
        setOriginalContent(data.content);
        setStatus({ type: '', message: '' });
        setEditorLoading(false);
      })
      .catch(err => {
        setStatus({ type: 'error', message: `Could not fetch raw YAML for ${packName}` });
        setEditorLoading(false);
      });
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleSelectPack = (pack) => {
    setSelectedPack(pack);
    fetchRawPack(pack.name);
  };

  const handleSave = async () => {
    if (!selectedPack) return;
    setEditorLoading(true);
    setStatus({ type: '', message: '' });
    window.dispatchEvent(new Event('gpuSpike'));
    const id = selectedPack.name.toLowerCase().replaceAll(' ', '_');

    try {
      const res = await fetch(`/api/packs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: yamlContent })
      });
      const data = await res.json();

      if (data.status === 'success') {
        setStatus({ type: 'success', message: data.message });
        setOriginalContent(yamlContent);
        setVersionBumped(true);
        setTimeout(() => setVersionBumped(false), 2000);
        fetchPacks(); // refresh details
      } else if (data.status === 'quarantined' || data.status === 'error') {
        setStatus({ 
          type: data.status === 'quarantined' ? 'warning' : 'error', 
          message: data.message 
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error communicating with saving API.' });
    }
    setEditorLoading(false);
    window.dispatchEvent(new Event('gpuIdle'));
  };


  const handleReset = () => {
    setYamlContent(originalContent);
    setStatus({ type: '', message: '' });
  };

  // Generate line numbers helper
  const lineNumbers = (yamlContent || '').split('\n').map((_, index) => index + 1).join('\n');

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden animate-fadeIn">
      {/* Pack Selection Sidebar */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#30363d] bg-[#161b22]/50 flex flex-col max-h-[160px] lg:max-h-full shrink-0">
        <div className="p-4 lg:p-6 border-b border-[#30363d] hidden sm:block">
          <h2 className="text-md lg:text-lg font-bold text-white mb-1">Pack Studio</h2>
          <p className="text-[11px] text-[#8b949e]">Hot-reload rules & schemas instantly.</p>
        </div>
        <div className="flex-1 overflow-x-auto lg:overflow-y-auto p-4 flex lg:flex-col gap-3">
          {packs.map((p) => {
            const isSelected = selectedPack && selectedPack.name === p.name;
            return (
              <button
                key={p.name}
                onClick={() => handleSelectPack(p)}
                className={`text-left p-4 rounded-xl border transition-all shrink-0 min-w-[200px] lg:min-w-0 lg:w-full ${
                  isSelected
                    ? 'bg-[#1f6feb]/15 border-[#1f6feb] text-white shadow-lg shadow-[#1f6feb]/5'
                    : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm tracking-wide">{p.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-[#1f6feb] text-white font-semibold' : 'bg-[#21262d] text-[#8b949e]'
                  }`}>
                    v{p.version}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] line-clamp-2">{p.description}</p>
                {p.tools && (
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {p.tools.map(t => (
                      <span key={t} className="text-[9px] uppercase tracking-wider bg-[#30363d] text-[#c9d1d9] px-1.5 py-0.5 rounded font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Editor and Console Area */}
      {selectedPack ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="h-16 border-b border-[#30363d] bg-[#161b22] px-6 lg:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛠️</span>
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  Editing: <span className="text-[#58a6ff] truncate max-w-[120px] sm:max-w-none">{selectedPack.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#238636]/20 text-[#3fb950] border border-[#2ea043]/30 transition-all ${
                    versionBumped ? 'scale-110 rotate-3 bg-[#388bfd]/20 text-[#58a6ff] border-[#388bfd]/30' : ''
                  }`}>
                    v{selectedPack.version}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleReset}
                disabled={editorLoading || yamlContent === originalContent}
                className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-40"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={editorLoading || yamlContent === originalContent}
                className="bg-[#238636] hover:bg-[#2ea043] border border-[#238636]/30 text-white px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 disabled:opacity-40"
              >
                {editorLoading ? 'Validating...' : '🔥 Save'}
              </button>
            </div>
          </div>

          {/* Mobile sub-tabs for Editor vs Reference (Hidden on lg screens) */}
          <div className="flex lg:hidden border-b border-[#30363d] bg-[#161b22]/30 shrink-0">
            <button
              onClick={() => setActiveMobileTab('editor')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-r border-[#30363d] transition-all ${
                activeMobileTab === 'editor' ? 'bg-[#0d1117] text-[#58a6ff]' : 'text-[#8b949e]'
              }`}
            >
              📝 Code Editor
            </button>
            <button
              onClick={() => setActiveMobileTab('reference')}
              className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
                activeMobileTab === 'reference' ? 'bg-[#0d1117] text-[#58a6ff]' : 'text-[#8b949e]'
              }`}
            >
              📖 Reference & Logs
            </button>
          </div>

          {/* Main workspace (split screen) */}
          <div className="flex-1 flex overflow-hidden">
            {/* YAML Editor Panel */}
            <div className={`flex-1 flex bg-[#090d13] relative overflow-hidden ${activeMobileTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="w-10 select-none py-4 bg-[#0d1117] border-r border-[#30363d] text-[#30363d] font-mono text-[10px] text-right pr-2 overflow-hidden leading-6">
                <pre>{lineNumbers}</pre>
              </div>
              <textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                spellCheck="false"
                className="flex-1 p-4 bg-transparent text-[#e6edf3] font-mono text-xs sm:text-sm leading-6 focus:outline-none resize-none overflow-y-auto"
                style={{ tabSize: 2 }}
                placeholder="Write your pack declarative config in YAML..."
              />
              {editorLoading && (
                <div className="absolute inset-0 bg-[#0d1117]/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#58a6ff] animate-spin"></div>
                    <span className="text-sm text-[#8b949e] font-medium">Enforcing engine validation...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reference & System Status logs */}
            <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#30363d] bg-[#161b22]/30 flex flex-col overflow-y-auto ${activeMobileTab === 'reference' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="p-6 border-b border-[#30363d]">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Engine Feedback</h4>
                
                {status.message ? (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    status.type === 'success' ? 'bg-[#238636]/10 border-[#2ea043]/30 text-[#3fb950]' :
                    status.type === 'warning' ? 'bg-[#d29922]/10 border-[#d29922]/30 text-[#e3b341]' :
                    'bg-[#da3633]/10 border-[#f85149]/30 text-[#ff7b72]'
                  }`}>
                    <p className="font-bold mb-1 uppercase">
                      {status.type === 'success' ? '✓ Validation Passed' :
                       status.type === 'warning' ? '⚠️ Pack Quarantined' :
                       '❌ Validation Failed'}
                    </p>
                    <p>{status.message}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-center text-xs text-[#8b949e]">
                    Ready. Edit the file on the left and reload.
                  </div>
                )}
              </div>

              {/* Pack Specification Cheat Sheet */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Pack Schema Reference</h4>
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-mono text-[#79c0ff] font-semibold">name:</span>
                      <p className="text-[#8b949e] mt-1">Unique title of the capability pack (e.g. MyInvois Clerk).</p>
                    </div>
                    <div>
                      <span className="font-mono text-[#79c0ff] font-semibold">version:</span>
                      <p className="text-[#8b949e] mt-1">Semantic version. Incremented on successful reload.</p>
                    </div>
                    <div>
                      <span className="font-mono text-[#79c0ff] font-semibold">persona:</span>
                      <p className="text-[#8b949e] mt-1">Define voice and stance of the AI clerk to align tone.</p>
                    </div>
                    <div>
                      <span className="font-mono text-[#79c0ff] font-semibold">rules:</span>
                      <p className="text-[#8b949e] mt-1">List of deterministic constraints validation engine checks before final output.</p>
                    </div>
                    <div>
                      <span className="font-mono text-[#79c0ff] font-semibold">tools:</span>
                      <p className="text-[#8b949e] mt-1">Grants tools access. Options: <code className="bg-[#111] px-1 py-0.5 rounded text-[#ff7b72]">ocr</code>, <code className="bg-[#111] px-1 py-0.5 rounded text-[#ff7b72]">vision</code>, <code className="bg-[#111] px-1 py-0.5 rounded text-[#ff7b72]">media_pipeline</code>.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1f6feb]/5 border border-[#1f6feb]/20 text-xs">
                  <p className="text-white font-bold mb-1">⚡ Platform Constitution</p>
                  <p className="text-[#8b949e] leading-relaxed">
                    Packs may declare everything, and may execute nothing. No scripting or template injection is allowed, keeping SME data secure by design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
          <div className="text-center">
            <span className="text-4xl">🛠️</span>
            <h3 className="text-lg font-bold text-white mt-4">No pack registry available</h3>
            <p className="text-sm text-[#8b949e] mt-1">Please start the GuildHouse backend first.</p>
          </div>
        </div>
      )}
    </div>
  );
}
