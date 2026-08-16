# ITRHUB Architecture and Product Redesign

## Executive Summary

ITRHUB should become an AI-first Indian tax operating system, not a collection of separate tax pages. The product should feel simple on the surface: one workspace, one guided flow, one AI assistant, one place to understand tax health. The backend should carry the complexity: document intelligence, tax rules, return preparation, validation, RAG, integrations, and year-round recommendations.

Current direction has too much frontend surface area:

- Multiple pages expose overlapping concepts: workspace, documents, tracker, income, preparation, portfolio, calculators.
- Several modules behave like standalone tools instead of stages of one return workflow.
- Some intelligence is trapped in UI components rather than modeled as backend services.
- The backend is useful but still service-flat: it needs stronger domain boundaries, repositories, background jobs, AI/RAG layers, eventing, and auditability.

The target architecture is:

> Simple frontend. Powerful backend. AI-first. Unified taxpayer profile.

## Immediate Implementation Decision

The app should not keep separate top-level product pages for Workspace, Income, Documents, Prepare, Portfolio, and Tracker.

Replace the authenticated navigation with only:

- `Intake`
- `Analysis`
- `Track`

Meaning:

- **Intake** collects everything from the user and all integrations.
- **Analysis** shows everything ITRHUB has understood and generated.
- **Track** monitors everything that is pending, due, filed, synced, or completed.

`Workspace` should be removed as a visible product concept. The backend may still use workspace/return entities internally, but users should not see "workspace" as a separate destination.

## Product Principles

1. One user journey, not many pages.
2. Every feature writes into a unified taxpayer graph.
3. AI is not a chat widget bolted on top; it is the orchestration layer.
4. Documents, accounts, income sources, investments, GST, and returns are all inputs into one tax intelligence engine.
5. The UI shows decisions, confidence, missing inputs, and next actions.
6. The backend owns rules, calculations, reconciliation, validation, and explanations.
7. Every generated result must be traceable to sources.
8. Every tax decision should be explainable in plain language.
9. The system should support salaried users first, but the domain model must handle all ITR categories.
10. The architecture should allow official tax rules, schemas, and AI knowledge packs to evolve without rewriting the product.

## Current Project Assessment

### Current Frontend Shape

Current routes:

- `/`
- `/auth`
- `/workspace`
- `/income`
- `/documents`
- `/portfolio`
- `/prepare`
- `/tracker`

Current component groups:

- Landing sections: hero, tax pulse, portfolio preview, deduction finder, smart tools.
- Workspace: taxpayer profiles, filing progress, CTAs.
- Income wizard: source capture.
- Documents workbench: upload and reconciliation.
- Portfolio analyzer: capital gains analysis.
- Return preparation: schedules, validation, JSON.
- Tracker: deadline UI.
- Chatbot: global UI assistant.

This is functional, but the product still feels page-led instead of intelligence-led.

### Current Backend Shape

Current backend has:

- FastAPI app
- Auth
- Workspace endpoints
- Tax calculator endpoints
- Portfolio endpoints
- Deadlines/chat endpoints
- Services for tax engine, portfolio, document import, return preparation
- SQLAlchemy models for users, taxpayer profiles, filing workspaces, documents

This is a good prototype base, but production architecture needs:

- Domain modules instead of endpoint folders carrying orchestration.
- Repositories for database access.
- Explicit document pipeline.
- Task queue and background processing.
- AI/RAG subsystems.
- Tax rule versioning.
- Audit logs and source traceability.
- Integration framework.

## Product Redesign

### New Product Model

ITRHUB should have three simple product surfaces:

1. **Intake**
   One place where the user gives ITRHUB everything: personal details, taxpayer profile, income sources, documents, broker connections, bank connections, GST details, salary information, business details, investments, deductions, loans, insurance, and any other input.

2. **Analysis**
   One place where ITRHUB shows what it understood: income summary, deductions, investments, mismatches, tax-saving opportunities, old-vs-new regime, return preparation, validation errors, refund/payable estimate, and AI insights.

3. **Track**
   One place where the user tracks status over time: filing progress, missing items, deadlines, notices, refunds, challans, connected-account syncs, AI tasks, and post-filing follow-ups.

This replaces the mental model of workspace, income page, document page, portfolio page, preparation page, and tracker page. The user should think:

> "I give everything to ITRHUB in Intake. I understand everything in Analysis. I track everything in Track."

### Core Navigation

Recommended primary navigation:

1. `Home`
2. `Intake`
3. `Analysis`
4. `Track`

