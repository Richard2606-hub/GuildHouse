# 🏰 GuildHouse

> **Sovereign AI Clerk Appliance** — A privacy-first, multi-tenant AI runtime that deploys specialized "clerk" agents from hot-swappable YAML packs.

GuildHouse is an edge-deployable AI platform designed for organizations that need domain-specific AI assistants with strict compliance boundaries, data-sovereignty guarantees, and real-time auditability. Built on top of **Fireworks AI** (with AMD ROCm GPU support), it routes queries through a two-tier confidence pipeline — cheap models handle routine traffic; expensive models are only invoked when confidence is low.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Pack System** | Define AI clerks as YAML manifests. Hot-reload without restarting the server. |
| **Confidence Gate** | A judge model scores every draft response; only escalates to a premium model when necessary. |
| **Rules Engine** | Post-generation validation: forbidden-topic detection and PII redaction before the response is sent. |
| **Persona Rendering** | Each clerk speaks in its own configured voice and stance, enforced at the system-prompt level. |
| **Retrieval (RAG)** | TF-IDF based per-pack knowledge retrieval from corpus `.txt` files. No external vector DB needed. |
| **Tool System** | Pack-gated tools (OCR, Vision, Media Pipeline) simulated via LLM when no hardware OCR is attached. |
| **Audit Ledger** | Every request, escalation, and tool call is persisted to a structured JSONL ledger for compliance. |
| **Sovereign Mode** | Toggle to cut off all external API calls — forces local-only inference, preventing data egress. |
| **Docker Support** | Full `docker-compose` stack with optional AMD ROCm/vLLM integration. |

---

