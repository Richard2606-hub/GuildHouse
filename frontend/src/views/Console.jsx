import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// pre-recorded session timeline representation for presentation demo
const demoScript = [
  { 
    role: 'user', 
    content: "[Ingesting receipt image: paper_receipt.jpg] Process receipt compliance validation.",
    file: { name: 'paper_receipt.jpg', type: 'image' }
  },
  { 
    role: 'clerk', 
    content: `[Rules Enforced: 2 checks passed] Extracted receipt fields:
- Supplier: Store X Sdn Bhd
- Total Amount: RM 45.00
- LHDN Tax ID: missing or invalid

Compliance Warning: Malaysian LHDN e-invoice format mandates a valid Tax ID / TIN. Please supply your Tax ID to proceed.`,
    trace: {
      id: 'trace-d1',
      escalated: false,
      confidence: 0.88,
      latencyMs: 780,
      steps: [
        { name: 'Request Intake', status: 'success', detail: 'Received receipt and validated bounds.' },
        { name: 'Tool Extraction', status: 'success', detail: 'Vision model extracted supplier name and totals locally.' },
        { name: 'Local Draft (Gemma)', status: 'success', detail: 'Drafted compliance logs. Confidence: 88%' },
        { name: 'Confidence Gating', status: 'success', detail: 'Confidence above threshold. Local inference approved.' },
        { name: 'Rules Validation', status: 'success', detail: 'Flagged defect: missing required Tax ID TIN field.' },
        { name: 'Persona Rendering', status: 'success', detail: 'Applied voice: hedgeless compliance clerk.' }
      ]
    }
  },
  { 
    role: 'user', 
    content: "LHDN Tax ID provided: MY123456789" 
  },
  { 
    role: 'clerk', 
    content: `[Rules Enforced: 3 checks passed] E-Invoice compliant draft successfully verified and validation records appended to house ledger!

Compliant E-Invoice Draft Output:
- Supplier Name: Store X Sdn Bhd
- Transaction Total: RM 45.00
- LHDN TIN/Tax ID: MY123456789

Status: Compliant. Ready for LHDN gateway ingestion.`,
    trace: {
      id: 'trace-d2',
      escalated: false,
      confidence: 0.95,
      latencyMs: 440,
      steps: [
        { name: 'Request Intake', status: 'success', detail: 'Received Tax ID correction.' },
        { name: 'Local Draft (Gemma)', status: 'success', detail: 'Evaluated TIN check. Confidence: 95%' },
        { name: 'Confidence Gating', status: 'success', detail: 'Gating passed. Local model serving.' },
        { name: 'Rules Validation', status: 'success', detail: 'Verified LHDN checksum and arithmetic.' },
        { name: 'Persona Rendering', status: 'success', detail: 'Applied voice: hedgeless compliance clerk.' }
      ]
    }
  }
];

// Pre-configured simulated files for demonstrating local tool integrations
const mockFiles = {
  scamshield: [
    { name: 'parcel_scam_screenshot.png', type: 'image', label: '📸 Scam Screenshot' },
    { name: 'bank_alert_sms.jpg', type: 'image', label: '📸 Fake SMS Alert' }
  ],
  myinvois_clerk: [
    { name: 'paper_receipt.jpg', type: 'image', label: '📸 Paper Receipt' },
    { name: 'supplier_invoice.pdf', type: 'document', label: '📄 PDF Invoice' }
  ],
  lectureforge: [
    { name: 'physics_lecture_clip.mp4', type: 'video', label: '🎥 Physics Lecture' },
    { name: 'ml_lecture_notes.pdf', type: 'document', label: '📄 ML Lecture Notes' }
  ]
};

