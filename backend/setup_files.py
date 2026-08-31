import os
import json

base_dir = r"C:\Users\arush\.gemini\antigravity\scratch\civis-lite\backend"
dirs = [
    "app",
    "app/models",
    "app/schemas",
    "app/api",
    "app/services",
    "app/config",
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

def write_file(path, content):
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(content)

write_file("run.py", '''import subprocess, sys
subprocess.run([sys.executable, "seed_data.py"])
import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
''')

write_file("app/database.py", '''from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./civis.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
''')

write_file("app/models/__init__.py", '''from app.database import Base
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.models.beneficiary import Beneficiary, BeneficiaryEnrolment
from app.models.trainer import Trainer, TrainerAttendance
from app.models.attendance import Attendance
from app.models.evidence import Evidence
from app.models.assessment import Assessment
from app.models.placement import Placement
from app.models.payment import Payment
from app.models.inspection import Inspection
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore
from app.models.corrective_action import CorrectiveAction
''')

write_file("app/models/centre.py", '''from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class TrainingCentre(Base):
    __tablename__ = "training_centres"
    id = Column(Integer, primary_key=True, index=True)
    centre_code = Column(String, unique=True, index=True)
    centre_name = Column(String)
    organisation_name = Column(String)
    state = Column(String)
    district = Column(String)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String)
    registration_date = Column(Date)
    last_inspection_date = Column(Date, nullable=True)
''')

write_file("app/models/batch.py", '''from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base

class TrainingBatch(Base):
    __tablename__ = "training_batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String, unique=True, index=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    course_name = Column(String)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    start_date = Column(Date)
    end_date = Column(Date)
    expected_training_hours = Column(Integer)
    batch_capacity = Column(Integer)
    registered_count = Column(Integer)
    status = Column(String)
''')

write_file("app/models/beneficiary.py", '''from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from app.database import Base

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_token = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    category = Column(String)
    district = Column(String)
    state = Column(String)
    eligibility_status = Column(Boolean)
    bank_account_token = Column(String)
    mobile_token = Column(String)

class BeneficiaryEnrolment(Base):
    __tablename__ = "beneficiary_enrolments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    enrolment_date = Column(Date)
    status = Column(String)
    completion_status = Column(String)
''')

write_file("app/models/trainer.py", '''from sqlalchemy import Column, Integer, String, Date, Time, Float, ForeignKey
from app.database import Base

class Trainer(Base):
    __tablename__ = "trainers"
    id = Column(Integer, primary_key=True, index=True)
    trainer_code = Column(String, unique=True, index=True)
    name = Column(String)
    qualification = Column(String)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))

class TrainerAttendance(Base):
    __tablename__ = "trainer_attendances"
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    date = Column(Date)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
''')

write_file("app/models/attendance.py", '''from sqlalchemy import Column, Integer, String, Date, Time, Float, ForeignKey
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    date = Column(Date)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    attendance_status = Column(String)
    attendance_source = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
''')

write_file("app/models/evidence.py", '''from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.database import Base

class Evidence(Base):
    __tablename__ = "evidences"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    evidence_type = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime)
    captured_at = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_hash = Column(String, nullable=True)
    source = Column(String)
''')

write_file("app/models/assessment.py", '''from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    score = Column(Float)
    result = Column(String)
    assessment_date = Column(Date)
    certification_status = Column(String)
''')

write_file("app/models/placement.py", '''from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    employer_name = Column(String)
    employment_type = Column(String)
    placement_date = Column(Date)
    salary = Column(Float)
    verification_status = Column(String)
''')

write_file("app/models/payment.py", '''from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    payment_type = Column(String)
    amount = Column(Float)
    payment_date = Column(Date)
    payment_status = Column(String)
    payment_reference = Column(String, nullable=True)
''')

write_file("app/models/inspection.py", '''from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"), nullable=True)
    inspector_name = Column(String)
    inspection_date = Column(DateTime)
    actual_people_found = Column(Integer, nullable=True)
    findings = Column(Text)
    compliance_status = Column(String)
    status = Column(String)
    duration_minutes = Column(Integer, nullable=True)
    inspector_latitude = Column(Float, nullable=True)
    inspector_longitude = Column(Float, nullable=True)
    checklist = Column(Text)
''')

write_file("app/models/anomaly.py", '''from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)
    entity_id = Column(Integer)
    anomaly_type = Column(String)
    severity = Column(String)
    description = Column(String)
    detected_at = Column(DateTime)
    evidence = Column(Text)
    status = Column(String)
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(Integer, nullable=True)
''')

write_file("app/models/risk.py", '''from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)
    entity_id = Column(Integer)
    score = Column(Float)
    risk_level = Column(String)
    calculated_at = Column(DateTime)
    reasons = Column(Text)
''')

write_file("app/models/corrective_action.py", '''from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey
from app.database import Base

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"
    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    responsible_person = Column(String)
    action_required = Column(String)
    deadline = Column(Date)
    severity = Column(String)
    status = Column(String)
    evidence_submitted = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime)
''')

write_file("app/main.py", '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import all routers
# from app.api import centres, batches, beneficiaries, trainers, attendance, evidence, assessments, placements, payments, inspections, anomalies, risk, matching, corrective_actions, configuration, demo, dashboard, priority

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CIVIS Lite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "CIVIS Lite API running", "version": "1.0.0"}
''')

print("Created essential models and setup files.")
