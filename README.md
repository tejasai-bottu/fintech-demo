# 🚀 AI-Powered Financial Advisory System

Complete demo project with Docker setup for easy deployment.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Running the Application](#running-the-application)
- [Testing the Demo](#testing-the-demo)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

```bash
# Clone or download the project
cd fintech-demo

# Start all services with Docker
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

# Fintrix — Complete Technical Documentation
## AI-Powered Financial Advisory Platform: Present Architecture & Future Integration Roadmap

---

## Table of Contents

### Part I — Current System (v1.0)
1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Database Architecture](#3-database-architecture)
4. [Backend Architecture (FastAPI Core)](#4-backend-architecture-fastapi-core)
5. [Bill Scanner Service — AI Pipeline](#5-bill-scanner-service--ai-pipeline)
6. [How the LLM Works in Receipt Extraction](#6-how-the-llm-works-in-receipt-extraction)
7. [Vector Database — Local Training & Continuous Learning](#7-vector-database--local-training--continuous-learning)
8. [Why the Receipt Scanner Is Unique vs. Competitors](#8-why-the-receipt-scanner-is-unique-vs-competitors)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Financial Calculation Engine](#10-financial-calculation-engine)
11. [Scheduler & Background Jobs](#11-scheduler--background-jobs)
12. [API Reference — Complete Endpoint Map](#12-api-reference--complete-endpoint-map)
13. [Security Architecture](#13-security-architecture)
14. [Docker & Infrastructure](#14-docker--infrastructure)
15. [Data Flow Diagrams](#15-data-flow-diagrams)

### Part II — Future Integration Roadmap (v2.0)
16. [The Vision: One Unified Financial OS](#16-the-vision-one-unified-financial-os)
17. [Current State vs. Future State](#17-current-state-vs-future-state)
18. [Integration Architecture Overview](#18-integration-architecture-overview)
19. [Part A — Simplify-Tax Integration](#part-a--simplify-tax-integration)
    - [What Simplify-Tax Needs From Fintrix](#19-what-simplify-tax-needs-from-fintrix)
    - [What Fintrix Gains From Simplify-Tax](#20-what-fintrix-gains-from-simplify-tax)
    - [New Database Tables for Tax](#21-new-database-tables-for-tax)
    - [API Changes for Tax Integration](#22-api-changes-for-tax-integration)
    - [Data Flows: Fintrix ↔ Simplify-Tax](#23-data-flows-fintrix--simplify-tax)
    - [Frontend Changes for Tax](#24-frontend-changes-for-tax)
20. [Part B — StockMind AI Integration](#part-b--stockmind-ai-integration)
    - [What StockMind Needs From Fintrix](#25-what-stockmind-needs-from-fintrix)
    - [What Fintrix Gains From StockMind](#26-what-fintrix-gains-from-stockmind)
    - [New Database Tables for Investments](#27-new-database-tables-for-investments)
    - [API Changes for Investment Integration](#28-api-changes-for-investment-integration)
    - [Data Flow: Fintrix ↔ StockMind AI](#29-data-flow-fintrix--stockmind-ai)
    - [Frontend Changes for Investments](#30-frontend-changes-for-investments)
21. [Part C — Cross-System Intelligence](#part-c--cross-system-intelligence)
22. [Updated Docker Architecture](#31-updated-docker-architecture)
23. [Updated Database Schema Map](#32-updated-database-schema-map)
24. [Migration Strategy](#33-migration-strategy)
25. [Phase-by-Phase Rollout Plan](#34-phase-by-phase-rollout-plan)
26. [Breaking Changes & Backward Compatibility](#35-breaking-changes--backward-compatibility)

---

# Part I — Current System (v1.0)

---

## 1. System Overview

Fintrix is a full-stack, AI-augmented personal financial advisory platform composed of three independently deployable services communicating over a shared Docker network.

| Service | Language / Framework | Port | Role |
|---|---|---|---|
| `backend` | Python / FastAPI | 8000 | Core financial API, auth, data persistence |
| `frontend` | HTML + JS + Nginx | 80 | Dashboard, settings, analytics UI |
| `bill-scanner` | Python / FastAPI | 8001 | Receipt AI pipeline: OCR → LLM → Vector store |
| `db` | PostgreSQL 15 | 5432 (internal) | Shared relational database |

### What Fintrix Does

- Tracks income (gross salary, tax, PF, additional sources)
- Manages a debt portfolio (EMIs, outstanding balances, DTI ratio)
- Tracks savings goals with feasibility checks
- Categorizes monthly expenses
- Tracks bills and credit card due dates with automated overdue detection
- Provides a live financial health dashboard with ECharts visualizations
- Scans physical receipts using an 8-stage AI pipeline (OCR + LLM + Vector DB)
- Auto-pushes scanned receipt data into the expense tracker
- Sends notifications for overdue bills and goal deadlines
- Generates daily net-worth snapshots and 24-month forecasts

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Docker Network: fintech-network                     │
│                                                                             │
│  ┌──────────────┐    REST API     ┌──────────────────────────────────────┐  │
│  │   Frontend   │ ◄─────────────► │         Backend (FastAPI)            │  │
│  │  Nginx :80   │                 │              :8000                   │  │
│  │              │                 │  ┌──────────┐  ┌───────────────────┐ │  │
│  │  index.html  │                 │  │   Auth   │  │  Profile/Income   │ │  │
│  │  settings    │                 │  │   JWT    │  │  Debt / Goals     │ │  │
│  │  login.html  │                 │  │  bcrypt  │  │  Expense / Bills  │ │  │
│  └──────────────┘                 │  └──────────┘  └───────────────────┘ │  │
│                                   │  ┌──────────┐  ┌───────────────────┐ │  │
│  ┌──────────────┐  Receipt Push   │  │ Scheduler│  │  Financial Engine │ │  │
│  │ Bill Scanner │ ───────────────►│  │APScheduler│ │  Tax Calculator  │ │  │
│  │    :8001     │                 │  │ (midnight)│  │  Forecast Engine │ │  │
│  │              │                 │  └──────────┘  └───────────────────┘ │  │
│  │ OCR Pipeline │                 └──────────────────────┬───────────────┘  │
│  │ LLM Extract  │                                        │                  │
│  │ FAISS Vector │                            ┌───────────▼───────────┐      │
│  └──────────────┘                            │   PostgreSQL :5432    │      │
│         │                                    │                       │      │
│         └─────────────────────────────────── │  All tables (shared)  │      │
│                                              └───────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

The **bill-scanner** authenticates with the **backend** using a service account (`FINTECH_EMAIL` / `FINTECH_PASSWORD` env variables) and calls `/api/profile/expense-categories` to push receipt data into the user's expense tracker automatically.

---

## 3. Database Architecture

The database is **PostgreSQL 15**. Both the backend and bill-scanner connect to the same instance.

### 3.1 Backend Tables (`backend/app/models.py`)

#### `users`
The central user record. Everything else is foreign-keyed to this.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | Internal user ID |
| `email` | String UNIQUE | Login identifier |
| `hashed_password` | String | bcrypt hash — never stored plain |
| `full_name` | String | Display name |
| `gross_monthly_salary` | Float | User's pre-tax monthly salary |
| `gross_annual_salary` | Float | Auto-calculated: `gross_monthly × 12` |
| `income_type` | Enum | SALARIED / SELF_EMPLOYED / BUSINESS / FREELANCE |
| `country` | String | Default "India" — for tax regime selection |
| `state` | String | Indian state — affects tax slab calculation |
| `tax_amount` | Float | Monthly tax auto-calculated from Indian 2024-25 new regime |
| `pf_amount` | Float | Monthly PF (12% of basic salary = 50% of gross) |
| `other_deductions` | Float | Any custom deductions |
| `net_monthly_income` | Float | `gross - tax - pf - deductions + additional_incomes` |
| `risk_tolerance` | String | low / medium / high — drives AI investment recommendations |
| `created_at` / `updated_at` | DateTime | Audit timestamps |

`net_monthly_income` is the single source of truth for take-home pay. Every financial health calculation — DTI ratio, savings feasibility, cashflow, emergency fund adequacy — references it.

---

#### `additional_incomes`
Rental income, freelance, side businesses — anything outside the main salary.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `source_name` | String | "Rental Income", "YouTube Earnings", etc. |
| `monthly_amount` | Float | Amount per month |
| `is_recurring` | Boolean | Recurring vs. one-time windfall |

---

#### `debts`
Each active loan or EMI obligation.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `debt_type` | Enum | HOME_LOAN / CAR_LOAN / PERSONAL_LOAN / CREDIT_CARD / EDUCATION / OTHER |
| `debt_name` | String | Human label: "HDFC Home Loan" |
| `total_principal` | Float | Original loan amount sanctioned |
| `outstanding_principal` | Float | Current remaining balance |
| `interest_rate` | Float | Annual interest % |
| `tenure_months` | Integer | Total loan tenure in months |
| `remaining_months` | Integer | How many months left to pay |
| `monthly_emi` | Float | Fixed monthly payment |
| `start_date` | DateTime | Loan disbursement date |
| `expected_end_date` | DateTime | Auto-calculated: `now + remaining_months × 30 days` |
| `is_active` | Boolean | Soft-delete flag |
| `completed_at` | DateTime | Set when loan is fully repaid |

**DTI Ratio** = `SUM(monthly_emi) / net_monthly_income × 100` across all active debts. **Progress percentage** = `(1 - outstanding/total) × 100`.

---

#### `savings_goals`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `goal_name` | String | "Emergency Fund", "Down Payment", "Europe Trip" |
| `target_amount` | Float | Total amount needed |
| `current_saved` | Float | How much already saved |
| `target_date` | DateTime | Deadline |
| `priority` | Enum | HIGH / MEDIUM / LOW |
| `goal_type` | Enum | SHORT_TERM / MEDIUM_TERM / LONG_TERM |
| `monthly_contribution_needed` | Float | Auto-calculated: `(target - saved) / months_remaining` |
| `is_achieved` | Boolean | Marked true when `current_saved >= target_amount` |

`monthly_contribution_needed` feeds into the cashflow calculation so users can see if their remaining income (after expenses + EMIs + goal contributions) is positive or negative.

---

#### `expense_categories`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `category_name` | String | "Rent", "Food", "Transport", "OTT Subscriptions" |
| `monthly_amount` | Float | Budget or actual monthly spend |
| `is_essential` | Boolean | Essential vs. discretionary |
| `is_fixed` | Boolean | Fixed vs. variable |

When the bill-scanner processes a receipt, it **auto-creates expense category records** for the vendor — this is the bridge between the physical receipt world and the digital budget tracker.

---

#### `investments`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `amount` | Float | Amount invested |
| `investment_type` | String | "SIP", "Stocks", "FD", "Gold", etc. |
| `duration_years` | Integer | Planned holding period |
| `predicted_return` | Float | AI-predicted future value |
| `risk_score` | Float | 0.0 (lowest) to 1.0 (highest) |

**Net Worth** = `SUM(investment.amount) - SUM(debt.outstanding_principal) - SUM(bill.outstanding_balance)`

---

#### `bills`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `bill_name` | String | "HDFC Credit Card", "Airtel Broadband" |
| `bill_type` | Enum | CREDIT_CARD / ELECTRICITY / INTERNET / MOBILE / INSURANCE / SUBSCRIPTION / OTHER |
| `total_amount_due` | Float | Full amount payable this cycle |
| `minimum_due` | Float | Minimum payment to avoid late fee |
| `outstanding_balance` | Float | Running balance |
| `credit_limit` | Float | Credit limit (credit cards only) |
| `billing_cycle_day` | Integer | Day of month when statement generates |
| `due_date_day` | Integer | Day of month payment is due |
| `next_due_date` | DateTime | Exact absolute due date for this cycle |
| `interest_rate` | Float | Annual interest % |
| `late_fee` | Float | Fixed penalty for missing payment |
| `status` | Enum | PENDING / PAID / OVERDUE / PARTIALLY_PAID |
| `is_active` | Boolean | Soft delete |

CHECK constraints enforce: `total_amount_due >= 0`, `interest_rate >= 0`, `late_fee >= 0` — invalid data is rejected at the database level.

---

#### `bill_cycles`
One record per calendar month per bill — the actual statement for that period.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `bill_id` | FK → bills | Which bill |
| `user_id` | FK → users | Owner |
| `cycle_start` | DateTime | First day of billing period |
| `cycle_end` | DateTime | Last day of billing period |
| `due_date` | DateTime | Payment due date for this cycle |
| `amount_due` | Float | Balance at cycle start |
| `minimum_due` | Float | 5% of outstanding or ₹200, whichever is higher |
| `paid_amount` | Float | Running total of payments received |
| `status` | Enum | OPEN / PARTIALLY_PAID / PAID / OVERDUE |

Generated automatically by the `generate_bill_cycles()` scheduler at midnight on each bill's `billing_cycle_day`.

---

#### `bill_payments`
Individual payment transactions against a bill.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `bill_id` | FK → bills | Which bill was paid |
| `user_id` | FK → users | Who paid |
| `amount_paid` | Float | Actual payment amount |
| `payment_date` | DateTime | When the payment was recorded |
| `due_date_at_payment` | DateTime | Due date at time of payment (for lateness check) |
| `was_late` | Boolean | `payment_date > due_date_at_payment` |
| `days_late` | Integer | How many days after due date |
| `late_fee_charged` | Float | Penalty applied |
| `interest_charged` | Float | Daily interest × days late |
| `payment_method` | Enum | UPI / NET_BANKING / CREDIT_CARD / DEBIT_CARD / CASH / AUTO_DEBIT |
| `notes` | String | Optional user notes |

A **deduplication check** prevents double-payments: if the same `bill_id + amount_paid` was recorded within the last 5 seconds, the API returns the existing payment instead of creating a new one.

---

#### `financial_events`
An immutable audit log of everything that happens financially.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `event_type` | Enum | PAYMENT_MADE / PAYMENT_MISSED / LATE_FEE_ADDED / INTEREST_APPLIED / INCOME_RECEIVED / BILL_CREATED / DEBT_ADDED / GOAL_CREATED / GOAL_ACHIEVED / EXPENSE_ADDED / DTI_CHANGED |
| `description` | String | Human-readable: "Late fee of ₹500 on HDFC Card" |
| `amount` | Float | Monetary impact (nullable for non-monetary events) |
| `reference_type` | String | "bill", "debt", "goal", "transaction" |
| `reference_id` | Integer | ID in the referenced table |

Indexed on `(user_id, created_at)` for fast timeline queries.

---

#### `financial_calendar`
Aggregated upcoming payment schedule — all EMIs, bill dues, and goal deadlines in one queryable place.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `event_type` | String | "emi_payment", "bill_due", "goal_deadline", "investment_maturity" |
| `event_title` | String | "HDFC Home Loan EMI", "Credit Card Due" |
| `event_date` | DateTime | When this obligation falls due |
| `amount` | Float | Amount payable |
| `is_recurring` | Boolean | Monthly recurring vs. one-time |
| `recurrence_day` | Integer | Day of month for recurring events |
| `status` | Enum | UPCOMING / DUE_TODAY / COMPLETED / OVERDUE |

The `/api/calendar/events` endpoint dynamically generates events from live debt/bill/goal data for the next 90 days.

---

#### `expense_transactions`
Real, actual spending transactions (not just budget estimates).

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `category_id` | FK → expense_categories | Which budget bucket (nullable = uncategorized) |
| `description` | String | "Zomato dinner", "Metro card recharge" |
| `amount` | Float | Transaction amount (must be > 0, enforced by CHECK constraint) |
| `transaction_date` | DateTime | When the spending happened |
| `bill_id` | FK → bills | Linked bill if this was a bill payment (nullable) |

Indexed on `(user_id, transaction_date)` for fast monthly filtering. A **10-second deduplication window** prevents double-submission of the same description + amount.

---

#### `notifications`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `title` | String | "Bill Due Today", "Goal Deadline Approaching" |
| `message` | String | Full detail: "HDFC Card: ₹5,000 due on 15 Mar" |
| `severity` | Enum | INFO / WARNING / CRITICAL |
| `reference_type` | String | "bill", "goal", "debt" |
| `reference_id` | Integer | ID of triggering entity |
| `is_read` | Boolean | Read/unread status |

Generated daily by the `generate_notifications()` scheduler. Before creating a new notification, the system checks if one for the same `(reference_type, reference_id)` already exists today.

---

#### `net_worth_snapshots`
Daily point-in-time captures of the user's financial position.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `user_id` | FK → users | Owner |
| `total_assets` | Float | Investments + savings |
| `total_liabilities` | Float | Debt outstanding + credit card balances |
| `net_worth` | Float | Assets − liabilities |
| `investments` | Float | Total investment portfolio value |
| `savings` | Float | Liquid savings balance |
| `total_debt` | Float | Sum of all loan outstanding principals |
| `credit_outstanding` | Float | Sum of all bill outstanding balances |
| `snapshot_date` | DateTime | Date of snapshot |

Indexed on `(user_id, snapshot_date)`. Powers the "Net Worth Trend" line chart. If a snapshot already exists for today, it is updated in-place (upsert behavior).

---

### 3.2 Bill Scanner Tables (`bill-scanner/app/database/schema.py`)

#### `receipts`

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `vendor` | String | Extracted vendor/merchant name |
| `category` | String | Categorized type: "restaurant", "travel", "grocery" |
| `amount` | Float | Final payable amount |
| `date` | Date | Transaction date on the receipt |
| `raw_text` | Text | Full raw OCR text — preserved for debugging |
| `normalized_text` | Text | Cleaned, lowercased text used for embeddings |
| `vector_id` | Integer | Index of this receipt's embedding in FAISS |
| `filename` | String | Original uploaded image filename |
| `confidence_score` | Float | 0.0–1.0 based on how many fields were successfully extracted |
| `extra_data` | JSON | `{ vendor_type, warnings, similar_count }` |
| `is_verified` | Boolean | If True, used as a few-shot example for future LLM calls |

#### `vendors`
Aggregated vendor frequency counter.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `name` | String UNIQUE | Vendor name (e.g., "Zomato") |
| `vector_id` | Integer | Future: vendor-level embedding |
| `receipt_count` | Integer | How many receipts processed for this vendor |

#### `categories`
Auto-discovered category clusters from HDBSCAN clustering.

| Column | Type | What it stores |
|---|---|---|
| `id` | Integer PK | — |
| `name` | String UNIQUE | Auto-generated name from cluster keywords |
| `cluster_id` | Integer | HDBSCAN cluster label |
| `receipt_count` | Integer | Number of receipts in this cluster |
| `keywords` | JSON | Top keywords that define this category |

---

### 3.3 Vector Store (File-Based, FAISS)

Lives on disk at `/app/vector_data/`:

| File | What it stores |
|---|---|
| `receipts.index` | FAISS `IndexFlatL2` binary — all 384-dimensional receipt embeddings |
| `receipts_meta.pkl` | Python pickle — list of dicts per vector containing `{ receipt_id, normalized_text, vendor, category, amount, vector_id }` |
| `model/model.onnx` | ONNX-exported `all-MiniLM-L6-v2` sentence transformer |
| `model/tokenizer.json` | HuggingFace tokenizer config |

The vector index and metadata pickle are kept in sync: when a receipt is stored, its vector is added to FAISS and its metadata dict is appended to the pickle. The position (index) in FAISS always matches the position in the pickle list.

---

## 4. Backend Architecture (FastAPI Core)

### 4.1 Application Entry Point (`backend/app/main.py`)

- **SlowAPI rate limiting**: Keyed by remote IP address. Prevents brute-force on auth and abuse of compute-heavy forecast endpoints.
- **CORS middleware**: `allow_origins=["*"]` for the demo. Production should lock to the frontend domain.
- **Startup event**: Creates all database tables via SQLAlchemy's `Base.metadata.create_all()`, then launches 4 background jobs with a 5-second delay to allow the database to be fully ready.

### 4.2 Route Modules

| Module | Prefix | Responsibility |
|---|---|---|
| `auth.py` | `/api/auth` | Register, login, JWT token issuance, `/me` endpoint |
| `profile.py` | `/api/profile` | Income, debts, goals, expenses, overview, forecast, scenario simulation |
| `bills.py` | `/api/bills` | Bill CRUD, payment recording, cycle management |
| `calendar.py` | `/api/calendar` | Aggregated 90-day event view |
| `transactions.py` | `/api/transactions` | Actual spend transactions, monthly summaries |
| `notifications.py` | `/api/notifications` | Notification list, mark-read, mark-all-read |
| `dashboard.py` | `/api/dashboard` | Combined summary for the main dashboard page |
| `investment.py` | `/api/investment` | AI return prediction, create investment, recommendations |
| `debt.py` | `/api/debt` | EMI calculator (unauthenticated), list debts |

### 4.3 Authentication System

- **Algorithm**: HS256 JWT with `python-jose`
- **Token expiry**: 24 hours (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`)
- **Password hashing**: bcrypt via `passlib`
- **Rate limits**: Register: 10/hour per IP. Login: 20/minute per IP.
- **Auth guard**: `get_current_user` is a FastAPI dependency injected into every protected route.

```
POST /api/auth/login
  → verify bcrypt(password, stored_hash)
  → create JWT: { sub: email, exp: now+24h }
  → return { access_token, token_type: "bearer", user: {...} }

All subsequent requests:
  Authorization: Bearer <token>
  → get_current_user() decodes JWT → returns User ORM
```

### 4.4 Financial Engine (`utils/financial_engine.py`)

**`calculate_cashflow(user, db, month, year)`** — Queries actual `expense_transactions` for the given month, falls back to budget `expense_categories` if none exist. Adds up `debt.monthly_emi`, `bill.minimum_due`, and `goal.monthly_contribution_needed`. Returns: income, expenses, commitments breakdown, cashflow, cashflow_positive, expense_ratio, savings_rate.

**`calculate_net_worth(user, db)`** — Assets: `SUM(investment.amount)` + savings_balance. Liabilities: `SUM(debt.outstanding_principal)` + `SUM(bill.outstanding_balance)`. Returns: assets dict, liabilities dict, net_worth, debt_to_asset_ratio.

**`calculate_commitments(user, db)`** — All fixed monthly obligations: EMIs + bill minimums + goal contributions. Returns: total_commitments, commitment_ratio, status (healthy/warning/critical).

### 4.5 Tax Calculator (`utils/tax_calculator.py`)

Implements the **Indian New Tax Regime 2024-25** slabs:

| Income Slab | Tax Rate |
|---|---|
| Up to ₹3,00,000 | 0% |
| ₹3,00,001 – ₹6,00,000 | 5% |
| ₹6,00,001 – ₹9,00,000 | 10% |
| ₹9,00,001 – ₹12,00,000 | 15% |
| ₹12,00,001 – ₹15,00,000 | 20% |
| Above ₹15,00,000 | 30% |

Standard deduction: ₹50,000. Cess: 4% on total tax. PF = 12% of basic salary (= 50% of gross monthly). Net take-home = `gross_monthly - monthly_tax - monthly_pf`.

### 4.6 Forecasting Engine (`utils/forecasting_engine.py`)

Projects net worth over 24 months:

```
For each month:
  1. Apply annual income growth (5%) every 12 months
  2. Apply monthly investment return: investments × (10%/12)
  3. Add monthly savings to investments
  4. Reduce debt by EMI principal component (60% of EMI = principal, 40% = interest)
  5. Apply scenario modifier:
     - "missed_payment": subtract 2% late fee every 6 months
     - "salary_hike": multiply income by 1.20 at month 12
  6. net_worth = investments - debt
```

Scenario simulation runs two projections side by side — base (current state) and modified (with proposed changes) — and returns the improvement in net worth at period end.

---

## 5. Bill Scanner Service — AI Pipeline

The bill scanner is a **fully autonomous 9-stage AI pipeline** that processes a receipt image and produces structured financial data.

```
Image Upload
    │
    ▼
[Stage 1] IMAGE CLEANER
    │   cv2: detect photo vs scan
    │   → clean_photo() or clean_scan()
    │
    ▼
[Stage 2] OCR SERVICE
    │   PaddleOCR (en, angle correction, CPU)
    │   Output: raw text string
    │
    ▼
[Stage 3] TEXT NORMALIZER
    │   Two versions: normalized (for embedding) + llm_text (for LLM)
    │
    ▼
[Stage 4] EMBEDDING SERVICE
    │   ONNX MiniLM-L6-v2 → 384-dim float16 vector
    │
    ▼
[Stage 5] VECTOR STORE — Similarity Search
    │   FAISS IndexFlatL2 → top-3 similar past receipts
    │
    ▼
[Stage 6] LLM EXTRACTION (OpenRouter)
    │   Few-shot prompt built from similar receipts
    │   LLM → JSON: { vendor, amount, date, category }
    │
    ▼
[Stage 7] VENDOR & AMOUNT RESOLUTION
    │   Prefer LLM output; fallback to rule-based detector
    │
    ▼
[Stage 8] VALIDATOR + DATABASE STORE
    │   Confidence scoring, FAISS vector storage, PostgreSQL insert
    │
    ▼
[Stage 9] EXPENSE BRIDGE
    │   POST to backend /api/profile/expense-categories
    ▼
Response to user
```

### Stage 1: Image Cleaner

Detects whether the image is a photograph or a flat scan using two signals:
- **Laplacian variance**: High variance = sharp scan. Low variance = blurry photo.
- **Mean brightness**: Real photos have lower average brightness than white-paper scans.

**Photo pipeline**: Grayscale → FastNlMeansDenoising → CLAHE → gentle sharpening → Otsu thresholding.

**Scan pipeline**: Grayscale → GaussianBlur → aggressive sharpening → adaptive thresholding → deskew correction.

Small images (height < 1000px) are upscaled with `INTER_CUBIC` before any processing.

### Stage 2: OCR Service

Uses **PaddleOCR** with `use_angle_cls=True` (corrects rotated text), `lang='en'`, `use_gpu=False`. Confidence threshold: 0.5 — lines below 50% confidence are discarded. Uses pre-downloaded models:
- Detection: `en_PP-OCRv3_det_infer`
- Recognition: `en_PP-OCRv4_rec_infer`
- Classification: `ch_ppocr_mobile_v2.0_cls_infer`

All models are pre-downloaded at Docker build time to avoid initialization segfaults.

### Stage 3: Text Normalizer

**`normalize_text()`** — for semantic embedding: lowercase, remove non-alphanumeric chars except spaces/dots/colons, collapse spaces.

**`preprocess_for_llm()`** — for LLM consumption: fix OCR mistakes (`|` → `i`, standalone `l` → `1`), replace ₹ symbols with "inr", normalize date separators, expand month abbreviations, strip noise (booking IDs, order IDs, phone numbers, emails, URLs).

### Stage 4: Embedding Service

Runs **`all-MiniLM-L6-v2`** via **ONNX Runtime** locally:
1. Tokenize (max 128 tokens, padded)
2. Run ONNX session: `input_ids + attention_mask + token_type_ids → last_hidden_state`
3. Mean-pool across the sequence dimension → 384-dim vector
4. L2-normalize
5. Cast to float16 to halve storage

### Stage 5: Vector Store — Similarity Search

FAISS `IndexFlatL2` performs exact nearest-neighbor search. Returns top-k=3 most similar past receipts. A **distance < 0.8** is considered a close match.

### Stage 6: LLM Extraction (OpenRouter)

**System prompt design:**
```
You are a receipt information extraction system.
Extract: vendor, amount (final total only), date (YYYY-MM-DD), category
Rules:
- amount = FINAL total, not subtotal or tax
- ignore booking IDs, phone numbers, addresses
- if missing, use null
- Return ONLY valid JSON, no explanation.
```

**Few-shot prompting**: Before sending the receipt to the LLM, the system builds examples from past high-quality receipts by querying FAISS for semantically similar receipts with confidence_score ≥ 0.6 and distance < 0.8. The prompt becomes:
```
Here are some examples I have processed before:
--- Example 1 ---
Receipt text: [normalized text of similar receipt]
Result: { "vendor": "Zomato", "amount": 349, "date": "2026-03-15", "category": "restaurant" }

--- Now extract from this new receipt ---
Receipt text: [current receipt text]
```

**JSON parsing resilience** — three fallback parsers:
1. Direct `json.loads(text)`
2. Regex search for `{...}` block with DOTALL flag
3. Markdown code block extraction

### Stage 7: Vendor Detector & Amount Extractor (Fallbacks)

**`vendor_detector.py`**: If the LLM fails, regex patterns match the top 5 lines against known brand patterns (APSRTC, IRCTC, Zomato, Swiggy, PVR, etc.).

**`amount_extractor.py`**: Scans each line for total-related keywords ("grand total", "net payable", "amount due"). Falls back to returning the largest numeric value in the receipt.

### Stage 8: Validator + Database Store

**Confidence scoring**: Missing amount: −0.30. Missing date: −0.20. Missing/unknown vendor: −0.20. Maximum score: 1.00.

**Category resolution priority**: (1) LLM-provided category → (2) category from closest similar receipt → (3) "uncategorized".

**Storage sequence**: `db.flush()` → `store_vector()` (FAISS + pickle) → `receipt.vector_id = vector_id` → `db.commit()`.

### Stage 9: Expense Bridge

After the receipt is stored, the scanner pushes it as an expense category entry to the backend:
1. Authenticates using `FINTECH_EMAIL` / `FINTECH_PASSWORD` → gets a JWT
2. Maps category to `is_essential` and `is_fixed` flags (e.g., restaurant → essential=True, fixed=False)
3. POSTs `{ category_name: vendor, monthly_amount: amount, is_essential, is_fixed }` to `/api/profile/expense-categories`
4. If 401, clears token cache, re-authenticates, and retries once

**Result**: Every scanned receipt automatically appears in the user's expense budget tracker with zero manual input.

---

## 6. How the LLM Works in Receipt Extraction

### Model: `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter

- **120 billion parameter** transformer
- **Free tier** — zero inference cost
- **Instruction-tuned** — follows structured JSON output reliably

### What the LLM Does

The LLM performs information extraction from noisy, unstructured OCR text. For example:

```
ZOMATO FOOD DELIVERY
Order #123456789
27 FEB 2026
Food Total    280.00
GST 5%         14.00
Delivery       35.00
Grand Total   329.00
```

The LLM understands that "Grand Total 329.00" is the payable amount, "27 FEB 2026" maps to "2026-02-27", and the vendor is "Zomato". It handles Indian date formats, currency symbols, rupee amounts with commas, mixed English/Hindi labels, and OCR errors.

### LLM Limitations & Fallbacks

The LLM is accessed over a network with a 15-second timeout. Failures handled:
- **Timeout**: Return `{}` → fall through to rule-based extraction
- **HTTP errors**: Log and return `{}`
- **Bad JSON**: Three-level fallback parser
- **Wrong amount**: `safe_amount()` validates range (1 ≤ amount ≤ 1,000,000)
- **Wrong date**: `datetime.strptime` validates; falls back to regex date extraction

---

## 7. Vector Database — Local Training & Continuous Learning

### What "Local Training" Means Here

This system does **not fine-tune the MiniLM model**. Instead, it builds a **domain-specific memory** of real receipts. Every new receipt is added to this memory and makes future extractions better.

### The FAISS Index

```
FAISS Index (in memory + disk)
┌──────────────────────────────────────────────────┐
│ Vector 0: [0.12, -0.34, 0.88, ..., 0.41] (384d) │ ← Zomato receipt #1
│ Vector 1: [0.11, -0.32, 0.87, ..., 0.43] (384d) │ ← Zomato receipt #2
│ Vector 2: [0.45,  0.12, 0.23, ..., 0.71] (384d) │ ← APSRTC bus ticket
│ Vector 3: [0.44,  0.13, 0.22, ..., 0.70] (384d) │ ← Another APSRTC ticket
└──────────────────────────────────────────────────┘
```

### How It Learns Over Time

**Receipt 1 (Zomato)**: LLM extracts vendor="Zomato", amount=349, category="restaurant". Stored. Vector added to FAISS.

**Receipt 50 (another Zomato order)**: FAISS finds Receipt 1 at distance 0.12. Few-shot prompt includes Zomato as an example. Extraction is more reliable.

**Receipt 200 (a new restaurant)**: FAISS finds 3 restaurant receipts. Even though the vendor is new, the LLM gets examples of how restaurant receipt text maps to structured data.

**Over 1000 receipts**: Almost every new receipt has a close match in history. The system becomes increasingly robust to OCR variations, regional formats, and novel vendors.

### The `is_verified` Flag

When a user marks a receipt as verified (`PATCH /api/receipts/{id}/verify`), the few-shot builder **preferentially selects verified receipts** as examples — known-correct ground truth. This creates a quality feedback loop: more verified receipts → better future extraction.

### Automatic Category Discovery (HDBSCAN Clustering)

Every 6 hours, the scheduler runs a clustering job:
1. Load all vectors from FAISS into a numpy matrix
2. Run **HDBSCAN** (`min_cluster_size=5`, `min_samples=2`)
3. For each cluster, generate a category name from the most frequent meaningful words
4. Update `receipt.category` for all receipts in each cluster
5. Create/update `Category` records in the database

HDBSCAN does not require specifying the number of clusters in advance — as receipts accumulate, new categories emerge automatically.

**Example after 500 receipts:**
- Cluster 0 → keywords: ["zomato", "swiggy", "delivery", "food"] → "zomato_swiggy_delivery"
- Cluster 1 → keywords: ["pvr", "inox", "seat", "movie"] → "pvr_inox_seat"
- Cluster 2 → keywords: ["apsrtc", "tsrtc", "bus", "ticket"] → "apsrtc_tsrtc_bus"

### Why This Architecture Outperforms Rule-Based Systems

| Capability | Rule-based | Fintrix Vector System |
|---|---|---|
| New vendor | Fails — not in pattern list | Handles — clusters with similar vendors |
| OCR errors | Fails — pattern doesn't match typos | Handles — semantic similarity ignores typos |
| Regional formats | Fails — hard-coded patterns | Handles — learns from examples |
| Improves over time | No | Yes — every receipt makes it better |
| Category discovery | Manual, static | Automatic via HDBSCAN |
| Few-shot adaptation | Not possible | Yes — uses real receipts as examples |

---

## 8. Why the Receipt Scanner Is Unique vs. Competitors

Most receipt scanning apps (Expensify, Zoho Expense, etc.) use fixed OCR + template matching. If a receipt doesn't match a known template, extraction degrades or requires manual entry.

**Fintrix's differentiators:**

1. **Dual-Path Image Preprocessing** — Auto-detects photo vs. scan and applies an optimized pipeline for each. Most systems use a single pipeline regardless of image quality.

2. **Local Semantic Memory (FAISS + MiniLM)** — No competitor uses a locally stored, continuously growing semantic memory that improves extraction accuracy for the specific receipt corpus of each deployment.

3. **Dynamic Few-Shot Prompting** — The LLM prompt is constructed from real historical receipts semantically similar to the current one. This is not possible with rule-based systems.

4. **Automatic Category Discovery** — Spending categories emerge from the data itself via HDBSCAN, without any manual rule setup.

5. **Full Bidirectional Integration** — The receipt scanner pushes extracted data directly into the financial advisory backend, updating expense categories, which flows into financial health calculations and net worth snapshots.

6. **Zero-Shot Fallback Cascade** — Four-layer resilience: (1) LLM extraction, (2) semantic similarity match from FAISS, (3) keyword-based total extraction, (4) maximum-value heuristic.

---

## 9. Frontend Architecture

### Technology Stack

- **HTML5 / Vanilla JavaScript** — no React, no Vue, no build step required
- **Tailwind CSS** (CDN) — utility classes for layout
- **ECharts** (CDN) — treemap, donut, gauge, bar, line charts
- **IBM Plex Sans + IBM Plex Mono** — typography
- **Nginx** — serves static files, proxies `/api` requests to backend

### File Structure

```
frontend/
├── index.html          ← Main dashboard
├── login.html          ← Login + registration
├── settings.html       ← All profile configuration (6 tabs)
├── css/
│   ├── theme.css       ← Design tokens (CSS variables)
│   ├── main.css        ← Global reset, animations, skeleton loader
│   ├── components.css  ← Reusable UI: cards, modals, inputs, badges
│   └── dashboard.css   ← Dashboard-specific: KPI cards, charts, tables
└── js/
    ├── config.js       ← All constants: API URLs, financial thresholds
    ├── utils.js        ← formatCurrency, showToast, hideGlobalLoading
    ├── api.js          ← All HTTP calls — single class with methods per endpoint
    ├── validation.js   ← Client-side form validation
    ├── dashboard.js    ← Dashboard page logic: data loading, chart rendering
    ├── animations.js   ← Scroll reveal, navbar shrink, hero mini-stats
    └── settings/       ← One module per settings tab (ES6 modules)
        ├── income.tab.js
        ├── debts.tab.js
        ├── goals.tab.js
        ├── expenses.tab.js
        ├── bills.tab.js
        └── overview.tab.js
```

### JavaScript Architecture

**`config.js`** defines global constants: API base URLs, financial thresholds (healthy DTI < 30%, max DTI 50%, recommended savings rate 20%), and category metadata. Every other JS file reads from `CONFIG`.

**`api.js`** is the sole communication layer. The `API` class wraps `fetch()` with automatic JWT injection, HTTP 401 handling (clears token + redirects to login), and JSON parsing with error forwarding.

**`dashboard.js`** calls 5 API endpoints in parallel with `Promise.all()`, recalculates derived values, renders 10 separate UI sections, manages ECharts instances in a `this.charts` dict, and computes a health score (0–100) from savings rate + DTI + investment coverage + goals.

### Dashboard Charts

| Chart | Library | Type | Data Source |
|---|---|---|---|
| Net Worth Trend | ECharts | Line + area fill | `/api/profile/net-worth-history` |
| EMI Breakdown | ECharts | Horizontal bar | `/api/profile/debts` |
| Expense Allocation | ECharts | Treemap | `/api/profile/expense-categories` |
| Savings Goals | ECharts | Donut/pie | `/api/profile/savings-goals` |
| Financial Health | ECharts | Gauge | Computed client-side |
| Cashflow Distribution | Custom HTML | Progress bars | `/api/dashboard/` |

---

## 10. Financial Calculation Engine

### Debt-to-Income (DTI) Ratio
```
DTI = SUM(monthly EMIs) / net_monthly_income × 100

< 30%  → Healthy
30–40% → Moderate (warning)
40–50% → High Risk
> 50%  → Critical
```

### Emergency Fund Adequacy
```
minimum_required  = total_monthly_expenses × 3
recommended       = total_monthly_expenses × 6

Status: ≥ recommended → Excellent | ≥ minimum → Adequate | > 0 → Insufficient | = 0 → Missing
```

### Financial Feasibility Check
```
committed = total_expenses + total_emi
available = net_income - committed
is_feasible = (committed + required_savings + 10% buffer) ≤ net_income

If not feasible → generate 4 suggestions:
  1. Reduce expenses by shortfall amount
  2. Extend timeline
  3. Increase income
  4. Clear debts first
```

### EMI Formula
```
EMI = P × R × (1+R)^N / ((1+R)^N - 1)
Where P = principal, R = monthly interest rate, N = tenure in months
```

### Investment Return Prediction
```python
risk_rates = {
  "low":    (0.05, 0.08),
  "medium": (0.08, 0.15),
  "high":   (0.12, 0.25)
}
expected_rate = (min + max) / 2
future_value = principal × (1 + expected_rate)^years
# ±5% random variability added each year for realistic fluctuation
```

---

## 11. Scheduler & Background Jobs

APScheduler `BackgroundScheduler` runs 4 jobs at midnight UTC daily (and 5 seconds after server startup):

**Job 1: `check_overdue_bills()`** — Queries all PENDING active bills. For any bill whose `next_due_date < now`: sets status to OVERDUE, creates PAYMENT_MISSED financial event, creates LATE_FEE_ADDED financial event if `late_fee > 0`.

**Job 2: `generate_bill_cycles()`** — For every active bill where today = `billing_cycle_day`: checks if a cycle already exists for this month (idempotent), calculates `minimum_due = max(200, outstanding_balance × 5%)`, creates the `BillCycle` record.

**Job 3: `generate_notifications()`** — Per user: WARNING/CRITICAL for bills due in 0–3 days; CRITICAL for overdue bills with days-late count; WARNING for goals expiring in 0–7 days. Deduplication prevents duplicate notifications for the same entity on the same day.

**Job 4: `daily_networth_snapshot()`** — Calls `calculate_net_worth()` for each user and upserts a `NetWorthSnapshot` record.

---

## 12. API Reference — Complete Endpoint Map

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user (10/hour limit) |
| POST | `/api/auth/login` | No | Login, get JWT (20/min limit) |
| GET | `/api/auth/me` | Yes | Get current user info |

### Profile — Income
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/income` | Yes | Get income profile with breakdown |
| PUT | `/api/profile/income` | Yes | Update salary, state, additional incomes |

### Profile — Debts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/debts` | Yes | List all active debts + DTI summary |
| POST | `/api/profile/debts` | Yes | Add a new debt |
| DELETE | `/api/profile/debts/{id}` | Yes | Delete a debt |

### Profile — Savings Goals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/savings-goals` | Yes | List all goals |
| POST | `/api/profile/savings-goals` | Yes | Create a goal |
| DELETE | `/api/profile/savings-goals/{id}` | Yes | Delete a goal |

### Profile — Expenses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/expense-categories` | Yes | List categories with analysis |
| POST | `/api/profile/expense-categories` | Yes | Add category |
| DELETE | `/api/profile/expense-categories/{id}` | Yes | Delete category |

### Profile — Advanced
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/profile/financial-overview` | Yes | Full health dashboard data |
| GET | `/api/profile/forecast?scenario=normal` | Yes | 24-month net worth projection (60/min limit) |
| GET | `/api/profile/net-worth-history?days=30` | Yes | Historical snapshots |
| POST | `/api/profile/scenario/simulate` | Yes | What-if scenario comparison (30/min limit) |

### Bills
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/bills/list` | Yes | All active bills + summary |
| POST | `/api/bills/create` | Yes | Create a bill |
| POST | `/api/bills/{id}/pay` | Yes | Record a payment (5-sec dedup) |
| GET | `/api/bills/{id}/history` | Yes | Payment history for a bill |
| GET | `/api/bills/{id}/current-cycle` | Yes | Current month's cycle status |
| DELETE | `/api/bills/{id}` | Yes | Deactivate a bill |

### Calendar, Transactions, Notifications, Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/calendar/events` | Yes | Next 90 days: EMIs + bills + goals |
| POST | `/api/transactions/create` | Yes | Record an expense transaction (10-sec dedup) |
| GET | `/api/transactions/list` | Yes | List with filters + category breakdown |
| GET | `/api/transactions/monthly-summary` | Yes | Budget vs. actual by category |
| GET | `/api/notifications/` | Yes | Paginated notification list |
| POST | `/api/notifications/read/{id}` | Yes | Mark one as read |
| POST | `/api/notifications/read-all` | Yes | Mark all as read |
| GET | `/api/dashboard/` | Yes | Combined financial summary |

### Investments & Debt Calculator
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/investment/predict` | No | Predict returns |
| POST | `/api/investment/create` | Yes | Save investment record |
| GET | `/api/investment/recommendations` | Yes | AI portfolio recommendations |
| POST | `/api/debt/calculate` | No | EMI calculation |
| GET | `/api/debt/list` | Yes | List user's debts |

### Bill Scanner (Port 8001)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload receipt image → full pipeline |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{id}` | Get single receipt |
| PATCH | `/api/receipts/{id}/verify` | Mark as verified (few-shot example) |
| DELETE | `/api/receipts/{id}` | Delete a receipt |
| GET | `/api/analytics/summary` | System-wide stats |
| GET | `/api/analytics/by-category` | Receipt count by category |
| GET | `/api/analytics/by-vendor` | Top 10 vendors |
| GET | `/api/analytics/timeline` | Receipts over time |
| POST | `/api/analytics/trigger-clustering` | Run HDBSCAN clustering immediately |
| POST | `/api/chat` | Direct LLM chat endpoint |
| GET | `/api/stats` | System statistics |

---

## 13. Security Architecture

### Authentication
- Passwords stored as **bcrypt hashes** (default work factor: 12 rounds) — never plaintext
- JWTs signed with `SECRET_KEY` from environment variable — never hardcoded
- Token expiry: 24 hours

### Rate Limiting
- Auth registration: 10 attempts/hour per IP
- Auth login: 20 attempts/minute per IP
- Forecast endpoint: 60/minute
- Scenario simulation: 30/minute

### Input Validation
- Salary: ≥ ₹1,000 and ≤ ₹1,00,00,000
- EMI cannot exceed net income
- Outstanding principal cannot exceed total principal
- Transaction amount must be > 0 (CHECK constraint at DB level)
- Bill amounts, rates, and fees must be ≥ 0 (CHECK constraints at DB level)

### SQL Injection Prevention
All queries use **SQLAlchemy ORM** with parameterized queries. No raw SQL strings constructed from user input anywhere.

### Deduplication
- **Bill payments**: 5-second window on `(bill_id, amount_paid)`
- **Expense transactions**: 10-second window on `(user_id, description, amount)`
- **Bill cycles**: Check-before-insert monthly dedup

---

## 14. Docker & Infrastructure

### Services & Networking

```yaml
services:
  db:            PostgreSQL 15 Alpine — internal only
  backend:       Python 3.11-slim, port 8000, mounts ./backend/app for hot reload
  frontend:      Nginx Alpine, port 80, serves static files
  bill-scanner:  Python 3.11-slim, port 8001

networks:
  fintech-network:  bridge — all services see each other by service name
```

### Bill Scanner Dockerfile Strategy

Pre-downloads all AI models at **build time**:
```dockerfile
# PaddleOCR detection model
wget en_PP-OCRv3_det_infer.tar → /root/.paddleocr/whl/det/en/

# PaddleOCR recognition model
wget en_PP-OCRv4_rec_infer.tar → /root/.paddleocr/whl/rec/en/

# PaddleOCR angle classification model
wget ch_ppocr_mobile_v2.0_cls_infer.tar → /root/.paddleocr/whl/cls/

# MiniLM embedding model (ONNX)
# Downloaded at first use from HuggingFace, cached to /vector_data/model/
```

This prevents segfaults from PaddleOCR model downloads during Python initialization inside Docker.

### Health Checks
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U fintech_user -d fintech_db"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Backend `depends_on: db: condition: service_healthy` ensures it only starts after PostgreSQL is ready.

### Environment Variables
```env
POSTGRES_USER=fintech_user
POSTGRES_PASSWORD=securePassword123
POSTGRES_DB=fintech_db
DATABASE_URL=postgresql://fintech_user:securePassword123@db:5432/fintech_db
SECRET_KEY=<change-in-production>
BACKEND_PORT=8000
FRONTEND_PORT=80
BILL_SCANNER_PORT=8001
```

---

## 15. Data Flow Diagrams

### Flow 1: User Logs In and Views Dashboard

```
Browser                    Frontend (Nginx)         Backend (FastAPI)      PostgreSQL
   │                            │                        │                      │
   │── POST /api/auth/login ───►│── proxy to :8000 ─────►│                      │
   │                            │                        │── SELECT users ─────►│
   │                            │                        │◄── user row ─────────│
   │                            │◄── { access_token } ───│                      │
   │◄── store token in localStorage                      │                      │
   │                            │                        │                      │
   │── GET /api/dashboard/ ────►│── proxy ──────────────►│                      │
   │── GET /api/profile/debts ─►│                        │── 5 parallel ───────►│
   │── GET /api/profile/goals ─►│                        │   SELECTs            │
   │── GET /api/profile/        │                        │◄── data ─────────────│
   │       expense-categories ─►│                        │── calculate_cashflow()
   │── GET /api/calendar/ ─────►│                        │── calculate_net_worth()
   │◄── all responses ─────────│◄── JSON ───────────────│                      │
   │── ECharts renders charts   │                        │                      │
```

### Flow 2: Receipt Scan Pipeline

```
User uploads photo
        │
        ▼
POST /api/upload (bill-scanner :8001)
        │
        ├─[1]─ clean_image() → detect photo vs scan → preprocess
        ├─[2]─ run_ocr() → PaddleOCR → raw_text
        ├─[3]─ normalize_text() + preprocess_for_llm()
        ├─[4]─ embed_text() → ONNX MiniLM → 384-dim vector
        ├─[5]─ search_similar(vector) → FAISS → top-3 receipts
        ├─[6]─ build_few_shot_examples() → OpenRouter LLM API
        │           → { vendor, amount, date, category }
        ├─[7]─ resolve: LLM → fallback vendor_detector / amount_extractor
        ├─[8]─ validate() → confidence_score
        │       → INSERT receipts (PostgreSQL)
        │       → store_vector() (FAISS + pickle)
        ├─[9]─ push_receipt_to_expense()
        │           → POST /api/auth/login (backend)
        │           → POST /api/profile/expense-categories (backend)
        └──── return { vendor, amount, date, category, confidence_score }
```

### Flow 3: Daily Midnight Jobs

```
APScheduler (midnight UTC)
        ├── check_overdue_bills()
        │       → SELECT bills WHERE status=PENDING AND next_due_date < now
        │       → UPDATE bill.status = OVERDUE
        │       → INSERT financial_events (PAYMENT_MISSED, LATE_FEE_ADDED)
        ├── generate_bill_cycles()
        │       → SELECT bills WHERE billing_cycle_day = today.day
        │       → INSERT bill_cycles
        ├── generate_notifications()
        │       → Per user: bills due within 3 days → INSERT notifications
        │       → Overdue bills → INSERT notifications
        │       → Goals expiring within 7 days → INSERT notifications
        └── daily_networth_snapshot()
                → Per user: calculate_net_worth() → UPSERT net_worth_snapshots
```

---

---

# Part II — Future Integration Roadmap (v2.0)

---

## 16. The Vision: One Unified Financial OS

Today Fintrix is a **financial tracker and advisor**. After integration, it becomes a **complete personal financial operating system** with three pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FINTRIX UNIFIED PLATFORM                        │
│                                                                        │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │   FINANCIAL      │   │   AI CHARTERED   │   │  AI INVESTMENT   │   │
│  │   COMMAND CENTER │   │   ACCOUNTANT     │   │  ADVISOR         │   │
│  │  (existing)      │   │  (Simplify-Tax)  │   │  (StockMind AI)  │   │
│  │                  │   │                  │   │                  │   │
│  │ • Income/Tax     │──►│ • Tax computation│   │ • Stock signals  │   │
│  │ • Debts/EMIs     │   │ • Regime compare │◄──│ • Pattern detect │   │
│  │ • Bills/Goals    │   │ • 80C/80D/NPS    │   │ • News sentiment │   │
│  │ • Expenses       │──►│ • GST advisory   │──►│ • Portfolio mgmt │   │
│  │ • Net Worth      │   │ • Tax insights   │   │ • Risk sizing    │   │
│  │ • Receipt scan   │   │                  │   │                  │   │
│  └─────────────────┘   └──────────────────┘   └──────────────────┘   │
│           │                      │                      │              │
│           └──────────────────────┴──────────────────────┘              │
│                         Shared Intelligence Layer                      │
│          "Invest in ELSS to save ₹15,000 tax AND beat inflation"       │
└────────────────────────────────────────────────────────────────────────┘
```

The three systems share a **single user identity, single database, and single intelligence layer**. A tax event affects investment advice. An investment gain triggers a tax alert. A salary hike unlocks new investment capacity and tax optimisation opportunities — all surfaced automatically.

---

## 17. Current State vs. Future State

### Current Fintrix (v1.0)
```
Services:
  - backend (FastAPI :8000)       — financial tracking, auth, calculations
  - frontend (Nginx :80)          — dashboard + settings UI
  - bill-scanner (FastAPI :8001)  — receipt OCR + AI pipeline + FAISS

AI:
  - Rule-based investment return prediction
  - OpenRouter LLM for receipt extraction
  - FAISS + MiniLM for receipt semantic memory
  - HDBSCAN for category discovery
```

### Future Fintrix (v2.0)
```
New Services:
  - tax-service (FastAPI :8002)   — CrewAI 5-agent tax pipeline (Simplify-Tax)
  - stockmind (FastAPI :8003)     — CrewAI 7-agent investment pipeline (StockMind)

New Database Tables:
  - tax_reports, tax_year_data, tax_recommendations
  - portfolio_holdings, stock_analyses, market_watchlist
  - investment_signals, trade_plans, portfolio_snapshots

AI Upgrades:
  - 5-agent CrewAI crew for tax computation (replaces rule-based tax)
  - 7-agent CrewAI crew for stock analysis (replaces placeholder investment engine)
  - Cross-system intelligence: tax implications of investments auto-surfaced
  - Unified recommendations engine pulling from all three systems
```

---

## 18. Integration Architecture Overview

```
                           FINTRIX UNIFIED PLATFORM
                           ========================

  ┌───────────┐    JWT      ┌─────────────────────────────────────────────────┐
  │  Frontend │◄───────────►│              Backend (FastAPI :8000)            │
  │  Nginx :80│             │                                                 │
  │           │             │  /api/auth   /api/profile  /api/bills           │
  │  + NEW:   │             │  /api/tax    /api/stocks   /api/portfolio        │
  │  Tax page │             │      ▲                ▲               ▲         │
  │  Portfolio│             └──────┼────────────────┼───────────────┼─────────┘
  └───────────┘                   │  Internal HTTP  │               │
                                  │                 │               │
        ┌─────────────────────────┘                 │               │
        ▼                                           ▼               ▼
┌──────────────────┐                   ┌──────────────────┐  ┌──────────────────┐
│  Tax Service     │                   │  Bill Scanner    │  │  StockMind AI    │
│  FastAPI :8002   │                   │  FastAPI :8001   │  │  FastAPI :8003   │
│  CrewAI 5-Agent  │                   │  OCR + FAISS     │  │  CrewAI 7-Agent  │
│  Simplify-Tax    │                   │  Expense Bridge  │  │  Pattern Engine  │
└────────┬─────────┘                   └────────┬─────────┘  └────────┬─────────┘
         │                                      │                     │
         └──────────────────────────────────────┼─────────────────────┘
                                                ▼
                              ┌─────────────────────────────────┐
                              │       PostgreSQL :5432           │
                              │  existing tables + new:          │
                              │  tax_reports, portfolio_holdings │
                              │  stock_analyses, trade_plans     │
                              └─────────────────────────────────┘
```

The backend acts as the **API gateway and orchestrator**. The frontend never calls tax-service or stockmind directly — all calls go through the backend, keeping authentication centralised.

---

# Part A — Simplify-Tax Integration

## 19. What Simplify-Tax Needs From Fintrix

Simplify-Tax currently takes a raw bank statement as input. After integration, Fintrix **replaces** the bank statement with structured financial data it already has.

| Simplify-Tax Input Field | Where Fintrix Has It | Table |
|---|---|---|
| `basic_salary` | `users.gross_monthly_salary × 12` | `users` |
| `net_annual_income` | `users.net_monthly_income × 12` | `users` |
| `income_type` | `users.income_type` | `users` |
| `hra_received` | Derived: `basic_salary × HRA_RATIO` | calculated |
| `rent_paid` | `SUM(expense_categories WHERE name LIKE 'rent')` | `expense_categories` |
| `epf` | `users.pf_amount × 12` | `users` |
| `ppf` / `elss` / `health_insurance_self` / `nps_contribution` | New fields | NEW TABLE: `tax_year_data` |
| `home_loan_interest` | `SUM(interest from debts WHERE type=home_loan)` | `debts` |
| `stcg_equity` / `ltcg_equity` | From StockMind portfolio (Phase 2) | `portfolio_holdings` |

Most of the financial data Simplify-Tax needs **already lives in Fintrix's database**. The only gaps are tax-specific investment instruments and capital gains — collected via a new Tax Profile in the settings UI.

---

## 20. What Fintrix Gains From Simplify-Tax

| Simplify-Tax Output | How Fintrix Uses It |
|---|---|
| `recommended_regime` | Displayed in dashboard KPI + used to correct `users.tax_amount` |
| `total_tax` (recommended regime) | Replaces rough estimate in `users.tax_amount` |
| `net_monthly_income` (recalculated) | Updates `users.net_monthly_income` with accurate figure |
| `deductions_breakdown.sec80c.used` vs limit | "80C Gap" insight card on dashboard |
| `deductions_breakdown.sec80d.used` vs limit | Health insurance suggestion |
| `deductions_breakdown.sec80ccd1b.used` vs limit | NPS suggestion |
| `recommendations[]` | Stored in `tax_recommendations`, shown in recommendations feed |
| `tax_savings` (regime difference) | KPI: "Switch regime to save ₹X" |
| `capital_gains_detail` | Feeds back into StockMind for tax-aware planning |
| `gst_summary` | Shown for freelance/business users |
| `summary_insights[]` | Stored and shown in notification feed |

---

## 21. New Database Tables for Tax

### `tax_year_data`
Tax-specific fields that Fintrix does not already have. User fills this in Settings → Tax Profile.

```sql
CREATE TABLE tax_year_data (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER REFERENCES users(id),
    financial_year          VARCHAR(7),    -- "2024-25"
    assessment_year         VARCHAR(7),    -- "2025-26"

    -- 80C investments
    ppf_annual              FLOAT DEFAULT 0,
    elss_annual             FLOAT DEFAULT 0,
    nsc_annual              FLOAT DEFAULT 0,
    life_insurance_premium  FLOAT DEFAULT 0,
    tuition_fees            FLOAT DEFAULT 0,
    home_loan_principal     FLOAT DEFAULT 0,

    -- 80D
    health_insurance_self   FLOAT DEFAULT 0,
    health_insurance_parents FLOAT DEFAULT 0,
    parents_senior_citizen  BOOLEAN DEFAULT FALSE,

    -- 80CCD(1B)
    nps_contribution        FLOAT DEFAULT 0,

    -- Other income
    interest_income_annual  FLOAT DEFAULT 0,
    dividend_income_annual  FLOAT DEFAULT 0,
    freelance_income_annual FLOAT DEFAULT 0,
    agricultural_income     FLOAT DEFAULT 0,

    -- Capital gains (populated from StockMind after equity integration)
    stcg_equity             FLOAT DEFAULT 0,
    ltcg_equity             FLOAT DEFAULT 0,
    stcg_property           FLOAT DEFAULT 0,
    ltcg_property           FLOAT DEFAULT 0,
    capital_losses          FLOAT DEFAULT 0,

    -- GST (for freelance/business users)
    annual_turnover         FLOAT DEFAULT 0,
    gst_output_collected    FLOAT DEFAULT 0,
    gst_input_tax_credit    FLOAT DEFAULT 0,

    -- Flags
    is_presumptive_44ad     BOOLEAN DEFAULT FALSE,
    is_presumptive_44ada    BOOLEAN DEFAULT FALSE,
    is_self_occupied_house  BOOLEAN DEFAULT TRUE,

    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, financial_year)
);
```

### `tax_reports`
Full output from each Simplify-Tax computation run.

```sql
CREATE TABLE tax_reports (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER REFERENCES users(id),
    financial_year          VARCHAR(7),
    assessment_year         VARCHAR(7),
    recommended_regime      VARCHAR(20),
    tax_savings             FLOAT,
    old_taxable_income      FLOAT,
    old_total_deductions    FLOAT,
    old_total_tax           FLOAT,
    old_effective_rate      FLOAT,
    new_taxable_income      FLOAT,
    new_total_deductions    FLOAT,
    new_total_tax           FLOAT,
    new_effective_rate      FLOAT,
    total_capital_gains_tax FLOAT,
    gst_registration_required BOOLEAN,
    net_gst_payable         FLOAT,
    full_report_json        JSONB,
    summary_insights        JSONB,
    generated_at            TIMESTAMP DEFAULT NOW(),
    generation_duration_ms  INTEGER
);
```

### `tax_recommendations`
Individual tax saving recommendations extracted from Simplify-Tax output.

```sql
CREATE TABLE tax_recommendations (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER REFERENCES users(id),
    tax_report_id     INTEGER REFERENCES tax_reports(id),
    financial_year    VARCHAR(7),
    section           VARCHAR(20),       -- "80C", "80D", "NPS", "HRA"
    message           TEXT,
    current_amount    FLOAT,
    max_allowed       FLOAT,
    potential_saving  FLOAT,
    is_actioned       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 22. API Changes for Tax Integration

### New Backend Endpoints (`:8000`)

```
GET  /api/tax/year-data                    — Get user's tax profile for current FY
PUT  /api/tax/year-data                    — Update tax profile (PPF, ELSS, NPS amounts)
POST /api/tax/generate-report              — Trigger Simplify-Tax crew, store result
GET  /api/tax/reports                      — List all past tax reports
GET  /api/tax/reports/latest               — Get most recent tax report
GET  /api/tax/recommendations              — List tax saving recommendations
POST /api/tax/recommendations/{id}/action  — Mark a recommendation as actioned
GET  /api/tax/regime-comparison            — Quick old vs new comparison
```

### Input Contract Change: Tax Service (`:8002`)

**Before (standalone — accepts raw bank statement):**
```json
{
  "user_name": "string",
  "age": 35,
  "profession": "Software Engineer",
  "bank_statement": "raw text blob..."
}
```

**After (integrated — structured data replaces bank statement):**
```json
{
  "user_name": "string",
  "age": 35,
  "profession": "Software Engineer",
  "financial_data": {
    "basic_salary": 1200000,
    "hra_received": 240000,
    "rent_paid": 180000,
    "epf": 86400,
    "ppf": 60000,
    "elss": 50000,
    "health_insurance_self": 18000,
    "nps_contribution": 50000,
    "home_loan_interest": 180000,
    "interest_income": 12000,
    "stcg_equity": 45000,
    "ltcg_equity": 120000
  }
}
```

Agent 1's role changes from "expert at reading bank statements" to "expert at validating and completing financial data schemas." Agents 2–5 work identically.

---

## 23. Data Flows: Fintrix ↔ Simplify-Tax

### Fintrix → Simplify-Tax

```
User clicks "Generate Tax Report"
            │
            ▼
POST /api/tax/generate-report  (backend :8000)
            │
            ├── Query users: basic_salary, net_monthly_income, income_type, pf_amount
            ├── Query debts WHERE debt_type = 'home_loan' → estimate annual home_loan_interest
            ├── Query expense_categories WHERE name ILIKE '%rent%' → rent_paid (monthly × 12)
            ├── Query tax_year_data: ppf, elss, health_insurance_self, nps_contribution, stcg, ltcg
            ├── [If StockMind integrated] Query portfolio_holdings → calculate realized STCG/LTCG
            └── POST http://tax-service:8002/generate-tax-summary
                        │
                        ▼
        ┌─────────────────────────────────────────┐
        │         Simplify-Tax CrewAI Crew         │
        │  Agent 1: Validate & normalise fields    │
        │  Agent 2: Classify income correctly      │
        │  Agent 3: Fill deduction fields          │
        │  Agent 4: Call deterministic_tax_calc    │
        │  Agent 5: Generate insight strings       │
        └──────────────────┬──────────────────────┘
                           ▼
                    Tax Report JSON
```

### Simplify-Tax → Fintrix

```
Tax Report JSON received by backend
            │
            ├── INSERT INTO tax_reports
            ├── INSERT INTO tax_recommendations (each item from recommendations[])
            ├── UPDATE users SET
            │     tax_amount = report.total_tax / 12,
            │     net_monthly_income = accurate recalculated value
            ├── INSERT INTO notifications (high-priority recommendations)
            │     title: "Tax Saving Opportunity"
            ├── INSERT INTO financial_events (TAX_REPORT_GENERATED)
            └── UPSERT net_worth_snapshots (income changed → net worth changes)
```

### Impact on Existing Dashboard After Tax Report

| Dashboard Metric | Before | After |
|---|---|---|
| Net Monthly Income KPI | Rough 75% estimate | Accurate tax-engine computed value |
| Tax deduction | Rough estimate | Accurate per Indian slabs + deductions |
| Financial health score | Partially accurate | Accurate (savings rate is correct) |
| Notifications | None about tax | "Switch to Old Regime to save ₹18,000" |
| Recommendations | Generic advice | Specific: "Invest ₹32,000 more in 80C" |

---

## 24. Frontend Changes for Tax

### New Page: `tax.html` (3 tabs)

**Tab 1: Tax Profile** — Form for PPF contributions, ELSS investments, health insurance premium, NPS additional contribution, life insurance premium, NSC / tax-saving FD. Saved to `tax_year_data` via `PUT /api/tax/year-data`.

**Tab 2: Tax Report** — After clicking "Generate Report" (triggers the 5-agent CrewAI run): Old Regime vs New Regime comparison card, recommended regime with potential savings, income breakdown (salary, capital gains, other sources), deductions utilised vs limits (progress bars), effective tax rate.

**Tab 3: Tax Recommendations** — Each recommendation card shows section (80C, 80D, NPS), current amount vs maximum limit, potential tax saving, and a "Mark as Done" button.

### Dashboard Changes

A new **"Tax Saved"** KPI card shows the difference between regimes in the chosen regime's favor. A tax section in the insight strip: "80C underutilised by ₹32,000 — invest before 31 March."

---

# Part B — StockMind AI Integration

## 25. What StockMind Needs From Fintrix

| StockMind Input | Where Fintrix Has It |
|---|---|
| `investment_amount` | Monthly investable = `calculate_cashflow().cashflow` |
| `risk_profile` | `users.risk_tolerance` (low/medium/high → conservative/moderate/aggressive) |
| `existing_portfolio` | NEW: `portfolio_holdings` table |
| `goals_timeline` | `savings_goals.target_date` — how long until money is needed |
| `tax_bracket` | From `tax_reports.effective_rate` (if report exists) |

---

## 26. What Fintrix Gains From StockMind

| StockMind Output | How Fintrix Uses It |
|---|---|
| `signal.label` (BUY/SELL/HOLD) | Displayed on portfolio holding card |
| `trade_plan` (entry, stop, target) | "Active Trade Plans" section |
| `patterns_detected[]` | Chart pattern badges on holding cards |
| `sentiment.aggregate_score` | News sentiment indicator per stock |
| `trade_plan.capital_at_risk` | Added to risk tracking in dashboard |
| `report.key_drivers[]` | Investment rationale shown to user |
| `report.risks[]` | Risk warnings shown to user |
| Realized P&L from closed trades | → `tax_year_data.stcg_equity` / `ltcg_equity` (auto-updated) |

---

## 27. New Database Tables for Investments

### `portfolio_holdings`

```sql
CREATE TABLE portfolio_holdings (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id),
    ticker              VARCHAR(20),      -- "RELIANCE.NS", "TCS.NS"
    exchange            VARCHAR(10),      -- "NSE", "BSE"
    company_name        VARCHAR(200),
    quantity            INTEGER,
    avg_buy_price       FLOAT,
    current_price       FLOAT,           -- updated from yfinance
    current_value       FLOAT,           -- quantity × current_price
    invested_amount     FLOAT,
    unrealized_pnl      FLOAT,
    unrealized_pnl_pct  FLOAT,
    buy_date            DATE,
    holding_period_days INTEGER,
    last_signal         VARCHAR(20),     -- "BUY", "HOLD", "SELL", "STRONG SELL"
    last_signal_date    TIMESTAMP,
    last_analysis_id    INTEGER,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### `stock_analyses`

```sql
CREATE TABLE stock_analyses (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER REFERENCES users(id),
    ticker                  VARCHAR(20),
    fused_score             FLOAT,
    signal_label            VARCHAR(20),
    conviction              VARCHAR(20),
    patterns_detected       JSONB,
    pattern_score           FLOAT,
    sentiment_score         FLOAT,
    dominant_theme          VARCHAR(50),
    market_mood             VARCHAR(20),
    macro_score             FLOAT,
    rsi_14                  FLOAT,
    macd_signal             VARCHAR(30),
    ema_trend               VARCHAR(30),
    entry_low               FLOAT,
    entry_high              FLOAT,
    stop_loss               FLOAT,
    target_1                FLOAT,
    target_2                FLOAT,
    risk_reward_ratio       FLOAT,
    position_size_units     INTEGER,
    capital_at_risk_pct     FLOAT,
    executive_summary       TEXT,
    key_drivers             JSONB,
    risks                   JSONB,
    summary_insights        JSONB,
    full_report_json        JSONB,
    analysed_at             TIMESTAMP DEFAULT NOW(),
    generation_duration_ms  INTEGER
);
```

### `market_watchlist`

```sql
CREATE TABLE market_watchlist (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    ticker          VARCHAR(20),
    company_name    VARCHAR(200),
    target_buy_price FLOAT,
    notes           TEXT,
    added_at        TIMESTAMP DEFAULT NOW()
);
```

### `trade_history`

```sql
CREATE TABLE trade_history (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id),
    ticker              VARCHAR(20),
    buy_date            DATE,
    sell_date           DATE,
    quantity            INTEGER,
    buy_price           FLOAT,
    sell_price          FLOAT,
    realized_pnl        FLOAT,
    holding_period_days INTEGER,
    is_stcg             BOOLEAN,          -- < 365 days
    is_ltcg             BOOLEAN,          -- ≥ 365 days
    stcg_tax_applicable FLOAT,            -- realized_pnl × 15% if STCG
    ltcg_tax_applicable FLOAT,            -- (realized_pnl - 1L exemption) × 10% if LTCG
    created_at          TIMESTAMP DEFAULT NOW()
);
```

### `portfolio_snapshots`

```sql
CREATE TABLE portfolio_snapshots (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id),
    total_invested      FLOAT,
    current_value       FLOAT,
    unrealized_pnl      FLOAT,
    unrealized_pnl_pct  FLOAT,
    number_of_holdings  INTEGER,
    snapshot_date       DATE,
    UNIQUE(user_id, snapshot_date)
);
```

---

## 28. API Changes for Investment Integration

### New Backend Endpoints (`:8000`)

```
-- Portfolio Management
GET    /api/portfolio/holdings                 — List all holdings
POST   /api/portfolio/holdings                 — Add a holding (buy)
PUT    /api/portfolio/holdings/{id}            — Update holding
DELETE /api/portfolio/holdings/{id}            — Remove holding (sold)
GET    /api/portfolio/summary                  — Total value, P&L, allocation