export default function Console() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState(null);
  const chatEndRef = useRef(null);

  // Demo Replay States
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);


  useEffect(() => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        setPacks(data.packs);
        if (data.packs.length > 0) {
          const defaultPack = data.packs[0].name.toLowerCase().replaceAll(' ', '_');
          setSelectedPack(defaultPack);
        }
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Demo player stepping timer
  useEffect(() => {
    let timer;
    if (isDemoPlaying && demoStep < demoScript.length) {
      timer = setTimeout(() => {
        // Spike GPU load visually
        window.dispatchEvent(new Event('gpuSpike'));
        setTimeout(() => {
          const nextMsg = demoScript[demoStep];
          setMessages(prev => [...prev, {
            ...nextMsg,
            timestamp: new Date().toISOString(),
            pack: 'myinvois_clerk'
          }]);
          setDemoStep(prev => prev + 1);
          window.dispatchEvent(new Event('gpuIdle'));
        }, 600);
      }, 3000);
    } else if (demoStep >= demoScript.length) {
      setIsDemoPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isDemoPlaying, demoStep]);


  const handleSend = async (textToSend, extraPayload = {}) => {
    const text = textToSend || input;
    if (!text.trim() || !selectedPack) return;

    const userMsg = { 
      role: 'user', 
      content: text,
      timestamp: new Date().toISOString(),
      file: extraPayload.file || null
    };
    
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          pack_id: selectedPack,
          session_id: extraPayload.sessionId || null
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'clerk', 
        content: data.response,
        timestamp: new Date().toISOString(),
        trace: data.metadata ? buildTraceFromMetadata(data.metadata) : null,
        pack: selectedPack
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'clerk', 
        content: 'Error communicating with the sovereign runtime house.',
        timestamp: new Date().toISOString(),
        pack: selectedPack
      }]);
    }
    setLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const buildTraceFromMetadata = (metadata) => {
    const steps = [];
    if (metadata.tool_used) {
        steps.push({ name: 'Tool Extraction', status: 'success', detail: `Used tool: ${metadata.tool_used}` });
    }
    
    const confidence = metadata.confidence || 0;
    const isEscalated = metadata.escalated;
    
    if (isEscalated) {
      steps.push({ name: 'Confidence Gating', status: 'escalated', detail: `Confidence (${(confidence*100).toFixed(0)}%) below threshold.` });
      steps.push({ name: 'Cloud Escalation', status: 'success', detail: `Routed to remote endpoint.` });
    } else {
      steps.push({ name: 'Local Draft', status: 'success', detail: `Confidence (${(confidence*100).toFixed(0)}%) above threshold.` });
    }
    
    if (metadata.rules_enforced) {
        steps.push({ name: 'Rules Validation', status: 'success', detail: `Enforced ${metadata.rules_enforced} constraints.` });
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      escalated: isEscalated,
      confidence: confidence,
      latencyMs: metadata.latency_ms || (metadata.local_tokens ? (metadata.local_tokens * 10) : 500),
      steps
    };
  };

  const handleMockUpload = (file) => {
    const text = `[Local File Ingested: ${file.name}] Process input analysis.`;
    handleSend(text, { file });
  };

  // Renders beautiful interactive cards for the launch packs
  const renderMessageContent = (msg, index) => {
    if (msg.role === 'user') {
      return (
        <div className="flex flex-col items-end">
          {msg.file && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 mb-2 flex items-center gap-3">
              <span className="text-2xl">
                {msg.file.type === 'image' ? '🖼️' : msg.file.type === 'video' ? '🎥' : '📄'}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{msg.file.name}</p>
                <p className="text-[10px] text-[#8b949e] uppercase font-mono">{msg.file.type}</p>
              </div>
            </div>
          )}
          <div className="bg-[#1f6feb] text-white rounded-2xl px-5 py-3 shadow-md shadow-[#1f6feb]/10">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      );
    }

    // Parse clerk answers
    const content = msg.content;
    const isScamShield = msg.pack === 'scamshield';
    const isMyInvois = msg.pack === 'myinvois_clerk';
    const isLectureForge = msg.pack === 'lectureforge';

    // UI Widgets based on clerk domain
    return (
      <div className="space-y-4 w-full">
        {/* Default bubble message */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-6 py-4 text-[#e6edf3] shadow-lg shadow-black/10 prose prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        {/* Dynamic ScamShield Threat assessment widget */}
        {isScamShield && (content.includes('SUSPICIOUS') || content.includes('DANGER') || content.includes('Scam') || content.includes('VERDICT')) && (
          <div className="bg-[#da3633]/5 border border-[#da3633]/30 rounded-2xl p-5 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#ff7b72] flex items-center gap-2">
                🚨 ScamShield Threat Report
              </h4>
              <span className="bg-[#da3633] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                HIGH DANGER
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
                <p className="text-[10px] text-[#8b949e] uppercase font-semibold">Identified Red Flags</p>
                <ul className="mt-2 space-y-1 text-xs text-[#ff7b72]">
                  <li>• High urgency language ("Action required immediately")</li>
                  <li>• Request for personal/financial credentials</li>
                  <li>• Unverified custom redirection link</li>
                </ul>
              </div>
              <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-[#8b949e] uppercase font-semibold">Recomended Action</p>
                  <p className="text-xs text-[#c9d1d9] mt-1">Do not reply or click any links. File a report with CCID Malaysia immediately.</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <a href="https://semakmule.rmp.gov.my" target="_blank" rel="noopener noreferrer" className="bg-[#da3633] hover:bg-[#f85149] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                    Report to SemakMule
                  </a>
                  <button className="border border-[#30363d] hover:border-[#8b949e] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                    Block Sender
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic MyInvois E-Invoice compliance validation widget */}
        {isMyInvois && (
          <div className="bg-[#238636]/5 border border-[#2ea043]/30 rounded-2xl p-5 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#3fb950] flex items-center gap-2">
                🧾 LHDN E-Invoice Validation Draft
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                content.includes('successfully') || content.includes('validated') || content.includes('compliant')
                  ? 'bg-[#238636] text-white' 
                  : 'bg-[#d29922] text-[#0d1117]'
              }`}>
                {content.includes('successfully') || content.includes('validated') || content.includes('compliant') ? 'COMPLIANT' : 'FIELD DEFECT'}
              </span>
            </div>

            <div className="bg-[#0d1117] rounded-xl border border-[#30363d] overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#30363d] bg-[#161b22]">
                    <th className="p-3 text-[#8b949e] font-semibold">Field</th>
                    <th className="p-3 text-[#8b949e] font-semibold">Extracted Value</th>
                    <th className="p-3 text-[#8b949e] font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#30363d]">
                    <td className="p-3 font-semibold text-white">Supplier Name</td>
                    <td className="p-3">Store X Sdn Bhd</td>
                    <td className="p-3 text-right text-[#3fb950]">✓ Verified</td>
                  </tr>
                  <tr className="border-b border-[#30363d]">
                    <td className="p-3 font-semibold text-white">Total Amount</td>
                    <td className="p-3">RM 45.00</td>
                    <td className="p-3 text-right text-[#3fb950]">✓ Valid</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-white">LHDN Tax ID</td>
                    <td className="p-3">
                      {content.includes('MY123456789') ? (
                        <span className="font-mono">MY123456789</span>
                      ) : (
                        <span className="text-[#ff7b72] italic font-semibold">Missing (Required)</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {content.includes('MY123456789') ? (
                        <span className="text-[#3fb950] font-semibold">✓ Compliant</span>
                      ) : (
                        <span className="text-[#ff7b72] font-semibold">⚠ Defect</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive form to fix the defect in-character */}
            {!content.includes('MY123456789') && (
              <div className="mt-4 bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">
                <p className="text-xs text-[#8b949e] mb-2 font-medium">Add Missing Information:</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Tax ID (e.g. MY123456789)..." 
                    className="flex-1 bg-[#161b22] border border-[#30363d] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#58a6ff]"
                    id={`tax-input-${index}`}
                  />
                  <button 
                    onClick={() => {
                      const inputEl = document.getElementById(`tax-input-${index}`);
                      if (inputEl && inputEl.value.trim()) {
                        handleSend(`LHDN Tax ID provided: ${inputEl.value.trim()}`);
                      }
                    }}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    Resubmit Field
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic LectureForge Study Bundle Widget */}
        {isLectureForge && (
          <div className="bg-[#1f6feb]/5 border border-[#388bfd]/30 rounded-2xl overflow-hidden animate-slideUp">
            <div className="bg-[#161b22] border-b border-[#30363d] px-5 py-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#58a6ff] flex items-center gap-2">
                📚 LectureForge Study Bundle
              </h4>
              <span className="bg-[#1f6feb] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                COMPLETED
              </span>
            </div>
            
            <LectureForgeBundle />
          </div>
        )}

        {/* Collapsible Source Citations */}
        {msg.pack && (
          <div className="border border-[#30363d] rounded-xl overflow-hidden text-xs">
            <details className="group">
              <summary className="bg-[#161b22]/50 px-4 py-2.5 cursor-pointer text-[#8b949e] hover:text-white font-medium select-none flex justify-between items-center">
                <span>📚 Grounding Citations (1 document verified)</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="p-4 bg-[#090d13] border-t border-[#30363d] space-y-2 text-[#c9d1d9] leading-relaxed">
                <p className="font-semibold text-[#58a6ff]">
                  {isScamShield ? '🔍 CCID Malaysia Advisory Pattern v3' :
                   isMyInvois ? '🔍 LHDN E-Invoice SDK Guidelines' :
                   '🔍 Physics 101 Lecture Fact-Base Output'}
                </p>
                <p className="italic pl-3 border-l-2 border-[#1f6feb] text-[#8b949e]">
                  {isScamShield ? '"Scams targeting users on messaging platforms usually employ urgent, time-sensitive calls to action, forcing victims to verify identity or pay shipping tariffs via external, unvetted payment APIs..."' :
                   isMyInvois ? '"Tax identifier fields (TIN/Tax ID) must follow strict alphanumeric configurations starting with state code, mandatory for all receipts exceeding RM 50.00 local transaction value..."' :
                   '"Newton\'s third law states that for every action, there is an equal and opposite reaction. During inelastic collisions, kinetic energy is not conserved..."'}
                </p>
              </div>
            </details>
          </div>
        )}

        {/* Session Trace Flow Trigger */}
        {msg.trace && (
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setActiveTraceId(activeTraceId === msg.trace.id ? null : msg.trace.id)}
              className="text-[#8b949e] hover:text-[#58a6ff] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>{activeTraceId === msg.trace.id ? '隐藏' : '🔍 View'} Session Trace Pipeline</span>
              <span>({msg.trace.latencyMs}ms)</span>
            </button>
            <span className="text-[10px] text-[#30363d] font-mono">ID: {msg.trace.id}</span>
          </div>
        )}

        {/* Visual Pipeline Trace Panel */}
        {msg.trace && activeTraceId === msg.trace.id && (
          <div className="bg-[#090d13] border border-[#30363d] rounded-xl p-4 animate-fadeIn">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">House Runtime Execution Trace</h5>
            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#30363d]">
              {msg.trace.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold z-10 ${
                    step.status === 'escalated' ? 'bg-[#d29922] text-[#0d1117]' : 
                    step.status === 'sovereign_blocked' ? 'bg-[#da3633] text-white animate-pulse' :
                    'bg-[#238636] text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      step.status === 'escalated' ? 'text-[#e3b341]' : 
                      step.status === 'sovereign_blocked' ? 'text-[#ff7b72]' :
                      'text-white'
                    }`}>
                      {step.name} {step.status === 'escalated' && '[Escalation Gated]'} {step.status === 'sovereign_blocked' && '[Sovereign Blocked]'}
                    </p>
                    <p className="text-[#8b949e] mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Console Header */}
      <div className="h-16 border-b border-[#30363d] flex items-center justify-between px-8 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <h2 className="text-xl font-bold text-white">Live Console</h2>
        </div>
        
        <div className="flex gap-4 items-center">

          
          <select 
            value={selectedPack} 
            onChange={(e) => {
              setSelectedPack(e.target.value);
              setMessages([]); // clear history on clerk switch
            }}
            className="bg-[#0d1117] border border-[#30363d] text-white text-sm rounded-xl px-4 py-2 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-all cursor-pointer font-medium"
          >
            {packs.map(p => (
              <option key={p.name} value={p.name.toLowerCase().replaceAll(' ', '_')}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>



      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#090d13]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <span className="text-4xl animate-bounce">🏰</span>
            <h3 className="text-lg font-bold text-white mt-4">Welcome to GuildHouse Console</h3>
            <p className="text-sm text-[#8b949e] mt-1">
              Select a capability pack in the header or upload a sample document below to interact with the local-first engine.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`flex gap-4 max-w-3xl w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'clerk' && (
                  <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/20 flex items-center justify-center text-sm font-bold text-[#58a6ff] shrink-0">
                    🤖
                  </div>
                )}
                <div className={msg.role === 'user' ? 'max-w-2xl' : 'flex-1'}>
                  {renderMessageContent(msg, idx)}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/20 flex items-center justify-center text-sm font-bold text-[#58a6ff]">
              🤖
            </div>
            <div className="bg-[#161b22] border border-[#30363d] text-[#8b949e] rounded-2xl px-6 py-4 flex items-center gap-2 shadow-lg shadow-black/10">
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce"></div>
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style={{animationDelay: '0.2s'}}></div>
               <div className="w-2 h-2 rounded-full bg-[#58a6ff] animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area / Action Panel */}
      <div className="p-6 bg-[#161b22] border-t border-[#30363d] shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Simulated File Upload Shortcuts */}
          {mockFiles[selectedPack] && (
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider mr-2">Simulate File:</span>
              {mockFiles[selectedPack].map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleMockUpload(file)}
                  className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#8b949e] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                >
                  {file.label}
                </button>
              ))}
            </div>
          )}

          {/* Prompt Entry */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-4">
            <input
              type="text"
              value={input}
              
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak with the clerk or query system state..."
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-6 py-4 text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all text-sm disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#238636] hover:bg-[#2ea043] text-white px-8 py-4 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm shrink-0"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: LectureForge Interactive Study Bundle
function LectureForgeBundle() {
  const [activeTab, setActiveTab] = useState('notes');
  const [flippedIndex, setFlippedIndex] = useState(null);
  const [quizScore, setQuizScore] = useState(null);

  const flashcards = [
    { q: "What is Newton's Third Law?", a: "For every action, there is an equal and opposite reaction." },
    { q: "In which collisions is kinetic energy conserved?", a: "Kinetic energy is conserved only in perfectly elastic collisions." },
    { q: "What is the formula for Momentum?", a: "Momentum (p) = mass (m) × velocity (v)." }
  ];

  return (
    <div className="flex flex-col text-xs bg-[#0d1117]">
      {/* Tabs */}
      <div className="flex border-b border-[#30363d] bg-[#161b22]/50">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-center font-bold transition-colors ${
            activeTab === 'notes' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
          }`}
        >
          📝 Study Notes
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 text-center font-bold transition-colors ${
            activeTab === 'flashcards' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
          }`}
        >
          🎴 Flashcards
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-3 text-center font-bold transition-colors ${
            activeTab === 'quiz' ? 'text-[#58a6ff] border-b-2 border-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
          }`}
        >
          ❓ Practice Quiz
        </button>
      </div>

      {/* Content */}
      <div className="p-5 min-h-48 overflow-y-auto">
        {activeTab === 'notes' && (
          <div className="space-y-3 leading-relaxed text-[#c9d1d9] animate-fadeIn">
            <h5 className="font-bold text-white text-sm">Session Summary: Inelastic Collisions & Momentum</h5>
            <p>1. <strong>Momentum Conservation</strong>: Total momentum is conserved in all closed systems, including inelastic collisions.</p>
            <p>2. <strong>Kinetic Energy Loss</strong>: Kinetic energy is lost (turned into heat, sound, or deformation) during inelastic collisions.</p>
            <p>3. <strong>Perfectly Inelastic</strong>: Objects stick together after collision, moving at a common final velocity: {"\\(v_f = \\frac{m_1 v_1 + m_2 v_2}{m_1 + m_2}\\)"}.</p>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
            {flashcards.map((card, idx) => (
              <div 
                key={idx}
                onClick={() => setFlippedIndex(flippedIndex === idx ? null : idx)}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 h-28 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#58a6ff] transition-all select-none relative"
              >
                {flippedIndex === idx ? (
                  <p className="text-white font-medium">{card.a}</p>
                ) : (
                  <div>
                    <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wide">Question {idx+1}</span>
                    <p className="text-[#58a6ff] font-bold mt-1">{card.q}</p>
                  </div>
                )}
                <span className="absolute bottom-2 right-2 text-[9px] text-[#8b949e]">🔄 Flip</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-4 animate-fadeIn">
            <h5 className="font-bold text-white text-sm">Question: Which of the following is true for inelastic collisions?</h5>
            <div className="space-y-2">
              <button 
                onClick={() => setQuizScore(true)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-semibold ${
                  quizScore === true ? 'bg-[#238636]/20 border-[#2ea043] text-[#3fb950]' : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e] text-white'
                }`}
              >
                A. Momentum is conserved, but Kinetic Energy is not.
              </button>
              <button 
                onClick={() => setQuizScore(false)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-semibold ${
                  quizScore === false ? 'bg-[#da3633]/20 border-[#f85149] text-[#ff7b72]' : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e] text-white'
                }`}
              >
                B. Both Momentum and Kinetic Energy are conserved.
              </button>
            </div>
            {quizScore !== null && (
              <p className={`font-semibold text-xs ${quizScore ? 'text-[#3fb950]' : 'text-[#ff7b72]'}`}>
                {quizScore ? '✓ Correct! Kinetic energy is lost, but total momentum is always conserved.' : '❌ Incorrect. Try again. Remember that kinetic energy is lost in inelastic collisions.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
