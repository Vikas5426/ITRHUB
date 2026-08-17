# 🧾 ITRHUB — Indian Income Tax Return Filing & Tax Intelligence Platform

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![SQLite/PostgreSQL](https://img.shields.io/badge/SQLAlchemy_2.0-Async-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Groq](https://img.shields.io/badge/AI_Copilot-Groq_LLM-F55036?style=for-the-badge&logo=openai&logoColor=white)

**An intelligent, full-stack tax filing, portfolio analysis, and return preparation platform tailored for Indian Tax Assessment Year 2026-27 (FY 2025-26) & AY 2025-26.**

[Quick Start](#-quick-start) • [Features](#-core-features) • [Architecture](#-architecture--data-flow) • [Detailed Setup](#-detailed-step-by-step-setup) • [Environment Config](#-environment-variables) • [API Reference](#-api-reference) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 Overview

**ITRHUB** is a full-stack Indian Income Tax Return assistant built with **FastAPI (Python)** and **Next.js 16 (React 19 / TypeScript)**. It streamlines the tax filing journey for salaried individuals, investors, freelancers, and small business owners:

- **Compare Tax Regimes Instantly**: Real-time evaluation of Old vs New Tax Regimes with accurate slabs, enhanced ₹75,000 standard deduction (AY 2026-27), Section 87A rebates, surcharges, and 4% Health & Education Cess.
- **Taxpayer Workspace & Profiles**: Manage multiple profiles (Self, Spouse, Parents, HUFs) with assessment-year specific workspaces, autosave, and revision collision checks.
- **Encrypted Document Vault & Reconciliation**: Secure client-side and server-side encrypted storage for Form 16, AIS, TIS, 26AS, and broker statements, with automated cross-document reconciliation.
- **Capital Gains Portfolio Analyzer**: Ingest broker transaction CSV/PDF files (Zerodha, Groww, Upstox, etc.) to compute STCG (20%/15%), LTCG (12.5%/10%), grandfathering relief, and loss-harvesting suggestions.
- **AI Tax Copilot**: Multi-turn conversational tax copilot powered by Groq LLMs with deterministic tax-engine tool calling, real-time SSE streaming, and PII masking.
- **Statutory Deadlines & Filing Pack**: Dynamic tax calendar tracking advance tax installments and ITR deadlines, complete with downloadable pre-filled filing summaries.

---

## ⚙️ Core Features

### 🧮 1. Tax Computation Engine
- **Accurate Indian Tax Slabs**: Full support for Assessment Year 2026-27 (FY 2025-26) and AY 2025-26 under both Old and New Regimes.
- **Regime Comparison**: Side-by-side breakdown showing exact tax savings, marginal relief, and breakeven deduction requirements.
- **Section 80 Deductions**: Comprehensive calculators for 80C (PPF, EPF, ELSS, Life Insurance), 80D (Mediclaim), 80CCD(1B) (NPS), 80TTA/80TTB, 80G, and HRA exemption rules.
- **Surcharge & Cess**: Step-by-step computation of surcharge bands (10%, 15%, 25%, 39%) and 4% Health & Education Cess.
- **Refund & Penalty Estimator**: TDS reconciliation vs actual tax liability, refund estimation, and Section 234A/B/C/F late filing interest/fee projections.

### 💼 2. Taxpayer Filing Workspace
- **Multi-Entity Profiles**: Support for Self, Family Members, and HUFs under a single account.
- **Assessment-Year Workspaces**: Isolated workspaces for each assessment year with revision protection against concurrent overwrites.
- **Document Management**: End-to-end encrypted storage for PDF, JSON, CSV, JPG, and PNG documents up to 10 MB per file using Fernet symmetric encryption.
- **Cross-Document Reconciliation**: Parses uploaded Form 16, AIS, and broker files to flag discrepancies before filing.

### 📈 3. Portfolio & Capital Gains Analyzer
- **Broker Import**: Accepts trade sheets and P&L statements via file upload or JSON payload.
- **Holding Period Categorization**: Distinguishes Short-Term (STCG) vs Long-Term (LTCG) across Listed Equity, Debt Funds, and Mutual Funds.
- **Special Tax Rates**: Applies updated capital gains rates (STCG @ 20%/15%, LTCG @ 12.5%/10% with ₹1.25L exemption threshold for AY 2026-27).
- **Grandfathering Relief**: Historical cost computation for equity acquired prior to January 31, 2018.

### 🤖 4. AI Tax Copilot
- **Deterministic Tool Calling**: Connects to the backend tax engine via function calling to compute figures deterministically rather than hallucinating math.
- **SSE Real-time Streaming**: Instant conversational responses streamed over Server-Sent Events (SSE).
- **PII Masking**: Automatically masks PAN numbers, Aadhaar numbers, and sensitive personal identifiers before query dispatch.
- **Multi-Turn Context**: Preserves conversation history and session isolation per user.

---

## 🏛️ Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                          │
│   React 19 • TypeScript • Tailwind CSS v4 • Framer Motion • Recharts   │
│                 Runs on http://localhost:3000                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                     Proxy Rewrites (`/api/*`)
                     HTTP-only Session Cookies
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         BACKEND (FastAPI)                              │
│         Async ASGI Engine • Pydantic v2 • Runs on :8000                │
├────────────────────────────────────────────────────────────────────────┤
│  API Routers:                                                          │
│  ├── /api/auth       -> Authentication & Secure Session Cookies        │
│  ├── /api/workspace  -> Taxpayer Profiles, Documents & Workspaces      │
│  ├── /api/tax        -> Tax Calculation, Rebate, Slabs & ITR Selector  │
│  ├── /api/portfolio  -> Capital Gains & CSV Portfolio Parser           │
│  ├── /api/deadlines  -> Dynamic Tax Calendars & Advance Tax Deadlines  │
│  └── /api/chat       -> AI Copilot (SSE Streaming & Function Calling)   │
├────────────────────────────────────────────────────────────────────────┤
│  Core Services:                                                        │
│  ├── tax_engine.py             -> Slabs, Surcharge, Cess, Rebates     │
│  ├── portfolio_service.py      -> STCG/LTCG, Grandfathering, FIFO      │
│  ├── document_import_service.py-> Form 16, AIS, 26AS Reconciliation    │
│  ├── return_preparation.py     -> Validation & Filing Pack Summary     │
│  └── ai_orchestrator.py        -> Groq LLM + Deterministic Tools       │
└────────────────┬───────────────────┬───────────────────┬───────────────┘
                 │                   │                   │
┌────────────────▼─────────┐ ┌───────▼────────┐ ┌────────▼──────────────┐
│        DATABASE          │ │   ENCRYPTION   │ │       AI CLOUD        │
│ SQLite (aiosqlite) [Dev] │ │ Fernet (AES-128│ │ Groq API              │
│ PostgreSQL (asyncpg)[Prd]│ │ CBC + HMAC)    │ │ (OpenAI tool-calling) │
└──────────────────────────┘ └────────────────┘ └───────────────────────┘
```

---

## 📁 Project Structure

```text
ITRHUB/
├── backend/                         # FastAPI Python Backend
│   ├── alembic/                     # Database migration scripts
│   │   ├── versions/                # Migration revision files
│   │   └── env.py                   # Async Alembic environment configuration
│   ├── app/                         # Backend application package
│   │   ├── api/                     # Route controllers
│   │   │   ├── auth/                # Register, Login, Logout, Me endpoints
│   │   │   │   ├── routes.py
│   │   │   │   └── schemas.py
│   │   │   └── endpoints/           # Feature endpoints
│   │   │       ├── chat.py          # AI Copilot chat & conversation history
│   │   │       ├── deadlines.py     # Tax calendar and deadline calculator
│   │   │       ├── portfolio.py     # Portfolio analysis & capital gains
│   │   │       ├── tax_calculator.py# Slabs, regime comparison, ITR selector
│   │   │       └── workspace.py     # Profiles, workspaces, documents & vault
│   │   ├── core/                    # Core configuration & utilities
│   │   │   ├── config.py            # Pydantic Settings & environment loader
│   │   │   ├── database.py          # Async SQLAlchemy engine & session factory
│   │   │   └── security.py          # Password hashing, JWT & Fernet encryption
│   │   ├── dependencies/            # FastAPI dependency injections (auth, db)
│   │   │   └── auth.py
│   │   ├── models/                  # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   └── user.py              # User, Profile, Workspace, Document, Chat
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   │   ├── tax.py
│   │   │   └── workspace.py
│   │   ├── services/                # Business logic & tax calculation engine
│   │   │   ├── ai_orchestrator.py   # AI Copilot orchestration & tool routing
│   │   │   ├── ai_service.py        # Groq client & streaming wrapper
│   │   │   ├── ai_tools.py          # Function schemas for tool calling
│   │   │   ├── document_import_service.py # Cross-document reconciliation
│   │   │   ├── portfolio_service.py # STCG/LTCG holding period calculations
│   │   │   ├── return_preparation_service.py # Return pack generator
│   │   │   ├── tax_engine.py        # AY 2026-27/2025-26 Indian tax arithmetic
│   │   │   └── user_service.py      # Financial lookup helpers
│   │   └── main.py                  # FastAPI entrypoint, CORS, lifespan startup
│   ├── tests/                       # Pytest test suite (220+ tests)
│   │   ├── test_ai_assistant_full.py# AI Copilot test suite
│   │   ├── test_auth_routes.py      # Authentication & session tests
│   │   ├── test_chat_auth.py        # Multi-turn chat isolation tests
│   │   ├── test_tax_engine_param.py # Parameterized tax engine tests
│   │   ├── test_tax_engine_fuzz.py  # Hypothesis property-based fuzz tests
│   │   └── test_portfolio_user_flow.py # End-to-end portfolio tests
│   ├── alembic.ini                  # Alembic CLI configuration
│   ├── requirements.txt             # Python backend dependencies
│   ├── .env.example                 # Environment template
│   └── .env                         # Local environment configuration
│
├── Frontend/                        # Next.js 16 Frontend Web App
│   ├── public/                      # Static assets, icons, SVGs
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── analysis/            # Tax breakdown & regime analysis page
│   │   │   ├── auth/                # Login & registration portal
│   │   │   ├── documents/           # Document vault & reconciliation page
│   │   │   ├── income/              # Income streams intake wizard
│   │   │   ├── intake/              # Taxpayer questionnaire page
│   │   │   ├── portfolio/           # Portfolio capital gains analyzer page
│   │   │   ├── prepare/             # Final return review & filing pack page
│   │   │   ├── track/ & tracker/    # Tax deadline countdown & calendar
│   │   │   ├── workspace/           # Multi-profile taxpayer workspace
│   │   │   ├── globals.css          # Tailwind CSS v4 styling & themes
│   │   │   ├── layout.tsx           # Root application layout & providers
│   │   │   └── page.tsx             # Interactive landing page
│   │   ├── components/              # Reusable React UI components
│   │   │   ├── AIChatBot.tsx        # Floating AI Tax Copilot widget
│   │   │   ├── AppNavbar.tsx        # Responsive navigation bar
│   │   │   ├── DeductionFinder.tsx  # Interactive Section 80 deduction finder
│   │   │   ├── FilingSteps.tsx      # Step-by-step ITR filing guide
│   │   │   ├── PortfolioAnalyzer.tsx# CSV upload & gains visualizer
│   │   │   ├── TaxPulse.tsx         # Real-time summary dashboard
│   │   │   ├── TaxRegimeComparison.tsx # Old vs New regime interactive toggle
│   │   │   └── ui/                  # Primitives (buttons, dialogs, inputs)
│   │   ├── context/                 # React Context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   └── lib/                     # API client & utility helpers
│   ├── next.config.ts               # Next.js config with API proxy rewrites
│   ├── package.json                 # Node dependencies & scripts
│   ├── postcss.config.mjs           # PostCSS configuration
│   └── tsconfig.json                # TypeScript configuration
│
├── docs/                            # Architectural documentation
├── CHANGELOG.md                     # Project version history
├── .gitignore                       # Git ignore rules
└── README.md                        # Root developer documentation
```

---

## ⚡ Quick Start

For experienced developers who already have **Node.js 18+** and **Python 3.10+** installed:

### 1. Start the Backend (Terminal 1)
```bash
# From repository root
cd backend

# Create & activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (zero-config SQLite default works out-of-the-box)
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend (Terminal 2)
```bash
# In a new terminal from repository root
cd Frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

### 3. Open the Application
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/](http://localhost:8000/)

---

## 🛠️ Detailed Step-by-Step Setup

Follow this guide for a complete, beginner-friendly setup from scratch.

### 📋 Prerequisites

Make sure you have the following installed on your machine:
- **Git**: [Download Git](https://git-scm.com/)
- **Python 3.10 to 3.14**: [Download Python](https://www.python.org/downloads/) *(ensure "Add Python to PATH" is checked during Windows installation)*
- **Node.js 18.18+ or 20+ (LTS recommended)**: [Download Node.js](https://nodejs.org/)
- **Optional**: [PostgreSQL 14+](https://www.postgresql.org/) (only if you want PostgreSQL instead of SQLite)
- **Optional**: [Redis](https://redis.io/) (for caching/rate limiting)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ITRHUB.git
cd ITRHUB
```

---

### Step 2: Backend Setup & Installation

Navigate to the `backend` directory:
```bash
cd backend
```

#### A. Create a Python Virtual Environment
```bash
# Windows (PowerShell or Command Prompt)
python -m venv .venv

# macOS / Linux
python3 -m venv .venv
```

#### B. Activate the Virtual Environment
```bash
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# (If you get a script execution policy error, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# Windows Command Prompt (cmd.exe):
.venv\Scripts\activate.bat

# macOS / Linux (bash/zsh):
source .venv/bin/activate
```

> [!NOTE]
> When active, your terminal prompt will be prefixed with `(.venv)`.

#### C. Install Backend Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### D. Configure Backend Environment (`.env`)
Copy the provided `.env.example` file to `.env`:
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# macOS / Linux / Git Bash:
cp .env.example .env
```

Open `backend/.env` in your text editor. The default SQLite database configuration works immediately without needing to install PostgreSQL.

To enable the **AI Tax Copilot**, obtain a free API key from [Groq Console](https://console.groq.com/keys) and set:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

#### E. Initialize Database & Migrations
Run the Alembic migration command to create all tables and indexes:
```bash
alembic upgrade head
```

#### F. Start the FastAPI Backend Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```
Expected output:
```text
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

---

### Step 3: Frontend Setup & Installation

Open a **second terminal** and navigate to the `Frontend` folder:
```bash
cd Frontend
```

#### A. Install Node Dependencies
```bash
npm install
```

#### B. Understanding Next.js Proxy Integration
The frontend does **not** require any mandatory `.env` file for local development. `Frontend/next.config.ts` automatically proxies all `/api/*` network requests to `http://127.0.0.1:8000/api/*`.

#### C. Start the Next.js Development Server
```bash
npm run dev
```
Expected output:
```text
  ▲ Next.js 16.2.4 (Turbopack)
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 1.8s
```

---

### Step 4: Verification & Smoke Testing

1. Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the ITRHUB landing page with the hero section, Tax Pulse dashboard, and regime comparison.
2. Open [http://localhost:8000/docs](http://localhost:8000/docs) to access Swagger UI. Test the `/api/tax/calculate` endpoint with:
   ```json
   {
     "income": 1200000,
     "deductions": 150000
   }
   ```
3. Test registering a new account at [http://localhost:3000/auth](http://localhost:3000/auth).
4. Try uploading a broker CSV or testing the AI Copilot on the bottom-right of the dashboard.

---

## 🔐 Environment Variables

All backend settings are loaded via `pydantic-settings` from `backend/.env`.

| Variable | Type | Required? | Default Value | Description & Source |
|:---|:---:|:---:|:---|:---|
| `ENVIRONMENT` | string | Optional | `development` | Runtime mode: `development` or `production`. |
| `DATABASE_URL` | string | **Required** | `sqlite+aiosqlite:///./itrhub.db` | Async database connection URL. For PostgreSQL use: `postgresql+asyncpg://user:pass@localhost:5432/itrhub`. |
| `CORS_ORIGINS` | JSON list | Optional | `["http://localhost:3000","http://127.0.0.1:3000"]` | Allowed frontend origins for CORS headers. |
| `SECRET_KEY` | string | **Required** | `replace-with-a-long-random-session-secret` | Cryptographic secret used for signing JWT session cookies. Generate via `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `DOCUMENT_ENCRYPTION_KEY` | string | Optional | *(empty)* | 32-byte URL-safe base64 key for Fernet document encryption at rest. Generate via `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. |
| `SECURE_COOKIES` | boolean | Optional | `false` | Set to `true` in production when serving over HTTPS (`Secure; SameSite=Lax`). |
| `AUTO_CREATE_TABLES` | boolean | Optional | `true` | When `true`, automatically syncs ORM tables on startup. Set to `false` in production. |
| `MAX_DOCUMENT_BYTES` | integer | Optional | `10485760` (10 MB) | Maximum permitted file upload size in bytes. |
| `GROQ_API_KEY` | string | Optional | *(empty)* | API key from [Groq Console](https://console.groq.com/keys) to power the AI Tax Copilot. If blank, Copilot uses safe rule-based fallbacks. |
| `AI_MODEL` | string | Optional | `openai/gpt-oss-120b` | Groq LLM model name (e.g., `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`). |
| `AI_TEMPERATURE` | float | Optional | `0.2` | Temperature for AI responses (low values ensure deterministic tax adherence). |
| `AI_MAX_TOKENS` | integer | Optional | `2048` | Maximum completion token budget for AI Copilot answers. |
| `AI_REASONING_EFFORT` | string | Optional | `medium` | Reasoning depth effort (`low`, `medium`, `high`). |
| `REDIS_URL` | string | Optional | `redis://localhost:6379/0` | Optional Redis instance URL for response caching. |

> [!WARNING]
> In production environments, never use the default `SECRET_KEY` or `DOCUMENT_ENCRYPTION_KEY`. Changing `DOCUMENT_ENCRYPTION_KEY` after uploading documents will make previously stored files unreadable without a re-encryption migration.

---

## 📡 API Reference

The backend exposes an interactive OpenAPI Swagger UI at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new user account and primary "Self" taxpayer profile. Sets HTTP-only session cookie.
- `POST /api/auth/login`: Authenticate with email & password. Sets HTTP-only session cookie.
- `POST /api/auth/logout`: Clear authentication cookie.
- `GET /api/auth/me`: Get current authenticated user profile.

### 🧮 Tax Computation (`/api/tax`)
- `POST /api/tax/calculate`: Calculate and compare Old vs New tax liability with slab breakdowns, 87A rebate, and surcharge.
- `POST /api/tax/refund`: Estimate refund or payable balance given taxable income, deductions, and TDS paid.
- `POST /api/tax/select-itr`: Recommend appropriate ITR Form (ITR-1, ITR-2, ITR-3, ITR-4) based on income sources and audit status.
- `POST /api/tax/slab`: Returns visual slab breakdowns for UI charts.

### 📈 Portfolio & Capital Gains (`/api/portfolio`)
- `POST /api/portfolio/analyze`: Ingests broker trade sheets (via multipart CSV file or `{ "csv_text": "..." }` JSON body). Computes:
  - STCG / LTCG breakdown per equity/debt holding.
  - Grandfathering cost base adjustments (Jan 31, 2018).
  - Special tax components (`stcg_tax`, `ltcg_tax`, `slab_tax`).
  - Full tax summary when `income` is provided or resolved from authenticated user.

### 🗄️ Taxpayer Workspace & Vault (`/api/workspace`)
- `GET /api/workspace/profiles`: List all taxpayer profiles owned by the user (Self, Family, HUF).
- `POST /api/workspace/profiles`: Create a new taxpayer profile.
- `GET /api/workspace/profiles/{id}/workspaces`: Retrieve assessment-year filing workspaces for a profile.
- `GET /api/workspace/workspaces/{id}/documents`: List encrypted documents in the workspace vault.
- `POST /api/workspace/workspaces/{id}/documents`: Upload and encrypt a tax document (Form 16, AIS, etc.).
- `GET /api/workspace/workspaces/{id}/documents/{doc_id}/download`: Decrypt and download a stored document.
- `POST /api/workspace/workspaces/{id}/reconcile`: Trigger automated cross-document reconciliation.
- `POST /api/workspace/workspaces/{id}/prepare`: Generate the final return preparation schedule pack.

### 🤖 AI Tax Copilot (`/api/chat`)
- `POST /api/chat`: Send a tax query. Supports optional `conversation_id` for multi-turn chat and `stream: true` for Server-Sent Events (SSE).
- `GET /api/chat/conversations`: List past conversation threads.
- `GET /api/chat/conversations/{id}`: Fetch full conversation history.
- `PATCH /api/chat/conversations/{id}`: Rename conversation title.
- `DELETE /api/chat/conversations/{id}`: Delete conversation thread.

### 📅 Deadlines (`/api/deadlines`)
- `GET /api/deadlines/calculate?u_type=individual&has_audit=false&is_presumptive=false`: Dynamic tax deadline schedule and countdown timers.

---

## 🧪 Developer Workflow & Testing

### 🐍 Backend Commands

Run from `backend/` directory with virtual environment activated:

```bash
# Run the entire test suite (220+ tests including parameterized & fuzz tests)
pytest

# Run tests with verbose output
pytest -v

# Run specific test modules
pytest tests/test_tax_engine_param.py
pytest tests/test_auth_routes.py
pytest tests/test_ai_assistant_full.py

# Create a new database migration revision
alembic revision --autogenerate -m "describe_changes_here"

# Apply pending database migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### ⚛️ Frontend Commands

Run from `Frontend/` directory:

```bash
# Start local development server with Turbopack
npm run dev

# Run ESLint validation
npm run lint

# Build optimized production bundle
npm run build

# Start production server
npm run start
```

---

## ❓ Troubleshooting

### 1. `uvicorn: command not found` or ModuleNotFoundError
- **Cause**: The Python virtual environment is not activated or dependencies are not installed.
- **Fix**:
  ```bash
  cd backend
  # Ensure your virtualenv is active:
  .venv\Scripts\activate  # Windows
  source .venv/bin/activate  # macOS/Linux
  pip install -r requirements.txt
  ```

### 2. PowerShell: `cannot be loaded because running scripts is disabled`
- **Cause**: Windows PowerShell execution policy restricts script execution by default.
- **Fix**: Open PowerShell as Administrator or run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .venv\Scripts\Activate.ps1
  ```

### 3. Backend startup error: `Could not import module 'main'`
- **Cause**: Starting uvicorn with `main:app` instead of `app.main:app`.
- **Fix**: Always run uvicorn as:
  ```bash
  python -m uvicorn app.main:app --reload --port 8000
  ```

### 4. Database error: `no such table: users`
- **Cause**: Migrations have not been applied to the SQLite/PostgreSQL database.
- **Fix**: Run Alembic migrations from the `backend/` folder:
  ```bash
  alembic upgrade head
  ```

### 5. Frontend API calls return `401 Unauthorized` or CORS error
- **Cause**: Using mismatched hostnames (e.g. browsing `http://127.0.0.1:3000` while cookies are issued for `localhost`).
- **Fix**: Access the frontend consistently via [http://localhost:3000](http://localhost:3000). Next.js proxy rewrites in `next.config.ts` will forward all `/api` requests seamlessly.

### 6. AI Copilot returns fallback responses instead of Groq LLM answers
- **Cause**: `GROQ_API_KEY` is not set or invalid in `backend/.env`.
- **Fix**: Get a free API key from [Groq Console](https://console.groq.com/keys), paste it into `backend/.env` as `GROQ_API_KEY=gsk_...`, and restart the backend server.

### 7. Port 3000 or 8000 already in use
- **Cause**: Another service or previous instance is holding the port.
- **Fix**:
  - Windows: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
  - macOS/Linux: `lsof -i :8000` then `kill -9 <PID>`

---

## 📄 License & Acknowledgments

This project is built for Indian taxpayers, chartered accountants, and developers seeking an accurate, open, and extensible tax filing platform for Assessment Year 2026-27 (FY 2025-26).

Feel free to open issues or contribute to the repository!