-- StockMind Analysis
POST   /api/portfolio/analyse/{ticker}         — Trigger StockMind 7-agent crew
GET    /api/portfolio/analyses/{ticker}        — Get past analyses for a ticker
GET    /api/portfolio/analyses/latest          — Latest analysis per holding

-- Watchlist
GET    /api/portfolio/watchlist                — Get watchlist
POST   /api/portfolio/watchlist                — Add to watchlist
DELETE /api/portfolio/watchlist/{id}           — Remove from watchlist
POST   /api/portfolio/watchlist/{id}/analyse   — Analyse a watchlist stock

-- Trade History & Tax
GET    /api/portfolio/trades                   — List all closed trades
POST   /api/portfolio/trades                   — Record a closed trade
GET    /api/portfolio/tax-summary              — Realized STCG/LTCG this FY
GET    /api/portfolio/snapshots                — Historical portfolio value
```

### Internal Call: Backend → StockMind

When frontend calls `POST /api/portfolio/analyse/RELIANCE.NS`, backend:
1. Reads `risk_tolerance` and monthly investable cashflow from Fintrix data
2. If a tax report exists: reads the user's tax bracket from `tax_reports`
3. POSTs to `http://stockmind:8003/generate-investment-report`:
```json
{
  "ticker": "RELIANCE.NS",
  "period_days": 90,
  "risk_profile": "moderate",
  "investment_amount": 75000,
  "tax_bracket_pct": 20
}
```
4. Receives 7-agent analysis, stores in `stock_analyses`
5. Updates `portfolio_holdings.last_signal` if user holds this stock
6. Creates notification if signal is STRONG BUY or STRONG SELL

