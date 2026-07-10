<div align="center">

# 🏰 GuildHouse

### Sovereign AI Clerk Appliance — Web Edition

**A privacy-first, multi-tenant AI runtime that deploys domain-specific "clerk" agents from hot-swappable YAML packs.**

<br/>

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Fireworks AI](https://img.shields.io/badge/Fireworks_AI-Inference-FF0000?style=for-the-badge)](https://fireworks.ai/)
[![AMD ROCm](https://img.shields.io/badge/AMD-ROCm-ED1C24?style=for-the-badge&logo=amd&logoColor=white)](https://www.amd.com/en/products/software/rocm.html)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

> YAML Packs · Confidence-Gated Escalation · Audit Ledger · Sovereign Mode · 18 Built-in Clerks

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Docker Deployment](#-docker-deployment)
- [Environment Variables](#-environment-variables)
- [The Pack System](#-the-pack-system)
- [API Reference](#-api-reference)
- [Request Pipeline](#-request-pipeline)
- [Compliance & Data Sovereignty](#-compliance--data-sovereignty)
- [File Structure](#-file-structure)
- [Frontend Views](#-frontend-views)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**GuildHouse** is an edge-deployable AI platform for organizations that need domain-specific AI assistants with strict compliance boundaries, data-sovereignty guarantees, and real-time auditability. It pairs a React console with a Python FastAPI backend, routing every query through a two-tier confidence pipeline — a cheap model handles routine traffic, a premium model is invoked only when confidence is low — with every decision written to an append-only audit ledger.

| Capability | Detail |
|---|---|
| 📦 Pack System | Clerks defined as YAML manifests, hot-reloaded without restart |
| 🎯 Confidence Gate | Judge model scores every draft; escalates below threshold |
| 🛡️ Rules Engine | Forbidden-topic detection + PII redaction before send |
| 🎭 Persona Rendering | Per-pack voice and stance, enforced at the system-prompt level |
| 🔍 Retrieval (RAG) | TF-IDF per-pack knowledge lookup from corpus `.txt` files |
| 🧰 Tool System | Pack-gated OCR / vision / media tools, LLM-simulated as fallback |
| 📜 Audit Ledger | Every request, escalation, and tool call logged to JSONL |
| 🔒 Sovereign Mode | One toggle cuts all external calls, forcing local-only inference |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                      │
│  Console · Inspector · Catalog · Pack Studio · Landing        │
└────────────────────────┬──────────────────────────────────────┘
                          │  HTTP / REST
┌────────────────────────▼──────────────────────────────────────┐
│                     FastAPI Backend                           │
│                                                                │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Pack Loader │   │ Session Mgr  │   │   Audit Ledger   │    │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────┘    │
│         │                 │                                   │
│  ┌──────▼─────────────────▼───────────────────────────────┐   │
│  │              GuildHouse Pipeline                       │   │
│  │  1. Tool Detection    → execute if intent matched       │   │
│  │  2. Knowledge Retrieval (TF-IDF RAG)                    │   │
│  │  3. Local Draft (cheap model — GLM-5P1)                 │   │
│  │  4. Confidence Gate   → escalate if below threshold     │   │
│  │  5. Rules Validation  (forbidden topics + redaction)     │   │
│  │  6. Persona Rendering (voice & stance enforcement)       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                     │
│  ┌───────────────────────▼─────────────────────────────────┐  │
│  │               Fireworks AI / vLLM (ROCm)                │  │
│  │   Local: GLM-5P1     ·     Escalation: DeepSeek-V4-Pro  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Component Map

| Layer | Technology | Key File(s) |
|---|---|---|
| Session pipeline | Python | [`engine/session.py`](backend/engine/session.py) |
| Local draft engine | Fireworks AI (GLM-5P1) | [`engine/inference.py`](backend/engine/inference.py) |
| Escalation gateway | Fireworks AI (DeepSeek-V4-Pro) | [`engine/gateway.py`](backend/engine/gateway.py) |
| Rules engine | Python, regex | [`engine/rules.py`](backend/engine/rules.py) |
| Persona engine | Python | [`engine/persona.py`](backend/engine/persona.py) |
| Retrieval (RAG) | scikit-learn TF-IDF | [`engine/retrieval.py`](backend/engine/retrieval.py) |
| Tool registry | OCR / vision / media | [`engine/tools.py`](backend/engine/tools.py) |
| Pack loader | YAML | [`engine/loader.py`](backend/engine/loader.py) |
| Audit ledger | JSONL | [`engine/ledger.py`](backend/engine/ledger.py) |
| Console | React + Vite | [`frontend/src/views/`](frontend/src/views/) |

---

## ✨ Features

### 🎨 Frontend
- **Console** — live chat UI with pack selector and message history
- **Inspector** — full pipeline trace: tokens, confidence, escalation flag, persona
- **Catalog** — browsable, filterable grid of all installed packs
- **Pack Studio** — YAML editor with syntax highlighting and one-click hot-reload
- **Sovereign toggle** — sidebar switch to force local-only inference

### ⚙️ Backend
- **Confidence-gated escalation** — cheap model drafts, judge model scores, premium model only steps in below threshold
- **Declarative packs** — persona, rules, escalation policy, and tool grants live entirely in YAML, no code changes needed
- **Hot-reload** — edit a pack, call reload, the clerk's behaviour changes with zero downtime
- **Per-pack knowledge retrieval** — TF-IDF search over a pack's own corpus, no external vector database
- **Structured audit trail** — every escalation, redaction, and tool call written to an append-only JSONL ledger

---

## 📦 Prerequisites

| Requirement | Minimum Version | Check |
|---|---|---|
| **Python** | 3.10 | `python --version` |
| **Node.js** | 18.x | `node --version` |
| **npm** | 9.x | `npm --version` |
| **Fireworks AI API key** | — | [fireworks.ai](https://fireworks.ai) |

---

## 🚀 Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/Richard2606-hub/GuildHouse.git
cd GuildHouse
cp .env.example .env
# Edit .env and add your FIREWORKS_API_KEY
```

### 2. Start the backend

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

pip install -r requirements.txt
python -m uvicorn main:app --reload
# Backend live at http://localhost:8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Frontend live at http://localhost:5173
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
export FIREWORKS_API_KEY=your_key_here
export HUGGING_FACE_HUB_TOKEN=your_hf_token  # for vLLM model download

docker-compose up --build
```

> **⚠️ Note:** The `vllm-rocm` service requires AMD GPU hardware (`/dev/kfd`, `/dev/dri`). Remove or comment out that service block if running on CPU-only or non-AMD hardware.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `FIREWORKS_API_KEY` | ✅ Yes | — | Fireworks AI API key for cloud inference |
| `LOCAL_MODEL` | No | `accounts/fireworks/models/glm-5p1` | Cheap, fast model for first-pass drafts |
| `ESCALATION_MODEL` | No | `accounts/fireworks/models/deepseek-v4-pro` | Premium model used when confidence is low |
| `JUDGE_MODEL` | No | `accounts/fireworks/models/glm-5p1` | Model that scores draft quality (0.0–1.0) |
| `ESCALATION_THRESHOLD` | No | `0.7` | Confidence score below which escalation triggers |

> **No API key?** The backend runs in **mock mode** — all responses are prefixed with `[Mock]` and no real API calls are made. Great for local UI development.

---

## 🧩 The Pack System

A **Pack** is a YAML manifest that fully defines a clerk agent's identity, behaviour, and compliance boundaries.

<details>
<summary>📄 Pack schema</summary>

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

</details>

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

**To add a custom pack:**

1. Create a new `.yaml` file in `backend/packs/` following the schema above
2. *(Optional)* Add a `backend/packs/<pack_name>_corpus.txt` file with domain knowledge for RAG
3. Restart the backend, or call `POST /api/packs/reload` to hot-reload without downtime
4. The new clerk appears immediately in the Catalog and Console pack selector

---

## 📡 API Reference

All endpoints are served at `http://localhost:8000`.

### `GET /api/health`
Health check. Returns service status, Fireworks AI configuration state, and number of loaded packs.

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

### `POST /api/chat`
Send a message to a clerk.

**Request**
```json
{
  "pack_id": "clinic_front-desk_clerk",
  "session_id": "optional-uuid-to-continue-a-session",
  "message": "I need to book an appointment for next Monday."
}
```

**Response `200`**
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

## 🧠 Request Pipeline

Every message sent to `/api/chat` passes through this deterministic pipeline inside `SessionManager.process_request()`:

```
User Message
    │
    ▼
[Step 0]    Tool Detection
            Keyword-matches the message against pack-granted tools.
            If matched → calls ToolsRegistry to execute (OCR / Vision / Media)
    │
    ▼
[Step 0.5]  Knowledge Retrieval
            TF-IDF cosine similarity search over the pack's corpus .txt file.
            Top-2 relevant passages injected into the prompt context.
    │
    ▼
[Step 1]    Local Draft
            Sends the enriched prompt + system prompt (persona + rules + policy)
            to the cheap LOCAL_MODEL via Fireworks AI.
    │
    ▼
[Step 2]    Confidence Gate
            JUDGE_MODEL scores the draft (0.0–1.0).
            Score ≥ ESCALATION_THRESHOLD (0.7) → use the local draft.
            Score <  threshold → re-run with expensive ESCALATION_MODEL.
    │
    ▼
[Step 3]    Rules Validation
            Post-generation check for forbidden topics → refuses with explanation.
            Applies PII redaction patterns (credit cards, SSNs, phones, addresses).
    │
    ▼
[Step 4]    Persona Rendering
            Strips trailing whitespace; persona voice was already enforced in Step 1.
    │
    ▼
[Step 5]    Session History Update
            Appends {user, assistant} turn to in-memory session.
    │
    ▼
[Step 6]    Ledger Logging
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
- `tax_ids` — tax IDs and SSN formats
- `phone_numbers` — international phone number formats
- `addresses` — street addresses

### Sovereign Mode
The Sovereign Switch in the sidebar disables all external API calls. The backend falls back to mock responses, ensuring zero data egress — relevant for PDPA and similar data-residency regulations.

---

## 📁 File Structure

```
GuildHouse/
│
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
│
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
│
├── docker-compose.yml          # Full-stack orchestration (+ vLLM ROCm)
├── .env.example                # Environment variable template
└── extract.py                  # Utility script for text corpus extraction
```

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

## 🛠️ Troubleshooting

<details>
<summary>❌ Backend won't start — missing Fireworks key</summary>

The backend runs in mock mode without a key, but real inference requires one:

```bash
cp .env.example .env
# Add FIREWORKS_API_KEY=your_key_here
```

Restart with `python -m uvicorn main:app --reload`.

</details>

<details>
<summary>❌ CORS errors in the browser</summary>

Make sure:
- The FastAPI backend is running on port 8000 (`python -m uvicorn main:app --reload`)
- The Vite dev server is running (`npm run dev`)
- No firewall or proxy is blocking `localhost:8000`

</details>

<details>
<summary>❌ Pack fails to load / doesn't appear in Catalog</summary>

1. Check the YAML is valid — indentation errors are the most common cause
2. Call `POST /api/packs/reload` and inspect the response for a validation error
3. Confirm the pack file lives directly under `backend/packs/` with a `.yaml` extension

</details>

<details>
<summary>❌ vLLM / ROCm service fails in Docker Compose</summary>

The `vllm-rocm` service requires AMD GPU hardware (`/dev/kfd`, `/dev/dri`) passed through to the container. On CPU-only or non-AMD hosts, comment out that service block in `docker-compose.yml` and rely on the Fireworks AI cloud path instead.

</details>

<details>
<summary>❌ Escalation never triggers / always triggers</summary>

Check `ESCALATION_THRESHOLD` in your `.env`. A higher value (closer to `1.0`) makes escalation more frequent; a lower value keeps more traffic on the cheap `LOCAL_MODEL`. Also confirm `JUDGE_MODEL` is returning scores in the `Inspector` view for each session.

</details>

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feat/my-new-pack
   ```
3. Add your pack YAML to `backend/packs/`
4. Commit your changes
   ```bash
   git commit -m "feat: add my-new-pack clerk"
   ```
5. Push to your fork and open a Pull Request describing the clerk's use case and compliance boundaries

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

Built and submitted for the **[AMD Developer Hackathon: ACT II](https://lablab.ai/event/amd-developer-hackathon-act-2)** hosted on [lablab.ai](https://lablab.ai).

---

<div align="center">

Built with ❤️ for the **AMD Developer Hackathon: ACT II** on lablab.ai

*YAML Packs · Confidence-Gated Escalation · Audit Ledger · Sovereign Mode*

[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>
