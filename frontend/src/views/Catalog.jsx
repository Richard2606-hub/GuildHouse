import React, { useState, useEffect } from 'react';

export default function Catalog() {
  const [packs, setPacks] = useState([]);
  const [activeTab, setActiveTab] = useState('installed');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wizard Modal States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formVer, setFormVer] = useState('1.0.0');
  const [formDesc, setFormDesc] = useState('');
  const [formLangs, setFormLangs] = useState(['en']);
  const [formVoice, setFormVoice] = useState('');
  const [formStance, setFormStance] = useState('');
  const [formRules, setFormRules] = useState(['']);
  const [formTools, setFormTools] = useState([]);

  // Corpus Browser States
  const [activeCorpusPack, setActiveCorpusPack] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const mockCorpora = {
    scamshield: [
      { 
        name: "CCID_Malay_Scam_Typologies.pdf", 
        type: "PDF Document",
        content: `CCID Malaysia Official Advisory List (2026).
- Section 1: Parcel Shipping Customs Duty Scams. Typical patterns involve messages claiming a package is withheld by customs until a custom tax tariff is paid.
- Section 2: Phishing Links. SMS alerts containing unverified links demanding confirmation of credentials or banking details.
- Section 3: SemakMule list. Database of mule accounts flagged by the Royal Malaysia Police (PDRM).` 
      },
      { 
        name: "Redacted_Incident_Reports.txt", 
        type: "Text Advisory",
        content: `Sanitized transcript logs of reported text messaging scams:
"Sender: PDRM-ALERT. Message: Your ID has been flagged for money laundering activity. Please verify your details at: http://unverified-pdrm-check.xyz" -> VERDICT: MALICIOUS PHISHING SCAN.` 
      }
    ],
    myinvois_clerk: [
      { 
        name: "LHDN_Field_Specs_v2.pdf", 
        type: "PDF Manual",
        content: `LHDN E-Invoice SDK Guidelines v2.
Section 3.2: Taxpayer Identification Number (TIN).
- Standard formats starting with state code or entity code are mandatory for all transactions.
- Mandatory fields for invoice validation: Supplier Name, Buyer Name, Item Total Amount, Tax ID (TIN), state code. Exemptions must carry proper code-checks.` 
      },
      { 
        name: "Corporate_Bill_Template.txt", 
        type: "Text Layout",
        content: `Boundary mapping template coordinates:
- Header: [0, 0, 800, 100]
- Total: [500, 750, 780, 790]
- Tax ID TIN: [200, 640, 480, 660] (If null, flag validation warning)` 
      }
    ],
    lectureforge: [
      { 
        name: "Inelastic_Collisions_Script.txt", 
        type: "Text Transcription",
        content: `Dr. Salim, Physics 101 Lecture.
"Momentum is defined as mass times velocity: p = mv. Momentum is conserved in all closed systems. However, in inelastic collisions, kinetic energy is NOT conserved—some is transformed into heat and mechanical deformation. If they stick together, they move at a common final velocity."` 
      },
      { 
        name: "Pedagogic_Outlines.docx", 
        type: "Word Document",
        content: `Study Bundle Generation Rubrics:
- Summary notes must be structured with headers.
- Math equations must render using LaTeX formats for clean web formatting.
- Practice quizzes must contain a single correct option and display clear feedback.` 
      }
    ]
  };

  const fetchPacks = () => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => setPacks(data.packs));
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleBrowseCorpus = (pack) => {
    const key = pack.name.toLowerCase().replaceAll(' ', '_');
    const files = mockCorpora[key] || [
      { 
        name: "default_corpus_guide.txt", 
        type: "Text Document",
        content: `No custom files uploaded yet. This pack uses the default Gemma 2 base weights. Upload documents in Pack Studio to ground your local clerk.` 
      }
    ];
    setActiveCorpusPack({ name: pack.name, files });
    setSelectedFile(files[0]);
  };

  // Pre-configured specified catalog cards from Appendix F
  const libraryPacks = [
    {
      name: "ZK Circuit Auditor",
      buyer: "Protocol Teams & Audit Firms",
      pain: "Under-constrained circuit bugs cost protocols millions and auditors are scarce.",
      composition: "bug-taxonomy corpus, auditor persona, findings schema, code-ingestion tool grant.",
      estimate: "4-5 days"
    },
    {
      name: "ROCm Migration Assistant",
      buyer: "HPC & ML Engineering Teams",
      pain: "CUDA lock-in blocks AMD hardware adoption due to library porting friction.",
      composition: "porting-guide corpus, engineer persona, migration-report schema, repository analysis tool.",
      estimate: "4 days"
    },
    {
      name: "Chain-to-Human Explainer",
      buyer: "Crypto Holders & Accountants",
      pain: "Transaction histories are unreadable to the taxpayers and compliance officers.",
      composition: "protocol-pattern corpus, narrator persona, dated-report schema, read-only chain connector.",
      estimate: "3 days"
    },
    {
      name: "Fine-Tune Concierge",
      buyer: "Developer Teams with Domain Data",
      pain: "Model fine-tuning on AMD is highly performant but under-documented.",
      composition: "recipe corpus, mentor persona, job-card schema, pairs with engine adapter hosting.",
      estimate: "3 days"
    },
    {
      name: "Manglish Support Clerk",
      buyer: "SEA Small/Medium Enterprises",
      pain: "Code-switched Malaysian customer support defeats English-first cloud chatbots.",
      composition: "business own document corpus, code-switching persona variants, escalation rules.",
      estimate: "2-3 days"
    },
    {
      name: "PDPA Compliance Auditor",
      buyer: "Malaysian SMEs & Agencies",
      pain: "Small organisations cannot afford expensive counsel for data-protection reviews.",
      composition: "PDPA-obligation corpus, auditor persona, findings-and-remediation schema.",
      estimate: "3 days"
    },
    {
      name: "AgriVision Crop Doctor",
      buyer: "Cooperatives & Agritech Distributors",
      pain: "Smallholders lack timely crop disease identification and agronomy advise.",
      composition: "disease-pattern corpus, extension-officer persona, local vision tool grant.",
      estimate: "3-4 days"
    },
    {
      name: "Factory SOP Copilot",
      buyer: "Manufacturers & Plant Managers",
      pain: "Standard operating procedures live in dusty binders and tribal memory.",
      composition: "plant SOP corpus, supervisor persona, step-citation rules, strict external refusals.",
      estimate: "2 days"
    },
    {
      name: "Hackathon Judge Copilot",
      buyer: "Event Platforms & Organisers",
      pain: "Hackathon organisers triage and score hundreds of projects by hand.",
      composition: "rubric corpus, reviewer persona, scored-report schema, repo ingestion tool grant.",
      estimate: "3 days"
    },
    {
      name: "Edge Retail Shelf Clerk",
      buyer: "Retailers & Vending Operators",
      pain: "Manual stocktaking wastes hours and cloud-based vision runs up high bills.",
      composition: "planogram corpus, operations persona, inventory-state schema, vision tool grant.",
      estimate: "4-5 days"
    },
    {
      name: "Cross-Border Listing Clerk",
      buyer: "Marketplace Sellers",
      pain: "Restricted-item rules, tariffs, and multilingual translation overwhelm merchants.",
      composition: "per-country compliance corpus, merchant-advisor persona, listing schema.",
      estimate: "4 days"
    },
    {
      name: "IIoT Alarm-Storm Doctor",
      buyer: "Plant & Network Operators",
      pain: "Cascade alert storms bury true root causes during physical operations.",
      composition: "equipment-topology corpus, reliability-engineer persona, dispatch schema.",
      estimate: "4-5 days"
    },
    {
      name: "Meeting Multiplexer",
      buyer: "Distributed Corporate Teams",
      pain: "One meeting has many stakeholders, leading to hand-written customized summary friction.",
      composition: "terminology corpus, per-stakeholder persona set, minutes & actions schemas.",
      estimate: "2-3 days"
    },
    {
      name: "Tenancy & Contract Explainer",
      buyer: "Renters, Agents, & Landlords",
      pain: "Standard Malaysian agreements are signed unread, leading to contract disputes.",
      composition: "clause-pattern corpus, plain-language persona, clause-flag schema, firm not-legal-advice rules.",
      estimate: "3 days"
    },
    {
      name: "Clinic Front-Desk Clerk",
      buyer: "Clinics & Small Practices",
      pain: "Appointment triage and patient messages overwhelm small practices; patient records cannot leave.",
      composition: "clinic services corpus, receptionist persona, strict local sensitivity, booking schema.",
      estimate: "3 days"
    },
    {
      name: "Grant & Tender Writer's Aide",
      buyer: "SMEs & Non-Governmental Organisations",
      pain: "SMEs forfeit funding for want of proposal-writing capacity and compliance knowledge.",
      composition: "scheme-requirement corpus, bid-writer persona, compliance-matrix schema, fact-lock.",
      estimate: "3-4 days"
    }
  ];

  // Search filter
  const filterPacks = (list) => {
    return list.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.pain && item.pain.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const currentList = activeTab === 'installed' ? filterPacks(packs) : filterPacks(libraryPacks);

  // Form Handlers
  const handleAddRule = () => setFormRules([...formRules, '']);
  const handleRuleChange = (idx, val) => {
    const updated = [...formRules];
    updated[idx] = val;
    setFormRules(updated);
  };
  const handleRemoveRule = (idx) => setFormRules(formRules.filter((_, i) => i !== idx));

  const handleLangToggle = (lang) => {
    if (formLangs.includes(lang)) {
      setFormLangs(formLangs.filter(l => l !== lang));
    } else {
      setFormLangs([...formLangs, lang]);
    }
  };

  const handleToolToggle = (tool) => {
    if (formTools.includes(tool)) {
      setFormTools(formTools.filter(t => t !== tool));
    } else {
      setFormTools([...formTools, tool]);
    }
  };

  const handleWizardSubmit = async () => {
    if (!formName.trim() || !formDesc.trim() || !formVoice.trim() || !formStance.trim()) {
      setWizardError('Please complete all required fields.');
      return;
    }

    setWizardLoading(true);
    setWizardError('');
    setWizardSuccess('');

    // Generate valid YAML
    const cleanRules = formRules.filter(r => r.trim() !== '');
    const yamlString = `name: ${formName.trim()}
version: "${formVer.trim() || '1.0.0'}"
description: ${formDesc.trim()}
languages: ${JSON.stringify(formLangs)}
escalation_policy:
  forbidden: []
  redact_first: []
persona:
  voice: "${formVoice.trim()}"
  stance: "${formStance.trim()}"
rules:
${cleanRules.map(r => `  - "${r.trim()}"`).join('\n')}
tools: ${JSON.stringify(formTools)}
`;

    try {
      const id = formName.toLowerCase().replace(/ /g, '_');
      const res = await fetch(`/api/packs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: yamlString })
      });
      const data = await res.json();

      if (data.status === 'success') {
        setWizardSuccess('Pack successfully compiled & hot-reloaded into local engine!');
        fetchPacks();
        setTimeout(() => {
          setShowWizard(false);
          setWizardSuccess('');
          // Reset Form
          setFormName('');
          setFormVer('1.0.0');
          setFormDesc('');
          setFormLangs(['en']);
          setFormVoice('');
          setFormStance('');
          setFormRules(['']);
          setFormTools([]);
        }, 1500);
      } else {
        setWizardError(data.message || 'Validation failed. Check your input values.');
      }
    } catch (err) {
      console.error(err);
      setWizardError('Error communicating with deployment endpoint.');
    }
    setWizardLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-[#30363d] bg-[#161b22] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Capability Catalog</h1>
            <p className="text-xs text-[#8b949e]">Declarative domain packs ready for sovereign deployment.</p>
          </div>
          
          <div className="flex gap-3 sm:gap-4 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packs..."
              className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#58a6ff] flex-1 min-w-0 lg:flex-none lg:w-64"
            />
            <button
              onClick={() => setShowWizard(true)}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              ➕ Create Custom Pack
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-8 py-3 text-sm font-semibold transition-all border-r border-[#30363d] ${
            activeTab === 'installed' ? 'bg-[#0d1117] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
          }`}
        >
          🟢 Installed Live ({packs.length})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-8 py-3 text-sm font-semibold transition-all border-r border-[#30363d] ${
            activeTab === 'library' ? 'bg-[#0d1117] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white'
          }`}
        >
          📦 Catalog Registry ({libraryPacks.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#090d13]">
        <div className="max-w-7xl mx-auto">
          {currentList.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-3xl">📭</span>
              <h3 className="text-md font-bold text-white mt-4">No matching packs found</h3>
              <p className="text-xs text-[#8b949e] mt-1">Try tweaking your search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {activeTab === 'installed' ? (
                // Render Installed Live packs
                currentList.map((pack, idx) => (
                  <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 hover:border-[#58a6ff] transition-all flex flex-col justify-between shadow-lg shadow-black/5 hover:-translate-y-0.5 duration-200">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white tracking-wide">{pack.name}</h3>
                        <span className="bg-[#238636]/15 text-[#3fb950] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[#2ea043]/30">
                          v{pack.version}
                        </span>
                      </div>
                      <p className="text-[#8b949e] text-xs mb-6 leading-relaxed">{pack.description}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1 font-semibold">Persona Voice</p>
                          <p className="text-xs text-[#c9d1d9] italic pl-2 border-l border-[#30363d]">{pack.persona?.voice || 'Standard'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1.5 font-semibold">Enforced Rules</p>
                          <ul className="text-xs text-[#c9d1d9] space-y-1">
                            {pack.rules?.map((rule, rIdx) => (
                              <li key={rIdx} className="line-clamp-1">• {rule}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#30363d] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {pack.languages?.map(lang => (
                            <span key={lang} className="bg-[#1f6feb]/15 text-[#58a6ff] px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
                              {lang}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-[#3fb950] font-bold uppercase tracking-wider flex items-center gap-1">
                          ● Active Status
                        </span>
                      </div>
                      <button
                        onClick={() => handleBrowseCorpus(pack)}
                        className="w-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all"
                      >
                        📂 Browse Knowledge Corpus
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Render Library Catalog Cards
                currentList.map((card, idx) => (
                  <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 hover:border-[#8b949e] transition-all flex flex-col justify-between shadow-lg shadow-black/5 hover:-translate-y-0.5 duration-200">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white tracking-wide">{card.name}</h3>
                        <span className="bg-[#1f6feb]/15 text-[#58a6ff] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {card.estimate}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1 font-semibold">Target Buyer</p>
                          <p className="text-xs text-[#c9d1d9]">{card.buyer}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8b949e] uppercase tracking-wider mb-1 font-semibold">User Pain Point</p>
                          <p className="text-xs text-[#8b949e] leading-relaxed">{card.pain}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#ff7b72] uppercase tracking-wider mb-1 font-semibold">Composition</p>
                          <p className="text-xs text-[#c9d1d9] leading-relaxed italic">{card.composition}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#30363d] flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e] font-bold uppercase tracking-wider">
                        Registry catalog
                      </span>
                      <button
                        onClick={() => {
                          setFormName(card.name);
                          setFormDesc(card.pain);
                          setFormVoice("Objective, technical, domain-correct assistant.");
                          setFormStance("Cautious compliance checker.");
                          setFormRules(["Must enforce local regulations", "Refuse unsafe remote execution requests"]);
                          setWizardStep(1);
                          setShowWizard(true);
                        }}
                        className="bg-[#1f6feb]/15 hover:bg-[#1f6feb]/25 border border-[#1f6feb]/30 text-[#58a6ff] hover:text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        ⚡ Instantiate Pack
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* LIVE KNOWLEDGE CORPUS BROWSER MODAL */}
      {activeCorpusPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#161b22] border-2 border-[#58a6ff]/40 rounded-2xl w-full max-w-4xl h-[90vh] md:h-[500px] shadow-2xl flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Files List Panel */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#30363d] flex flex-col bg-[#0d1117] shrink-0">
              <div className="p-4 border-b border-[#30363d] bg-[#161b22]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">📚 Knowledge Corpus</h4>
                <p className="text-[10px] text-[#8b949e] mt-0.5">Pack: {activeCorpusPack.name}</p>
              </div>
              <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-1 max-h-[120px] md:max-h-full">
                {activeCorpusPack.files.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`text-left p-3 rounded-lg text-xs transition-all flex flex-col gap-1 min-w-[200px] md:min-w-0 shrink-0 ${
                      selectedFile?.name === file.name 
                        ? 'bg-[#1f6feb]/15 border border-[#1f6feb]/30 text-[#58a6ff]' 
                        : 'hover:bg-[#161b22] border border-transparent text-[#8b949e] hover:text-white'
                    }`}
                  >
                    <span className="font-bold truncate">{file.name}</span>
                    <span className="text-[9px] uppercase font-mono tracking-wider opacity-85">{file.type}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-[#30363d] bg-[#161b22]/30 hidden md:block">
                <button
                  onClick={() => setActiveCorpusPack(null)}
                  className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Close Browser
                </button>
              </div>
            </div>

            {/* Right File Content Panel */}
            <div className="flex-1 flex flex-col bg-[#0d1117]/30 overflow-hidden">
              {selectedFile ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-[#30363d] bg-[#161b22] flex justify-between items-center shrink-0">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono truncate max-w-[200px] md:max-w-none">{selectedFile.name}</h4>
                      <p className="text-[9px] text-[#8b949e] uppercase font-bold tracking-wider mt-0.5">Vectored Chunk Data</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="hidden sm:inline bg-[#238636]/15 text-[#3fb950] border border-[#2ea043]/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                        Grounding OK
                      </span>
                      <button 
                        onClick={() => setActiveCorpusPack(null)} 
                        className="md:hidden text-xs text-[#ff7b72] border border-[#ff7b72]/30 px-3 py-1 rounded-xl bg-[#da3633]/15 font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">
                    {selectedFile.content}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <span className="text-3xl">📂</span>
                  <p className="text-xs text-[#8b949e] mt-2">Select a document block from the index list to browse grounding details.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE CUSTOM PACK STEP WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#30363d] bg-[#0d1117] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Create Domain Capability Pack</h3>
                <p className="text-xs text-[#8b949e]">Step {wizardStep} of 3 — Compose declarative YAML</p>
              </div>
              <button 
                onClick={() => {
                  setShowWizard(false);
                  setWizardError('');
                  setWizardSuccess('');
                }}
                className="text-[#8b949e] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {wizardError && (
                <div className="p-4 rounded-xl border border-[#da3633] bg-[#da3633]/10 text-xs text-[#ff7b72] font-semibold">
                  ⚠ {wizardError}
                </div>
              )}

              {wizardSuccess && (
                <div className="p-4 rounded-xl border border-[#238636] bg-[#238636]/10 text-xs text-[#3fb950] font-semibold animate-pulse">
                  ✓ {wizardSuccess}
                </div>
              )}

              {/* STEP 1: Metadata */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Pack Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Tax Audit Assistant" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Version</label>
                      <input 
                        type="text" 
                        placeholder="1.0.0" 
                        value={formVer}
                        onChange={(e) => setFormVer(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8b949e] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Languages</label>
                      <div className="flex gap-2">
                        {['en', 'ms', 'zh'].map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleLangToggle(lang)}
                            className={`flex-1 py-3 text-xs font-mono font-bold uppercase rounded-xl border ${
                              formLangs.includes(lang) 
                                ? 'bg-[#1f6feb]/15 border-[#58a6ff] text-[#58a6ff]' 
                                : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Description / Pain Point *</label>
                    <textarea 
                      rows="3"
                      placeholder="What regulatory or business issue does this AI clerk solve?"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Persona Tone */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Voice Tone Guideline *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cautious, objective compliance checker, plain language." 
                      value={formVoice}
                      onChange={(e) => setFormVoice(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-2">Behavioral Stance *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Always hedge if calculations exceed RM 100, local-first validator." 
                      value={formStance}
                      onChange={(e) => setFormStance(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Rules & Tools */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">Compliance Rules Checklist</label>
                      <button 
                        type="button" 
                        onClick={handleAddRule}
                        className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
                      >
                        ＋ Add Rule
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formRules.map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. Never give legal or financial advice." 
                            value={rule}
                            onChange={(e) => handleRuleChange(idx, e.target.value)}
                            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2 text-xs text-white placeholder-[#8b949e] focus:outline-none"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRule(idx)}
                            className="text-[#ff7b72] hover:text-[#da3633] px-2 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-3">Tool Ingestion Grants</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['ocr_scanner', 'vision_verifier', 'media_indexer'].map(tool => (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => handleToolToggle(tool)}
                          className={`py-3 text-[10px] font-bold uppercase rounded-xl border transition-all ${
                            formTools.includes(tool)
                              ? 'bg-[#1f6feb]/15 border-[#58a6ff] text-[#58a6ff]'
                              : 'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
                          }`}
                        >
                          {tool.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#30363d] bg-[#0d1117]/80 flex justify-between items-center shrink-0">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(wizardStep - 1)}
                className="bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-30"
              >
                ◀ Back
              </button>

              <div>
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep + 1)}
                    className="bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all"
                  >
                    Next Step ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={wizardLoading}
                    onClick={handleWizardSubmit}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold px-6 py-2 rounded-xl transition-all"
                  >
                    {wizardLoading ? 'Deploying...' : 'Build & Deploy 🚀'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