---

## 29. Data Flow: Fintrix ↔ StockMind AI

```
User clicks "Analyse" on RELIANCE.NS
            │
POST /api/portfolio/analyse/RELIANCE.NS  (backend :8000)
            │
            ├── Read user.risk_tolerance = "moderate"
            ├── Read cashflow.cashflow = ₹18,500
            ├── Read tax_reports → effective_rate = 20%
            └── POST http://stockmind:8003/generate-investment-report
                        │
                        ▼
            ┌───────────────────────────────────────────┐
            │         StockMind CrewAI Crew              │
            │  Pre-fetch: OHLCV + news + macro data     │
            │  Agent 1: Market Data Analyst             │
            │  Agent 2: Pattern Detective               │
            │  Agent 3: News Sentiment                  │
            │  Agent 4: Macro Context Analyst           │
            │  Agent 5: Signal Fusion                   │
            │  Agent 6: Risk Advisor                    │
            │  Agent 7: Report Writer                   │
            └────────────────┬──────────────────────────┘
                             ▼
                    Full Investment Report JSON
                             │
            ├── INSERT INTO stock_analyses
            ├── UPDATE portfolio_holdings.last_signal
            ├── INSERT INTO notifications (if strong signal)
            └── Return analysis to frontend

─────────────── TRADE CLOSURE → TAX FLOW ────────────────────

User records closed trade via POST /api/portfolio/trades
            │
            ├── Calculate holding_period_days
            ├── Classify as STCG (< 365 days) or LTCG (≥ 365 days)
            └── UPDATE tax_year_data SET
                  stcg_equity += realized_pnl  (if STCG)
                  ltcg_equity += realized_pnl  (if LTCG)

            → If total LTCG > ₹1,00,000:
                INSERT notifications: "LTCG Exemption Exceeded — ₹X taxed at 10%"
```