Do not expose separate top-level navigation for workspace, income, documents, prepare, portfolio, or tracker. Those are implementation modules inside the three product surfaces.

### Route Consolidation

Current route | Problem | New home
--- | --- | ---
`/workspace` | Creates a separate mental model | Merge into `/intake` and `/track`
`/income` | User should not hunt for income capture | Merge into `/intake`
`/documents` | Uploads and connections belong with all inputs | Merge into `/intake`
`/portfolio` | Broker and investment data are inputs; capital-gains output is analysis | Input in `/intake`, results in `/analysis`
`/prepare` | Return prep is an analysis/review output | Merge into `/analysis`
`/tracker` | Keep as a concept, rename route to `/track` | `/track`
Landing calculators | Useful acquisition content but not app navigation | Marketing page or Analysis tool cards
Global chatbot | Should be contextual everywhere | AI side panel inside Intake, Analysis, and Track

### Final UX Flow

1. User signs up.
2. User completes onboarding:
   - PAN basics
   - taxpayer type
   - residency
   - income categories
   - employment/business/investment status
3. User lands in **Intake**.
4. Intake asks for all inputs in one guided flow:
   - user information
   - PAN/taxpayer profile
   - salary details
   - business/profession details
   - house property
   - other income
   - documents
   - broker accounts
   - bank accounts
   - investment accounts
   - GST if applicable
   - loans and insurance
   - Form 16
   - AIS/TIS
   - Form 26AS
   - bank statements
   - broker/CAS statements
   - GST returns if applicable
5. Backend pipelines extract, sync, normalize, and reconcile facts.
6. User opens **Analysis** to see:
   - income summary
   - mismatch risks
   - missing deductions
   - old vs new regime
   - refund/payable estimate
   - missing documents/accounts
   - investments and capital gains
   - AI recommendations
7. Analysis includes return preparation:
   - schedules
   - validation errors
   - challan guidance
   - portal JSON
8. User opens **Track** to monitor:
   - filing progress
   - deadlines
   - missing tasks
   - notices
   - refund status
   - challans
   - connected-account sync status
9. Product remains useful after filing:
   - notices
   - refund tracking
   - tax planning
   - quarterly advance tax reminders

## Target System Architecture

```text
Frontend: Next.js
  |
  | REST / streaming chat / upload
  v
API Gateway: FastAPI
  |
  +-- Auth and Identity
  +-- Taxpayer Profile Domain
  +-- Document Domain
  +-- Income and Investment Domain
  +-- Tax Calculation Domain
  +-- Return Preparation Domain
  +-- AI Orchestration Domain
  +-- Integrations Domain
  |
  v
PostgreSQL + Object Storage + Vector Store + Queue
```

### Backend Layers

1. API layer
   - HTTP contracts only.
   - No business logic beyond validation and auth.

2. Application layer
   - Use cases and orchestration.
   - Examples: `GenerateReturnPack`, `ReconcileDocuments`, `AnalyzeTaxSavings`.

3. Domain layer
   - Tax rules, entities, calculations, validation, schedules.
   - Pure logic where possible.

4. Repository layer
   - Database access.
   - Keeps SQLAlchemy out of domain services.

5. Infrastructure layer
   - OCR providers
   - LLM providers
   - vector database
   - storage
   - broker/bank/GST connectors
   - queue workers

6. Event layer
   - Domain events for pipeline automation.

## Proposed Backend Folder Structure

```text
backend/app/
  main.py
  core/
    config.py
    database.py
    security.py
    logging.py
    observability.py
  api/
    routes/
      auth.py
      dashboard.py
      documents.py
      connections.py
      returns.py
      ai.py
      notifications.py
  domains/
    identity/
      models.py
      schemas.py
      repository.py
      service.py
    taxpayers/
      models.py
      schemas.py
      repository.py
      service.py
    documents/
      models.py
      schemas.py
      repository.py
      service.py
      extraction.py
      reconciliation.py
    income/
      models.py
      schemas.py
      repository.py
      service.py
    investments/
      models.py
      schemas.py
      repository.py
      capital_gains.py
    tax_rules/
      rule_sets/
      validation_rules/
      schema_registry.py
      rule_engine.py
      explanation_engine.py
    returns/
      models.py
      schemas.py
      repository.py
      preparation_engine.py
      schedule_builder.py
      portal_json.py
    ai/
      orchestrator.py
      prompts.py
      tools.py
      memory.py
      guardrails.py
    rag/
      ingestion.py
      retrieval.py
      chunking.py
      citations.py
    integrations/
      bank/
      broker/
      gst/
      pan_aadhaar/
  workers/
    tasks.py
    document_tasks.py
    ai_tasks.py
    integration_tasks.py
  events/
    bus.py
    types.py
    handlers.py
  audit/
    service.py
    models.py
```

