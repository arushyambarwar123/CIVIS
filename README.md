# CIVIS Lite — Intelligent Monitoring Prototype

A proof-of-concept centralized monitoring and verification system for a government **Employability Development / Skill Training Scheme**.

> **This is a demo prototype. All data is synthetic. No real government records are involved.**

---

## What It Does

CIVIS Lite brings together monitoring data from training centres, batches, beneficiaries, attendance, evidence photos, placements, and payments — and automatically cross-verifies them to:

1. **Detect anomalies** — perfect attendance patterns, impossible travel, duplicate evidence photos, pre-completion placements, suspicious payments
2. **Match beneficiaries** — find potential duplicate enrolments via name similarity + shared mobile/bank tokens  
3. **Calculate explainable risk scores** — every score shows which factors contributed and by how much
4. **Prioritise physical inspections** — composite score of risk × inspection age × critical anomaly count
5. **Track corrective actions** — overdue action highlighting, status workflow

> **The system does NOT declare fraud.** It only flags anomalies for human review. Final action remains a human decision.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · SQLAlchemy · SQLite |
| Frontend | Next.js 16 · React · Tailwind CSS · TypeScript |
| Analysis | Custom rule engines (configurable JSON weights) |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (portable version included in `scratch/nodejs/` if not installed)

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python seed_data.py        # Seeds 20 centres, 450 beneficiaries, Centre 07 anomaly profile
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at **http://localhost:8000** · API docs at **http://localhost:8000/docs**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 3. Or use the one-click launcher

Double-click **`START.bat`** — launches both servers in separate terminal windows.

---

## Demo Showcase — Centre TC-MH-007

The seed data pre-loads **Centre TC-MH-007** with a **CRITICAL risk score of 89/100** and 6 seeded anomalies:

| Anomaly | Description |
|---------|-------------|
| Perfect attendance | 50 beneficiaries × 21 days, all checked in at exactly 09:00:00 |
| Duplicate enrolment | 12 beneficiaries enrolled in two simultaneously active batches |
| Trainer conflict | Same trainer assigned to two centres at the same time |
| Duplicate evidence | 3 monitoring photos with identical perceptual hash `aabbccdd11223344` |
| Pre-completion placements | 8 placements recorded before batch end date (2026-09-30) |
| Inspection overdue | 470+ days since last physical inspection |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPIs, risk distribution, recent anomalies, top priorities |
| `/centres` | All training centres with risk badges and filters |
| `/centres/[id]` | 360° centre profile — risk breakdown, anomalies, batches, inspection assignment |
| `/anomalies` | All anomalies with severity filter and status update panel |
| `/risk` | Explainable risk scores grouped by severity |
| `/matching` | Beneficiary deduplication — conflicts, high confidence matches |
| `/priority` | Inspection priority queue with random sampling |
| `/inspections` | Inspector checklist and submit form |
| `/corrective-actions` | Action tracking with overdue highlighting |
| `/evidence` | Duplicate photo detection via perceptual hash |
| `/settings` | Live JSON rule editor for all 5 config files |
| `/demo` | Data simulator — 5 engine buttons + 7 anomaly injectors + DB reset |

---

## Project Structure

```
civis-lite/
  START.bat                    # One-click launcher
  backend/
    requirements.txt
    seed_data.py               # Comprehensive idempotent seeder
    app/
      main.py                  # FastAPI app, all routers registered
      database.py              # SQLite + SQLAlchemy setup
      models/                  # 13 SQLAlchemy models
      api/                     # 17 API router modules
      services/                # 8 analysis engine services
      config/                  # 5 editable JSON rule files
  frontend/
    app/                       # Next.js App Router pages
    src/
      components/layout/       # Sidebar, AppLayout
      components/ui/           # RiskBadge, AnomalyCard, MetricCard, ...
      lib/api.ts               # Typed API client
      lib/utils.ts             # Formatting + colour utilities
      types/index.ts           # TypeScript interfaces
```

---

## License

MIT — For demonstration and research purposes only.