---

## 30. Frontend Changes for Investments

### New Page: `portfolio.html` (4 sections)

**Section 1: Portfolio Summary Bar** — Total invested, current value, total P&L (₹ and %), today's change, number of holdings, XIRR.

**Section 2: Holdings Grid** — Each holding card shows: ticker, quantity, avg buy price, current price, P&L (green/red with %), holding period + STCG/LTCG label, last StockMind signal badge, and "Analyse Now" button.

**Section 3: Active Analysis Cards** — Signal (large BUY/SELL/HOLD with color), top 2 key drivers, entry zone/stop-loss/targets with visual diagram, risk in ₹ and %, risk/reward ratio.

**Section 4: Watchlist + Trade History** — Stocks being tracked with target price alerts. Closed trades table with realized P&L. Cumulative STCG and LTCG this FY. Warning if approaching LTCG exemption threshold.

### Dashboard Changes

"Total Investments" KPI upgrades from a static number to **live portfolio value** with a mini-sparkline. A new "Portfolio Insight" action card shows the highest-conviction signal from recent StockMind analyses.

---

# Part C — Cross-System Intelligence

## 31. Tax-Aware Investment Recommendations

The unique value that emerges from having all three systems integrated. Neither Simplify-Tax nor StockMind alone can generate these insights.