## Proposed Frontend Architecture

### Frontend Principle

The frontend should be a thin, calm client over powerful backend workflows.

It should not duplicate tax logic. It should:

- Display backend-derived status.
- Let users provide missing inputs.
- Ask AI questions.
- Review source-backed insights.
- Trigger backend jobs.

### Proposed Frontend Folder Structure

```text
Frontend/src/
  app/
    (marketing)/
      page.tsx
    (auth)/
      auth/page.tsx
    (app)/
      dashboard/page.tsx
      assistant/page.tsx
      review/page.tsx
  features/
    dashboard/
      components/
      hooks/
      types.ts
    onboarding/
      components/
      hooks/
    documents/
      components/
      hooks/
    connections/
      components/
      hooks/
    returns/
      components/
      hooks/
    assistant/
      components/
      hooks/
  shared/
    api/
      client.ts
      endpoints.ts
    ui/
      button.tsx
      card.tsx
      badge.tsx
      drawer.tsx
      table.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
    utils/
```

### Recommended Routing

Public:

- `/`
- `/pricing`
- `/security`
- `/resources`

Authenticated:

- `/intake`
- `/analysis`
- `/track`

The authenticated routes should share one `AppShell`.

## Three-Page App Design

### Page 1: Intake

Purpose: collect every input in one place.

Sections:

- Personal and taxpayer information
- PAN/residency/entity profile
- Salary information
- Business/profession/GST information
- Rental income and house property
- Other income
- Documents: Form 16, AIS, TIS, Form 26AS, bank statements, broker reports, GST returns
- Connections: broker, bank, investment, GST, salary/payroll
- Loans, insurance, deductions, investments
- AI-guided missing-input checklist

Design rule: Intake should feel like a smart checklist, not a set of separate tools.

### Page 2: Analysis

Purpose: show what ITRHUB understood and what the user should do.

Sections:

- Unified financial profile
- Income analysis
- Expense analysis
- Investment and capital-gains analysis
- Deduction opportunities
- Old regime vs new regime
- Tax payable/refund estimate
- Document mismatch analysis
- Return preparation schedules
- Validation errors explained in plain language
- Portal JSON export
- AI insights and recommendations

Design rule: Analysis should be read-only by default, with each number linked back to sources from Intake.

### Page 3: Track

Purpose: monitor everything over time.

Sections:

- Filing status
- Missing tasks
- Deadlines
- Advance tax reminders
- Challan/payment status
- Refund status
- Notices and responses
- Connected-account sync status
- AI background tasks
- Post-filing history

Design rule: Track should answer "what is happening, what is late, and what needs my attention?"

## Feature Consolidation

### One Logical Home per Capability

Capability | New location
--- | ---
User/taxpayer profile | Intake
Document upload | Intake
Document reconciliation | Analysis
Income wizard | Intake
Broker connections | Intake
Bank connections | Intake
GST connections | Intake
Salary information | Intake
Business details | Intake
Portfolio analyzer input | Intake
Capital-gains result | Analysis
Tax calculator | Analysis
Deduction finder | Analysis
Return preparation | Analysis
Portal JSON generation | Analysis
AI chat | Contextual side panel on Intake, Analysis, and Track
Deadline tracker | Track
Tax pulse | Track
Notices | Track
Refund status | Track
Challan/payment status | Track

### Remove as Top-Level Pages

Eventually remove these as standalone app pages:

- `/workspace`
- `/income`
- `/documents`
- `/portfolio`
- `/tracker`
- `/prepare`

Replace them with:

- `/intake`
- `/analysis`
- `/track`

Keep old routes temporarily as redirects during migration.

## Database Design

### Identity

```sql
users (
  id uuid primary key,
  email text unique not null,
  full_name text not null,
  password_hash text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

sessions (
  id uuid primary key,
  user_id uuid references users(id),
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null
)
```

### Taxpayer Profiles

