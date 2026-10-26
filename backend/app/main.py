"""
CIVIS Lite FastAPI — main application entry point.
All routers registered here with /api/v1 prefix.
Auto-seeds demo users and data on startup for serverless environments.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

import sys, os
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.database import engine, Base, SessionLocal
from app.api import (
    dashboard, centres, batches, beneficiaries, trainers,
    attendance, evidence, assessments, placements, payments,
    inspections, anomalies, risk, matching,
    corrective_actions, configuration, demo, priority, analyse,
    auth, users, notifications
)


def _auto_seed():
    """Seed demo users + data if the DB is empty (cold start on Vercel)."""
    from app.models import User
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("[CIVIS] Empty database or 0 users detected — seeding all demo data...")
            from app.services.seed_service import ensure_all_demo_data
            ensure_all_demo_data(db)
            print("[CIVIS] All demo data and users seeded.")
        else:
            print(f"[CIVIS] Database has {user_count} users — skipping seed.")
    except Exception as e:
        print(f"[CIVIS] Auto-seed check failed: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass


# Ensure tables and demo data are initialized on module load (critical for serverless Vercel)
try:
    Base.metadata.create_all(bind=engine)
    _auto_seed()
except Exception as e:
    print(f"[CIVIS] Module init exception: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables + auto-seed
    Base.metadata.create_all(bind=engine)
    _auto_seed()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="CIVIS Lite API",
    description="Intelligent Monitoring Prototype for Employability Development Scheme",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://civis-lite.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(dashboard.router,         prefix=PREFIX)
app.include_router(centres.router,           prefix=PREFIX)
app.include_router(batches.router,           prefix=PREFIX)
app.include_router(beneficiaries.router,     prefix=PREFIX)
app.include_router(trainers.router,          prefix=PREFIX)
app.include_router(attendance.router,        prefix=PREFIX)
app.include_router(evidence.router,          prefix=PREFIX)
app.include_router(assessments.router,       prefix=PREFIX)
app.include_router(placements.router,        prefix=PREFIX)
app.include_router(payments.router,          prefix=PREFIX)
app.include_router(inspections.router,       prefix=PREFIX)
app.include_router(anomalies.router,         prefix=PREFIX)
app.include_router(risk.router,              prefix=PREFIX)
app.include_router(matching.router,          prefix=PREFIX)
app.include_router(corrective_actions.router,prefix=PREFIX)
app.include_router(configuration.router,     prefix=PREFIX)
app.include_router(demo.router,              prefix=PREFIX)
app.include_router(priority.router,          prefix=PREFIX)
app.include_router(analyse.router,           prefix=PREFIX)
app.include_router(auth.router,              prefix=PREFIX)
app.include_router(users.router,             prefix=PREFIX)
app.include_router(notifications.router,     prefix=PREFIX)

@app.get("/")
def read_root():
    return {"status": "CIVIS Lite API running", "version": "1.0.0"}