### Examples of Cross-System Insights

**Insight 1: ELSS > Fixed Deposit**
```
Fintrix: 80C utilised ₹68,000 (gap of ₹82,000)
StockMind: Market is in uptrend, medium-high conviction BUY
Tax: User is in 20% tax bracket

→ "Investing ₹82,000 in ELSS saves ₹16,400 in tax AND gives equity
   market exposure. NIFTY trend is currently positive."
```

**Insight 2: Tax-Loss Harvesting**
```
Trade history: STOCK-A holding at -₹24,000 unrealized loss
Tax: LTCG this year = ₹95,000 (just below ₹1L exemption)
StockMind: STOCK-A signal is SELL

→ "STOCK-A is down ₹24,000 and shows a Sell signal. Booking this
   loss now reduces your capital gains tax by ₹3,600. Consider exiting."
```

**Insight 3: NPS vs EMI Prepayment**
```
Fintrix: surplus of ₹8,500/month
Tax: 80CCD(1B) NPS gap = ₹50,000/year (₹4,167/month)
Debt: Home loan at 9.1% with ₹18L outstanding

→ "Option A: ₹4,167/month NPS saves ₹833 tax monthly.
   Option B: Prepay home loan — saves ₹1,380/month in interest.
   Option B gives better returns at your 20% tax bracket."
```

