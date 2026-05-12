# ITRHUB

<div align="center">

# 🧾 ITR Filing Web Project

### A full-stack Income Tax Return filing assistant — built with FastAPI + Next.js

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis)

> Simple breakdown — Core pages · Core features · Additional functions · Portfolio analyzer

</div>

---

## 📋 Table of Contents

- [📄 Pages](#-pages)
- [⚙️ Core Features](#️-core-features)
- [📊 Portfolio Analyzer](#-portfolio-analyzer)
- [✨ Additional Functions](#-additional-functions)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)

---

## 📄 Pages

| Page | Description |
|------|-------------|
| 🏠 **Home / Landing** | ITR overview, deadlines, CTA |
| 📘 **ITR Type Guide** | ITR-1 to ITR-7 explained |
| 🧮 **Tax Calculator** | Old vs new regime comparison |
| 🪜 **Filing Steps** | Step-by-step guide with docs |
| 📊 **Portfolio Analyzer** | LTCG / STCG from holdings |
| 🔍 **Deduction Finder** | 80C, 80D, HRA, NPS etc. |
| 📅 **Deadline Tracker** | AY calendar + alerts |
| ❓ **FAQ / Help** | Common queries answered |

---

## ⚙️ Core Features

### Must-Have Features

- **Tax Regime Toggle** — Old (with deductions) vs New (lower slab)
- **Income Slab Display** — Visual slab breakdown + surcharge
- **Section 80 Deductions** — 80C, 80D, 80G, 80E checklist
- **Form 16 Explainer** — How to use Part A & B
- **ITR Form Selector** — Quiz → recommends ITR type
- **Refund Estimator** — TDS paid vs tax liability
- **Document Checklist** — Downloadable PDF checklist
- **AIS / 26AS Guide** — How to download & verify

---

## 📊 Portfolio Analyzer

> Supports **Zerodha, Groww, Kite** — user uploads statement → site calculates gains automatically

| Feature | Details |
|---------|---------|
| 📤 Upload Broker Statement | CSV / PDF support |
| 📈 LTCG Auto-Calculation | Long-term capital gains |
| 📉 STCG Auto-Calculation | Short-term capital gains |
| ⚖️ Equity vs Debt Split | Portfolio allocation breakdown |
| 💰 MF Capital Gains (ELSS) | Mutual fund gains tracking |
| 💵 Dividend Income Summary | All dividend income in one view |
| 🗓️ Grandfathering (Jan 31, 2018) | Historical cost basis calculation |
| 🌾 Loss Harvesting Suggestions | Optimize your tax outgo |
| 📋 Schedule CG Pre-fill | Auto-populate capital gains schedule |

---

## ✨ Additional Functions

| Function | Description |
|----------|-------------|
| 🤖 **AI Chat Assistant** | Answers ITR questions using Claude API |
| ⏳ **Deadline Countdown** | Live timer to filing deadline |
| 📄 **Salary Slip Analyzer** | Upload slip → extract HRA, allowances |
| 🔀 **Comparison Tool** | Old vs new regime tax saved |
| 🌙 **Dark Mode** | Full site theme toggle |
| 📤 **Shareable Report** | Export tax summary as PDF |
| 💸 **Penalty Calculator** | Late filing fee under Section 234F |
| 🌐 **Multi-language** | Hindi + English toggle |

---

## 🛠️ Tech Stack

### 🔧 Backend Core

| Package | Purpose |
|---------|---------|
| **FastAPI** | Main API framework — async, auto docs via Swagger |
| **Uvicorn** | ASGI server to run FastAPI |
| **Pydantic v2** | Request/response validation, built into FastAPI |
| **python-dotenv** | Load `.env` secrets (API keys, DB URL) |

### 🗄️ Database

| Package | Purpose |
|---------|---------|
| **SQLAlchemy 2.0** | ORM — async support with `asyncpg` |
| **Alembic** | DB migrations for SQLAlchemy |
| **PostgreSQL** | Primary DB — user data, tax records |
| **Redis** | Cache tax calc results, rate limiting |

### 🔐 Auth

| Package | Purpose |
|---------|---------|
| **python-jose** | JWT token creation & verification |
| **passlib + bcrypt** | Password hashing |
| **fastapi-users** | Ready-made auth routes (register, login, OAuth) |

### 🖥️ Frontend

| Package | Purpose |
|---------|---------|
| **Next.js 14** | React framework — routing, SSR, API calls |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (forms, tables, modals) |
| **Recharts** | Tax slab charts, portfolio pie charts |
| **React Hook Form** | Tax input forms with validation |
| **Axios / fetch** | Call FastAPI endpoints from React |

### 🧮 Tax Logic (Python)

| Package | Purpose |
|---------|---------|
| **Custom module** | Write `tax_engine.py` — slabs, surcharge, cess, 87A |
| **numpy** | LTCG grandfathering (Jan 31, 2018) calc |
| **dateutil** | Holding period checks (36 months debt, 12 equity) |

### 📑 PDF Generation

| Package | Purpose |
|---------|---------|
| **WeasyPrint** | HTML → PDF tax summary reports |
| **Jinja2** | Template engine for PDF tax reports |

### 🤖 AI + Deployment

| Package | Purpose |
|---------|---------|
| **Anthropic SDK** | Claude API for ITR chat assistant |
| **pdfplumber** | Extract tables from broker PDF statements |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/itr-filing-web.git
cd itr-filing-web/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your DB URL, API keys etc.

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

> API docs available at: `http://localhost:8000/docs`  
> Frontend available at: `http://localhost:3000`

Note: The Portfolio Analyzer API was updated on 2026-05-13 to accept JSON `csv_text` in addition to file uploads, and to require `income` or `user_id` for returning a `tax_summary`. See [backend/PORTFOLIO_API_CHANGE.md](backend/PORTFOLIO_API_CHANGE.md) for details.

---

## 📁 Project Structure

### Initial Backend Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── endpoints/
│   │   │   └── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── itr_types.py
│   │           ├── tax_calculator.py
│   │           ├── filing_steps.py
│   │           ├── portfolio_analyzer.py
│   │           ├── deduction_finder.py
│   │           ├── deadline_tracker.py
│   │           └── faq.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── utils.py
│   ├── dependencies/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── pagination.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── itr_form.py
│   │   ├── tax_record.py
│   │   └── portfolio.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── itr_form.py
│   │   ├── tax_record.py
│   │   └── portfolio.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── itr_form_service.py
│   │   ├── tax_record_service.py
│   │   └── portfolio_service.py
├── tests/
│   ├── __init__.py
│   ├── test_main.py
│   ├── test_auth_routes.py
│   └── test_endpoints/
│       ├── __init__.py
│       ├── test_itr_types.py
│       ├── test_tax_calculator.py
│       ├── test_filing_steps.py
│       ├── test_portfolio_analyzer.py
│       ├── test_deduction_finder.py
│       ├── test_deadline_tracker.py
│       └── test_faq.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── initial_migration.py
├── requirements.txt
└── .env.example
```

---