## 🏗️ Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                       │
│  Console · Inspector · Catalog · Pack Studio · Landing        │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼──────────────────────────────────────┐
│                  FastAPI Backend                               │
│                                                               │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │ Pack Loader │   │ Session Mgr  │   │   Audit Ledger   │   │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────┘   │
│         │                 │                                   │
│  ┌──────▼─────────────────▼───────────────────────────────┐  │
│  │              GuildHouse Pipeline                        │  │
│  │  1. Tool Detection → execute if intent matched          │  │
│  │  2. Knowledge Retrieval (TF-IDF RAG)                    │  │
│  │  3. Local Draft (cheap model — GLM-5P1)                 │  │
│  │  4. Confidence Gate → Escalation if < 0.7 threshold     │  │
│  │  5. Rules Validation (forbidden topics + redaction)     │  │
│  │  6. Persona Rendering (voice & stance enforcement)      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                         │                                     │
│  ┌──────────────────────▼─────────────────────────────────┐  │
│  │               Fireworks AI / vLLM (ROCm)               │  │
│  │  Local: GLM-5P1    ·    Escalation: DeepSeek-V4-Pro    │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
GuildHouse/
├── backend/
│   ├── main.py                 # FastAPI app & all REST endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   ├── engine/
│   │   ├── config.py           # API keys, model names, thresholds
│   │   ├── session.py          # SessionManager — orchestrates the full pipeline
│   │   ├── inference.py        # LocalEngine — cheap-model draft generation
│   │   ├── gateway.py          # EscalationGateway — confidence gate & escalation
│   │   ├── rules.py            # RulesEngine — forbidden topic & PII redaction
│   │   ├── persona.py          # PersonaEngine — final output rendering
│   │   ├── retrieval.py        # RetrievalEngine — TF-IDF knowledge retrieval
│   │   ├── tools.py            # ToolsRegistry — OCR, Vision, Media Pipeline
│   │   ├── loader.py           # PackLoader — YAML pack registry
│   │   └── ledger.py           # Ledger — JSONL audit trail
│   ├── packs/
│   │   ├── *.yaml              # Clerk pack manifests (18 built-in packs)
│   │   └── *_corpus.txt        # Per-pack knowledge corpora for RAG
│   └── data/
│       └── ledger.jsonl        # Runtime audit log (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component, routing, tour
│   │   ├── components/
│   │   │   └── Sidebar.jsx     # Navigation, Sovereign Mode toggle
│   │   └── views/
│   │       ├── Console.jsx     # Live chat interface with pack selector
│   │       ├── Inspector.jsx   # Pipeline metadata & audit ledger viewer
│   │       ├── Catalog.jsx     # Browse & filter all installed packs
│   │       ├── PackStudio.jsx  # Live YAML editor with hot-reload
│   │       └── Landing.jsx     # Entry splash page
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml          # Full-stack orchestration (+ vLLM ROCm)
├── .env.example                # Environment variable template
└── extract.py                  # Utility script for text corpus extraction
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- A **Fireworks AI API key** → [fireworks.ai](https://fireworks.ai)

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/GuildHouse.git
cd GuildHouse
cp .env.example .env
# Edit .env and add your FIREWORKS_API_KEY
```

### 2. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run the development server
python -m uvicorn main:app --reload
# Backend is now live at http://localhost:8000
```

### 3. Start the Frontend

```bash
cd frontend

npm install
npm run dev
# Frontend is now live at http://localhost:5173
```

---

## 🐳 Docker Deployment

The `docker-compose.yml` wires together three services:

| Service | Port | Description |
|---|---|---|
| `frontend` | `80` | Nginx-served React SPA |
| `backend` | `8000` | FastAPI runtime |
| `vllm-rocm` | `8080` | AMD ROCm-accelerated vLLM inference server |

```bash
# Set your API keys
export FIREWORKS_API_KEY=your_key_here
export HUGGING_FACE_HUB_TOKEN=your_hf_token  # for vLLM model download

docker-compose up --build
```

> **Note:** The `vllm-rocm` service requires AMD GPU hardware (`/dev/kfd`, `/dev/dri`). Remove or comment out that service block if running on CPU-only or NVIDIA hardware.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the project root and configure:

| Variable | Required | Default | Description |
|---|---|---|---|
| `FIREWORKS_API_KEY` | ✅ Yes | — | Fireworks AI API key for cloud inference |
| `LOCAL_MODEL` | No | `accounts/fireworks/models/glm-5p1` | The cheap, fast model used for first-pass drafts |
| `ESCALATION_MODEL` | No | `accounts/fireworks/models/deepseek-v4-pro` | The premium model used when confidence is low |
| `JUDGE_MODEL` | No | `accounts/fireworks/models/glm-5p1` | The model that scores draft quality (0.0–1.0) |
| `ESCALATION_THRESHOLD` | No | `0.7` | Confidence score below which escalation triggers |

> **No API key?** The backend runs in **mock mode** — all responses are prefixed with `[Mock]` and no real API calls are made. Great for local UI development.

---

## 📦 The Pack System

A **Pack** is a YAML manifest that fully defines a clerk agent's identity, behaviour, and compliance boundaries.

### Pack Schema

```yaml
name: Clinic Front-Desk Clerk     # Required. Used as the pack ID (lowercased, underscored)
version: 1.0.0                    # Semantic version
description: >                    # Human-readable purpose
  Appointment triage for small practices.
languages:                        # Supported response languages
  - en
  - ms
  - zh
persona:
  voice: Warm, professional receptionist.      # Voice injected into system prompt
  stance: Empathetic and incredibly cautious.  # Stance/attitude framing
rules:                            # Hard rules injected into the system prompt
  - Route all symptom descriptions to triage nurses
  - Never confirm appointments without schedule check
escalation_policy:
  forbidden:                      # Topics the clerk refuses to address
    - medical diagnoses
  redact_first:                   # PII categories redacted before any API call
    - patient names
    - medical history
tools:                            # Tool grants for this clerk
  - ocr
```

### Built-in Packs (18 included)

| Pack | Domain |
|---|---|
| `ScamShield` | Consumer protection & fraud detection |
| `Clinic Front-Desk Clerk` | Medical reception & appointment triage |
| `PDPA Compliance Auditor` | Personal data protection auditing |
| `MyInvois` | Malaysian e-invoicing compliance |
| `LectureForge` | Academic lecture generation |
| `AgriVision Crop Doctor` | Agricultural diagnostics |
| `Factory SOP Copilot` | Industrial SOP assistance |
| `IIoT Alarm Storm Doctor` | Industrial IoT alert analysis |
| `Meeting Multiplexer` | Meeting summarization & action items |
| `ROCm Migration Assistant` | AMD ROCm GPU migration guidance |
| `Hackathon Judge Copilot` | Project evaluation assistant |
| `ZK Circuit Auditor` | Zero-knowledge circuit review |
| `Manglish Support Clerk` | Multilingual (EN/MS/ZH) support |
| `Tenancy & Contract Explainer` | Property & legal document explanation |
| `Cross-Border Listing Clerk` | E-commerce cross-border compliance |
| `Edge Retail Shelf Clerk` | Retail inventory & shelf management |
| `Grant & Tender Writer's Aide` | Grant writing assistance |
| `Fine-Tune Concierge` | LLM fine-tuning guidance |

---

## 🔌 REST API Reference

All endpoints are served at `http://localhost:8000`.

### Health

```
GET /api/health
```

Returns service status, Fireworks AI configuration state, and number of loaded packs.

---

### Packs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/packs` | List all loaded packs |
| `GET` | `/api/packs/{pack_id}` | Get a specific pack's manifest |
| `GET` | `/api/packs/{pack_id}/source` | Get raw YAML source for the editor |
| `POST` | `/api/packs` | Create a new pack from YAML content |
| `PUT` | `/api/packs/{pack_id}` | Update and hot-reload an existing pack |
| `DELETE` | `/api/packs/{pack_id}` | Delete a pack |
| `POST` | `/api/packs/reload` | Force reload all packs from disk |

---

### Chat

```
POST /api/chat
Content-Type: application/json

{
  "pack_id": "clinic_front-desk_clerk",
  "session_id": "optional-uuid-to-continue-a-session",
  "message": "I need to book an appointment for next Monday."
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "Of course! Let me check the availability for next Monday...",
  "metadata": {
    "pack_name": "Clinic Front-Desk Clerk",
    "local_tokens": 312,
    "escalated": false,
    "confidence": 0.92,
    "escalation_tokens": 0,
    "total_tokens": 312,
    "rules_applied": 2,
    "tool_used": "",
    "persona": {
      "clerk_name": "Clinic Front-Desk Clerk",
      "voice": "Warm, professional receptionist.",
      "stance": "Empathetic and incredibly cautious with health data.",
      "description": "..."
    }
  }
}
```

---

### Ledger

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ledger` | Retrieve all audit events as JSON |
| `POST` | `/api/ledger/clear` | Clear the ledger |

---

## 🧠 Request Pipeline (Deep Dive)

Every message sent to `/api/chat` passes through this deterministic pipeline inside `SessionManager.process_request()`:

```
User Message
    │
    ▼
[Step 0]  Tool Detection
          Keyword-matches the message against pack-granted tools.
          If matched → calls ToolsRegistry to execute (OCR / Vision / Media)
    │
    ▼
[Step 0.5] Knowledge Retrieval
           TF-IDF cosine similarity search over the pack's corpus .txt file.
           Top-2 relevant passages injected into the prompt context.
    │
    ▼
[Step 1]  Local Draft
          Sends the enriched prompt + system prompt (persona + rules + policy)
          to the cheap LOCAL_MODEL via Fireworks AI.
    │
    ▼
[Step 2]  Confidence Gate
          JUDGE_MODEL scores the draft (0.0 – 1.0).
          Score ≥ ESCALATION_THRESHOLD (0.7) → use the local draft.
          Score < threshold → re-run with expensive ESCALATION_MODEL.
    │
    ▼
[Step 3]  Rules Validation
          Post-generation check for forbidden topics → refuses with explanation.
          Applies PII redaction patterns (credit cards, SSNs, phones, addresses).
    │
    ▼
[Step 4]  Persona Rendering
          Strips trailing whitespace; persona voice was already enforced in Step 1.
    │
    ▼
[Step 5]  Session History Update
          Appends {user, assistant} turn to in-memory session.
    │
    ▼
[Step 6]  Ledger Logging
          Writes verdict, token counts, escalation flag to JSONL ledger.
    │
    ▼
Response to Frontend
```

---

## 🛡️ Compliance & Data Sovereignty

### Forbidden Topics
Defined per-pack in `escalation_policy.forbidden`. Built-in categories:
- `financial_advice` — investment recommendations
- `legal_advice` — legal counsel directives
- `minors_data` — children's personal information
- `institutional_material` — copyrighted course materials

### PII Redaction
Defined per-pack in `escalation_policy.redact_first`. Built-in categories:
- `financial_data` — credit card & account numbers
- `tax_ids` — Tax IDs and SSN formats
- `phone_numbers` — international phone number formats
- `addresses` — street addresses

### Sovereign Mode (UI)
The Sovereign Switch in the sidebar disables all external API calls. The backend falls back to mock responses, ensuring **zero data egress** — critical for PDPA and similar data-residency regulations.

---

## 🖥️ Frontend Views

| View | Description |
|---|---|
| **Landing** | Splash page with entry point to the dashboard |
| **Console** | Live chat UI with pack selector, message history, and file simulation for tool testing |
| **Inspector** | Displays pipeline metadata (tokens, confidence, escalation flag, persona info) and the full audit ledger |
| **Catalog** | Browsable card grid of all installed packs with search and filter |
| **Pack Studio** | Full YAML editor with syntax highlighting and one-click hot-reload |

---

## 🔧 Adding a Custom Pack

1. Create a new `.yaml` file in `backend/packs/` following the schema above.
2. *(Optional)* Create a `backend/packs/<pack_name>_corpus.txt` file with domain knowledge for RAG.
3. Either restart the backend, or call `POST /api/packs/reload` to hot-reload without downtime.
4. The new clerk appears immediately in the Catalog and Console pack selector.

---

## 🧪 Testing

```bash
# Backend pipeline test
cd backend
python test_pipeline.py

# Frontend linting
cd frontend
npm run lint
```

---

## 📋 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, FastAPI, Uvicorn |
| **Frontend** | React 19, Vite 8, Tailwind CSS 3 |
| **AI Inference** | Fireworks AI API (OpenAI-compatible) |
| **Local GPU** | AMD ROCm + vLLM (optional) |
| **Knowledge Retrieval** | scikit-learn TF-IDF |
| **Containerisation** | Docker, Docker Compose |
| **Pack Format** | YAML |
| **Audit Log** | JSONL (newline-delimited JSON) |

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-new-pack`
3. Add your pack YAML to `backend/packs/`.
4. Open a pull request with a description of the clerk's use-case and compliance boundaries.

---

## 📄 License

This project was built for the **AMD Developer Hackathon: ACT II AI Hackathon** on lablab.ai. See the repository for license details.