**Insight 4: Salary Hike + Regime Switch**
```
User updates income from ₹10L to ₹14L annual
Tax: regime recommendation flips from Old to New
StockMind: detects higher investable surplus

→ "Your salary hike changes the optimal tax regime. New Regime
   now saves ₹22,000. Monthly investable capacity increases by
   ₹6,800 — consider increasing your SIP."
```

## The Unified Intelligence Layer

A new `cross_system_advisor.py` module runs after relevant API calls:

```python
class CrossSystemAdvisor:
    def run_after_income_update(self):
        # Recalculate tax with new income
        # Check if regime recommendation changes
        # Update notifications if regime flips
        # Recalculate investable surplus
        # Update StockMind risk profile if surplus changes significantly

    def run_after_trade_closed(self, trade: TradeHistory):
        # Update tax_year_data capital gains
        # Check LTCG exemption threshold
        # Check if loss can offset other gains
        # Create tax notifications

    def run_after_tax_report(self, report: TaxReport):
        # Update users.tax_amount with accurate figure
        # Update users.net_monthly_income
        # Find 80C/80D/NPS gaps
        # For each gap: check if there's a matching investment vehicle
        # Create cross-system recommendations
```

### Trigger Events

| Event | Cross-System Check |
|---|---|
| Income updated | Re-run tax estimate, check if regime changes, update investable surplus |
| Trade closed | Update capital gains, check LTCG exemption, notify if threshold crossed |
| Tax report generated | Update net income everywhere, check 80C gap, surface investment suggestions |
| New debt added | Recalculate investable surplus, reduce recommended investment size |
| Goal deadline approaching | Check if partial portfolio liquidation would help |
| StockMind SELL signal on held stock | Check if booking loss is tax-efficient |
| 80C gap detected | Search StockMind for ELSS fund analyses to recommend |

