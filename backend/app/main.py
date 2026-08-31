"""
CIVIS Lite FastAPI — main application entry point.
All routers registered here with /api/v1 prefix.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine, Base
from app.api import (
    dashboard, centres, batches, beneficiaries, trainers,
    attendance, evidence, assessments, placements, payments,
    inspections, anomalies, risk, matching,
    corrective_actions, configuration, demo, priority, analyse
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CIVIS Lite API",
    description="Intelligent Monitoring Prototype for Employability Development Scheme",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
def read_root():
    return {"status": "CIVIS Lite API running", "version": "1.0.0"}