```sql
taxpayer_profiles (
  id uuid primary key,
  user_id uuid references users(id),
  display_name text not null,
  taxpayer_type text not null,
  relationship text not null,
  pan_hash text,
  pan_last_four text,
  aadhaar_last_four text,
  date_of_birth date,
  residency_status text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Tax Returns

```sql
tax_returns (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  assessment_year_start int not null,
  financial_year_start int not null,
  itr_form text,
  regime text,
  status text not null,
  completion_percent int not null,
  current_stage text,
  generated_json jsonb,
  filed_acknowledgement_no text,
  filed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Documents

```sql
documents (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  tax_return_id uuid references tax_returns(id),
  document_type text not null,
  original_name text not null,
  storage_key text not null,
  sha256 text not null,
  status text not null,
  extracted_text text,
  extracted_data jsonb,
  confidence numeric,
  uploaded_at timestamptz
)

document_facts (
  id uuid primary key,
  document_id uuid references documents(id),
  fact_type text not null,
  label text not null,
  value jsonb not null,
  confidence numeric,
  source_page int,
  source_bbox jsonb,
  created_at timestamptz
)
```

### Unified Financial Facts

```sql
financial_facts (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  tax_return_id uuid references tax_returns(id),
  source_type text not null,
  source_id uuid,
  fact_category text not null,
  fact_key text not null,
  amount numeric,
  currency text default 'INR',
  period_start date,
  period_end date,
  metadata jsonb,
  confidence numeric,
  created_at timestamptz
)
```

### Income Sources

```sql
income_sources (
  id uuid primary key,
  tax_return_id uuid references tax_returns(id),
  source_type text not null,
  gross_amount numeric not null,
  deductions numeric default 0,
  taxable_amount numeric,
  tax_paid numeric default 0,
  metadata jsonb,
  created_at timestamptz
)
```

### Investments and Transactions

```sql
connected_accounts (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  provider text not null,
  account_type text not null,
  status text not null,
  access_token_ref text,
  metadata jsonb,
  connected_at timestamptz
)

transactions (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  account_id uuid references connected_accounts(id),
  transaction_date date,
  description text,
  amount numeric,
  category text,
  metadata jsonb
)

investment_holdings (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  provider text,
  asset_type text,
  asset_name text,
  isin text,
  quantity numeric,
  average_cost numeric,
  market_value numeric,
  metadata jsonb
)

capital_gain_lots (
  id uuid primary key,
  tax_return_id uuid references tax_returns(id),
  asset_type text,
  asset_name text,
  buy_date date,
  sell_date date,
  buy_value numeric,
  sell_value numeric,
  gain numeric,
  gain_type text,
  tax_amount numeric,
  metadata jsonb
)
```

### AI

```sql
ai_conversations (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  tax_return_id uuid references tax_returns(id),
  title text,
  created_at timestamptz
)

ai_messages (
  id uuid primary key,
  conversation_id uuid references ai_conversations(id),
  role text not null,
  content text not null,
  citations jsonb,
  tool_calls jsonb,
  created_at timestamptz
)

ai_insights (
  id uuid primary key,
  profile_id uuid references taxpayer_profiles(id),
  tax_return_id uuid references tax_returns(id),
  insight_type text not null,
  title text not null,
  explanation text not null,
  recommendation text,
  severity text,
  confidence numeric,
  source_refs jsonb,
  status text,
  created_at timestamptz
)
```

### Notifications and Audit

```sql
notifications (
  id uuid primary key,
  user_id uuid references users(id),
  profile_id uuid references taxpayer_profiles(id),
  type text not null,
  title text not null,
  body text not null,
  status text not null,
  scheduled_for timestamptz,
  created_at timestamptz
)

audit_logs (
  id uuid primary key,
  actor_user_id uuid references users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before jsonb,
  after jsonb,
  ip_address inet,
  created_at timestamptz
)
```

## API Architecture

### API Style

Use REST for core workflows and server-sent events or WebSockets for streaming AI.

Recommended API groups:

```text
/api/auth/*
/api/dashboard/*
/api/profiles/*
/api/returns/*
/api/documents/*
/api/connections/*
/api/insights/*
/api/assistant/*
/api/notifications/*
```

### Core APIs

```text
GET    /api/dashboard/summary
POST   /api/onboarding/complete

GET    /api/returns
POST   /api/returns
GET    /api/returns/{id}
POST   /api/returns/{id}/prepare
POST   /api/returns/{id}/validate
GET    /api/returns/{id}/portal-json

POST   /api/documents/upload
GET    /api/documents
POST   /api/documents/{id}/extract
POST   /api/returns/{id}/reconcile

POST   /api/connections/broker/connect
POST   /api/connections/bank/connect
POST   /api/connections/gst/connect

POST   /api/assistant/chat
GET    /api/assistant/conversations
POST   /api/insights/generate
```

## AI Architecture

### AI Assistant Responsibilities

The AI assistant should have access to tools, not raw unrestricted database access.

Tools:

- Get taxpayer summary
- Search documents
- Explain tax calculation
- Compare regimes
- Find missing deductions
- Generate checklist
- Explain validation error
- Explain notice
- Recommend next action

### AI Guardrails

- Always cite source facts.
- Mark uncertainty.
- Separate tax guidance from filing action.
- Never invent numbers.
- Never claim final filing eligibility without validation.
- Keep audit trail of AI-generated recommendations.

## RAG Architecture

### Knowledge Sources

1. User documents
2. Extracted document facts
3. Income tax rules
4. CBDT circulars
5. Notifications
6. ITR schema and validation documents
7. Help articles and internal tax explainers

### Pipeline

```text
Ingest source
  -> classify document
  -> extract text
  -> chunk
  -> enrich metadata
  -> embed
  -> store vector
  -> link chunks to source
```

### Retrieval Strategy

Use hybrid retrieval:

- metadata filters: assessment year, document type, taxpayer profile
- keyword search: PAN terms, section numbers, schedule names
- vector search: semantic questions
- reranking: prioritize official sources and user documents

### Citation Model

Every AI answer should include:

- source type
- document name or rule pack
- page/section
- extracted quote or fact
- confidence

## Document Intelligence Pipeline

```text
Upload
  -> virus scan
  -> file classification
  -> OCR/text extraction
  -> structured extraction
  -> confidence scoring
  -> fact normalization
  -> duplicate detection
  -> reconciliation
  -> insight generation
```

Document processors:

- Form 16 parser
- AIS parser
- TIS parser
- Form 26AS parser
- broker statement parser
- bank statement parser
- GST return parser
- invoice parser
- salary slip parser

## Tax Rule Engine

### Rule Pack Structure

```text
tax_rules/
  ay_2026_27/
    slabs.json
    deductions.json
    itr_eligibility.json
    validation_rules.json
    schedule_requirements.json
    portal_schema_map.json
```

Each rule should contain:

- rule id
- assessment year
- applicable ITR forms
- condition
- severity
- explanation
- fix
- references
- tests

### Validation Output

```json
{
  "code": "ITR-2-CG-001",
  "severity": "error",
  "schedule": "Schedule CG",
  "message": "Capital gains schedule is incomplete",
  "plain_language": "You reported capital gains but did not provide asset-wise sale details.",
  "suggested_fix": "Upload broker statement or enter sale details manually.",
  "source_refs": []
}
```

## Event System

Events should drive the product:

```text
document.uploaded
document.extracted
facts.updated
income.reconciled
return.prepared
validation.failed
insight.generated
connection.synced
notification.scheduled
```

Example:

1. User uploads Form 16.
2. `document.uploaded` event fires.
3. Worker extracts Form 16.
4. `document.extracted` event fires.
5. Financial facts are updated.
6. Return summary recalculates.
7. AI insight is generated: "Your employer TDS covers 82% of estimated tax."

## Background Workers

Use a task queue:

- Celery + Redis
- or RQ + Redis
- or Dramatiq
- or managed cloud queue later

Worker jobs:

- OCR extraction
- document parsing
- embeddings
- reconciliation
- AI insight generation
- account sync
- GST sync
- report generation
- notification scheduling

## Security and Compliance

Required:

- Encrypt documents at rest.
- Hash sensitive identifiers like PAN.
- Store only last four PAN digits for display.
- Use HTTP-only cookies or secure session storage.
- Add audit logs for document access and generated returns.
- Add data retention controls.
- Add user data export/delete workflow.
- Add role-based access if family/CA collaboration is introduced.
- Add source traceability for every generated tax number.

## Implementation Roadmap

### Phase 1: Product Simplification

Goal: Make the current product understandable.

Backend:

- Keep current workspace APIs.
- Add dashboard summary endpoint.
- Move scattered calculations behind backend services.
- Add source trace fields to income summaries.

Frontend:

- Create `/dashboard`.
- Move income/documents/prepare/portfolio/tracker into dashboard panels.
- Reduce top nav to Dashboard, Assistant, Connections, Review.
- Keep old pages as redirects during migration.

Database:

- Introduce `tax_returns` as future replacement for `filing_workspaces`.
- Add `financial_facts`.

Complexity: Medium.

### Phase 2: Document Intelligence

Backend:

- Add document pipeline service.
- Add async workers.
- Store extracted facts.
- Add reconciliation engine.

Frontend:

- Replace document page with dashboard document panel.
- Show extraction status and confidence.

AI:

- Explain document findings.
- Generate missing-document checklist.

Complexity: High.

### Phase 3: Unified Tax Profile

Backend:

- Add income, investments, transactions, deductions, taxes paid as normalized facts.
- Add profile analyzer.
- Add tax health score and compliance score.

Frontend:

- Dashboard overview becomes source-backed.
- Every number links to source evidence.

AI:

- User can ask "why is this number here?"

Complexity: High.

### Phase 4: AI Assistant and RAG

Backend:

- Add RAG ingestion.
- Add vector store.
- Add AI tool registry.
- Add conversation memory.

Frontend:

- Context-aware assistant side panel.
- Citation viewer.

AI:

- Answer from user docs and official rule packs.
- Explain notices/calculations/deductions.

Complexity: High.

### Phase 5: Integrations

Backend:

- Broker integrations.
- Bank integrations.
- GST integrations.
- PAN/Aadhaar verification.

Frontend:

- Connections panel.
- Sync status and permissions.

Complexity: Very high.

### Phase 6: Filing-Grade Return Engine

Backend:

- Versioned official ITR schemas.
- Official validation rules.
- Portal JSON generation.
- Challan workflow.
- Audit-grade calculation records.

Frontend:

- Review & File panel.
- Plain-language validation fixes.
- JSON export and filing checklist.

Complexity: Very high.

## Migration Plan from Current Repo

### Step 1

Immediately simplify the app navigation to:

- Home
- Intake
- Analysis
- Track

Remove `Workspace`, `Income`, `Documents`, `Prepare`, `Portfolio`, and `Tracker` from the primary nav.

### Step 2

Create `/intake` as the only place for user input.

Move these existing capabilities into Intake:

- taxpayer/profile details from Workspace
- income-source wizard
- document upload
- broker/portfolio upload and future broker connect
- bank/GST/salary connection placeholders
- deductions, loans, insurance, business details
- missing-input checklist

### Step 3

Create `/analysis` as the only place for interpreted results.

Move these existing capabilities into Analysis:

- document reconciliation results
- portfolio/capital-gains analysis results
- tax calculator/regime comparison
- deduction finder
- return preparation engine
- validation errors
- challan guidance
- portal JSON export
- AI recommendations

### Step 4

Create `/track` as the only place for ongoing monitoring.

Move these existing capabilities into Track:

- filing progress
- deadlines/tax pulse
- advance tax reminders
- missing tasks
- challan/payment status
- refund status
- notices
- connected-account sync status
- post-filing history

### Step 5

Replace old top-level pages with redirects:

```text
/workspace -> /intake
/income -> /intake?section=income
/documents -> /intake?section=documents
/portfolio -> /intake?section=investments
/prepare -> /analysis?section=return
/tracker -> /track
```

### Step 6

Refactor backend:

- `workspace.py` endpoint logic moves into application services.
- Add repositories.
- Split intake collection, analysis generation, and tracking into application services.

### Step 7

Introduce `financial_facts` and migrate current `progress_data` into normalized tables.

## Scalability Recommendations

- Use PostgreSQL JSONB only for flexible metadata, not core financial facts.
- Store documents in object storage, not database binary columns.
- Use background jobs for OCR and AI.
- Version every rule pack by assessment year.
- Treat all generated tax outputs as reproducible calculation records.
- Add idempotency keys for integrations and uploads.
- Use observability from day one: request logs, task logs, AI traces.
- Add golden tax test vectors for every assessment year.
- Add feature flags for AI and integrations.
- Use a schema registry for official ITR JSON exports.

## North Star Product

The final ITRHUB experience should be:

1. User opens Intake.
2. ITRHUB says:
   - "Give me your documents, broker data, bank data, salary, business, GST, and deduction details here."
3. User opens Analysis.
4. ITRHUB says:
   - "Your return is 72% ready."
   - "Two documents are missing."
   - "Old regime saves Rs 18,400."
   - "Your AIS has one unmatched dividend entry."
   - "You need ITR-2 because of capital gains."
   - "Refund estimate: Rs 12,800."
5. User opens Track.
6. ITRHUB says:
   - "ITR deadline is 39 days away."
   - "One challan is pending."
   - "Broker sync completed yesterday."
   - "Refund tracking will begin after filing."
7. User asks:
   - "How can I save more tax?"
8. AI answers with source-backed recommendations and exact next actions.

That is the product: not forms, not pages, not tools, but a trusted AI tax command center.