---

## 32. Updated Docker Architecture

```yaml
services:
  db:
    image: postgres:15-alpine
    # unchanged

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      TAX_SERVICE_URL: http://tax-service:8002        # NEW
      STOCKMIND_URL: http://stockmind:8003             # NEW
    depends_on:
      db: { condition: service_healthy }
      tax-service: { condition: service_healthy }      # NEW
      stockmind: { condition: service_healthy }        # NEW

  frontend:
    build: ./frontend
    ports: ["80:80"]
    # unchanged

  bill-scanner:
    build: ./bill-scanner
    ports: ["8001:8001"]
    # unchanged

  # NEW: Simplify-Tax service
  tax-service:
    build: ./tax-service
    container_name: fintrix-tax
    ports: ["${TAX_SERVICE_PORT}:8002"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    networks: [fintech-network]
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8002/health || exit 1"]
      interval: 30s

  # NEW: StockMind AI service
  stockmind:
    build: ./stockmind
    container_name: fintrix-stockmind
    ports: ["${STOCKMIND_PORT}:8003"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      NEWSAPI_KEY: ${NEWSAPI_KEY}
    networks: [fintech-network]
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8003/health || exit 1"]
      interval: 30s

networks:
  fintech-network:
    driver: bridge
```

### New Environment Variables
```env
TAX_SERVICE_PORT=8002
STOCKMIND_PORT=8003
TAX_SERVICE_URL=http://tax-service:8002
STOCKMIND_URL=http://stockmind:8003
OPENROUTER_API_KEY=sk-or-v1-...
NEWSAPI_KEY=your_newsapi_key_here
```

---

## 33. Updated Database Schema Map

```
PostgreSQL (all tables, unified)
├── EXISTING TABLES (unchanged)
│   ├── users                    — core user profile (tax_amount now = accurate after Phase 1)
│   ├── additional_incomes
│   ├── debts
│   ├── savings_goals
│   ├── expense_categories
│   ├── investments              — coexists with portfolio_holdings (legacy)
│   ├── bills, bill_cycles, bill_payments
│   ├── financial_events         — gains new event types:
│   │                              TAX_REPORT_GENERATED, TRADE_CLOSED, SIGNAL_GENERATED
│   ├── financial_calendar
│   ├── expense_transactions
│   ├── notifications            — gains tax and stock signal notifications
│   └── net_worth_snapshots      — now includes portfolio value separately
│
├── TAX TABLES (Phase 1 — Simplify-Tax)
│   ├── tax_year_data            — PPF, ELSS, NPS, health insurance, capital gains
│   ├── tax_reports              — full Simplify-Tax computation results
│   └── tax_recommendations      — per-section saving recommendations
│
└── INVESTMENT TABLES (Phase 2 — StockMind)
    ├── portfolio_holdings       — current equity positions
    ├── stock_analyses           — full StockMind analysis per ticker per run
    ├── market_watchlist         — stocks being tracked
    ├── trade_history            — closed trades with realized P&L
    └── portfolio_snapshots      — daily portfolio value history
```

### New EventTypes for `financial_events`

```python
class EventType(enum.Enum):
    # Existing types (unchanged)
    PAYMENT_MADE = "payment_made"
    PAYMENT_MISSED = "payment_missed"
    LATE_FEE_ADDED = "late_fee_added"
    GOAL_ACHIEVED = "goal_achieved"
    # ... all existing types ...

    # New: Tax
    TAX_REPORT_GENERATED = "tax_report_generated"
    TAX_REGIME_CHANGED = "tax_regime_changed"
    TAX_RECOMMENDATION_ACTIONED = "tax_recommendation_actioned"

    # New: Investments
    STOCK_BOUGHT = "stock_bought"
    STOCK_SOLD = "stock_sold"
    TRADE_CLOSED = "trade_closed"
    INVESTMENT_SIGNAL_GENERATED = "investment_signal_generated"
    LTCG_THRESHOLD_CROSSED = "ltcg_threshold_crossed"
    PORTFOLIO_ANALYSED = "portfolio_analysed"
```

---

## 34. Phase-by-Phase Rollout Plan

### Phase 1 — Simplify-Tax Integration (4–6 weeks)

**Week 1–2: Infrastructure**
- Add `tax-service` to docker-compose
- Create `tax_year_data`, `tax_reports`, `tax_recommendations` tables via Alembic migration
- Add `TAX_SERVICE_URL` to backend env

**Week 3–4: Backend API**
- Implement `GET/PUT /api/tax/year-data`
- Implement `POST /api/tax/generate-report` (proxy + store)
- Implement `GET /api/tax/reports`, `/recommendations`
- Modify Simplify-Tax Agent 1 to accept structured JSON input
- Implement cross-system income update: after tax report, update `users.tax_amount`

**Week 5–6: Frontend**
- Build `tax.html` (3 tabs: Tax Profile, Report, Recommendations)
- Add Tax KPI card to dashboard
- Add tax insight to insight strip

**Deliverable:** Users can generate a complete Indian tax analysis from within Fintrix with financial data auto-populated. Net income on the dashboard becomes accurate.

---

### Phase 2 — StockMind AI Integration (5–7 weeks)

**Week 1–2: Infrastructure**
- Add `stockmind` to docker-compose
- Create `portfolio_holdings`, `stock_analyses`, `market_watchlist`, `trade_history`, `portfolio_snapshots` tables
- Add `STOCKMIND_URL`, `NEWSAPI_KEY` to env

**Week 3–4: Backend API**
- Implement portfolio CRUD (`/api/portfolio/holdings`)
- Implement `POST /api/portfolio/analyse/{ticker}` (proxy + store)
- Implement trade history and tax impact endpoints
- Connect trade closure to `tax_year_data` capital gains update
- Extend existing `daily_networth_snapshot` to include portfolio snapshots

**Week 5–6: Frontend**
- Build `portfolio.html` (4 sections)
- Add portfolio value to Net Worth KPI on dashboard
- Add portfolio sparkline to "Total Investments" KPI card
- Add StockMind signal badges to holding cards

**Week 7: Testing**
- Full flow: add holding → trigger analysis → view signal → record sale → see tax impact
- LTCG threshold notification
- Signal notification (STRONG SELL on held stock)

**Deliverable:** Users can track their equity portfolio, get 7-agent AI analysis on any stock, and see the tax impact of trades — all within Fintrix.

---

### Phase 3 — Cross-System Intelligence (2–3 weeks)

**Week 1–2: Intelligence Layer**
- Implement `cross_system_advisor.py`
- Hook into `run_after_income_update()`, `run_after_trade_closed()`, `run_after_tax_report()`
- Implement tax-aware investment recommendations (80C gap → ELSS suggestion)
- Implement tax-loss harvesting alert logic
- Implement NPS vs EMI prepayment comparison

**Week 3: Frontend Integration**
- Surface cross-system insights in notification feed
- Add "Tax Impact" column to portfolio trade history
- Add "Tax-Efficient Investing" section to tax recommendations

**Deliverable:** The three systems behave as one coherent financial advisor, generating insights that none of them could produce alone.

---

## 35. Breaking Changes & Backward Compatibility

### What Does NOT Change for Existing Users

- Login, registration, JWT tokens — unchanged
- All existing dashboard data — unchanged
- Debt, bill, expense, goal management — unchanged
- Receipt scanner — unchanged
- All existing API endpoints — fully backward-compatible

### What Changes for Existing Users

| Change | Impact | Mitigation |
|---|---|---|
| `users.tax_amount` becomes accurate after first tax report | Net income KPI changes | Label as "estimated" before report, "calculated" after |
| "Total Investments" KPI switches to `portfolio_holdings` if holdings exist | Value may differ | Show both if both have data |
| New notification types appear | Users see more notifications | New notifications are INFO severity by default |
| `financial_events` EventType enum gains new values | No impact on existing queries | SQLAlchemy ignores unknown enum values |

### API Versioning

No API versioning is needed. All new capabilities are in new endpoints (`/api/tax/*`, `/api/portfolio/*`). Existing endpoints at `/api/profile/*`, `/api/bills/*`, etc. remain identical.

### Migration: Deprecating the Old `investments` Table

The existing basic `investments` table coexists with `portfolio_holdings`. The dashboard's "Total Investments" KPI switches from `SUM(investments.amount)` to `SUM(portfolio_holdings.current_value)` when any holdings exist, with fallback to the old table if empty. The old table is never deleted — it stays for users who entered data before StockMind integration.

---

## Summary: The Complete Fintrix Platform

### Current Closed Loop (v1.0)

1. The **bill scanner** physically reads spending from the real world (receipts)
2. It automatically feeds that data into the **backend** as expense categories
3. The **backend** incorporates that data into financial health calculations, DTI ratios, cashflow analysis, and net worth tracking
4. The **frontend dashboard** presents all of this as a unified financial intelligence picture
5. The **scheduler** continuously updates, alerts, and snapshots the financial state
6. The **vector database** makes the receipt scanner smarter with every new receipt processed

### Expanded Closed Loop (v2.0)

After full integration, a user's journey through Fintrix:

1. **Register** → Enter income, debts, bills, goals
2. **Dashboard** → Financial health, cashflow, net worth, upcoming payments
3. **Scan receipts** → Bills auto-categorized into expense tracker
4. **Tax Profile** → Enter PPF, ELSS, NPS amounts (5 minutes)
5. **Generate Tax Report** → CrewAI 5-agent run → accurate tax, regime recommendation, 80C gaps
6. **Portfolio** → Add stock holdings → trigger StockMind analysis per stock
7. **StockMind Signal** → BUY/SELL/HOLD with entry zone, stop-loss, targets, rationale
8. **Close a trade** → P&L auto-classified as STCG/LTCG → `tax_year_data` auto-updated
9. **Cross-system notification** → "Your LTCG is ₹92,000 — consider ₹8,000 more LTCG before March 31 to stay under ₹1L exemption"
10. **Annual cycle** → New FY → Generate updated tax report → new regime recommendation → investment strategy adjusts

The result is a personal financial operating system where **income tracking, tax planning, and investment decision-making are not three separate tools — they are one coherent, interconnected intelligence.**

---

*Document version 2.0 — Combined architecture reference*
*Covers: Fintrix v1.0 (present) + Fintrix v2.0 Integration Roadmap (future)*
*Systems: Fintrix Core · Simplify-Tax (5-agent CrewAI) · StockMind AI (7-agent CrewAI)*
*Assessment Year: 2025-26 (FY 2024-25)*