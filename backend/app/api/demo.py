"""Demo data injector router."""
import json
import random
from datetime import datetime, date, time, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from faker import Faker

from app.database import get_db, engine, Base
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.models.beneficiary import Beneficiary, BeneficiaryEnrolment
from app.models.attendance import Attendance
from app.models.evidence import Evidence
from app.models.placement import Placement
from app.models.payment import Payment
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore

router = APIRouter(tags=["Demo"])
fake = Faker("en_IN")


@router.post("/demo/reset")
def reset_database(db: Session = Depends(get_db)):
    """Wipe all data and re-seed from scratch."""
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Re-seed baseline data, demo users, and inspector assignments
    from app.services.seed_service import ensure_all_demo_data
    ensure_all_demo_data(db)
    return {"status": "success", "message": "Database reset and re-seeded with baseline data, users, and assignments."}


@router.post("/demo/generate-normal")
def generate_normal_data(db: Session = Depends(get_db)):
    """Add 3 more clean centres with batches and beneficiaries."""
    created = []
    for i in range(3):
        state = random.choice(["Maharashtra", "Tamil Nadu", "Gujarat"])
        lat = round(random.uniform(15, 25), 4)
        lon = round(random.uniform(72, 82), 4)
        c = TrainingCentre(
            centre_code=f"TC-DEMO-{random.randint(100,999)}",
            centre_name=f"Demo Skill Centre {i+1}",
            organisation_name=fake.company() + " Skills",
            state=state, district=fake.city(),
            address=fake.address(), latitude=lat, longitude=lon,
            status="active",
            registration_date=date.today() - timedelta(days=random.randint(200, 500)),
            last_inspection_date=date.today() - timedelta(days=random.randint(30, 200)),
        )
        db.add(c)
        db.flush()
        batch = TrainingBatch(
            batch_code=f"{c.centre_code}-B01",
            centre_id=c.id,
            course_name="Digital Marketing",
            start_date=date.today() - timedelta(days=45),
            end_date=date.today() + timedelta(days=45),
            expected_training_hours=200,
            batch_capacity=30, registered_count=25, status="active",
        )
        db.add(batch)
        created.append(c.centre_code)
    db.commit()
    return {"status": "success", "created_centres": created}


@router.post("/demo/inject/attendance-anomaly")
def inject_attendance_anomaly(db: Session = Depends(get_db)):
    batch = db.query(TrainingBatch).filter(TrainingBatch.status == "active").first()
    if not batch:
        return {"status": "error", "message": "No active batch found"}
    enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.batch_id == batch.id
    ).all()
    start = batch.start_date
    days = [start + timedelta(days=d) for d in range(20) if (start + timedelta(days=d)).weekday() < 5]
    count = 0
    for day in days:
        for enr in enrolments:
            db.add(Attendance(
                beneficiary_id=enr.beneficiary_id, batch_id=batch.id,
                date=day, check_in_time=time(9, 0, 0), check_out_time=time(17, 0, 0),
                attendance_status="present", attendance_source="biometric",
            ))
            count += 1
    db.commit()
    return {"status": "success",
            "message": f"Injected perfect attendance: {len(enrolments)} beneficiaries × {len(days)} days in batch {batch.batch_code}",
            "records_created": count}


@router.post("/demo/inject/duplicate-beneficiary")
def inject_duplicate_beneficiary(db: Session = Depends(get_db)):
    batches = db.query(TrainingBatch).filter(TrainingBatch.status == "active").limit(2).all()
    if len(batches) < 2:
        return {"status": "error", "message": "Need at least 2 active batches"}

    ben = Beneficiary(
        beneficiary_token=f"BEN-DUP-{random.randint(1000,9999)}",
        name="Ramesh Sharma (Duplicate)",
        age=23, gender="Male", category="OBC",
        district="Pune", state="Maharashtra",
        eligibility_status=True,
        bank_account_token=f"BAK-DUP-{random.randint(1000,9999)}",
        mobile_token=f"MOB-DUP-{random.randint(1000,9999)}",
    )
    db.add(ben)
    db.flush()

    for batch in batches[:2]:
        db.add(BeneficiaryEnrolment(
            beneficiary_id=ben.id, batch_id=batch.id,
            enrolment_date=batch.start_date,
            status="active", completion_status="in_progress",
        ))
        for d in range(5):
            day = batch.start_date + timedelta(days=d)
            db.add(Attendance(
                beneficiary_id=ben.id, batch_id=batch.id,
                date=day, check_in_time=time(9, 0, 0), check_out_time=time(17, 0, 0),
                attendance_status="present", attendance_source="manual",
            ))

    db.add(Anomaly(
        entity_type="beneficiary", entity_id=ben.id,
        anomaly_type="duplicate_enrolment_match", severity="high",
        description=f"Beneficiary {ben.beneficiary_token} enrolled in two overlapping active batches simultaneously",
        detected_at=datetime.now(),
        evidence=json.dumps({"batch_1": batches[0].batch_code, "batch_2": batches[1].batch_code}),
        status="open",
    ))
    db.commit()
    return {"status": "success",
            "message": f"Injected duplicate beneficiary {ben.beneficiary_token} in batches {batches[0].batch_code} and {batches[1].batch_code}"}


@router.post("/demo/inject/location-conflict")
def inject_location_conflict(db: Session = Depends(get_db)):
    ben = db.query(Beneficiary).first()
    batch = db.query(TrainingBatch).first()
    if not ben or not batch:
        return {"status": "error", "message": "No data found"}
    db.add(Attendance(
        beneficiary_id=ben.id, batch_id=batch.id,
        date=date.today(), check_in_time=time(9, 0, 0), check_out_time=time(17, 0, 0),
        attendance_status="present", attendance_source="geo",
        latitude=19.9975,  # ~160km from Pune
        longitude=73.7898,
    ))
    db.add(Anomaly(
        entity_type="batch", entity_id=batch.id,
        anomaly_type="attendance_geo_mismatch", severity="high",
        description=f"Attendance GPS 160km from training centre for beneficiary {ben.beneficiary_token}",
        detected_at=datetime.now(),
        evidence=json.dumps({"distance_metres": 160000, "attendance_lat": 19.9975, "attendance_lon": 73.7898}),
        status="open",
    ))
    db.commit()
    return {"status": "success", "message": f"Injected location conflict: attendance 160km from centre for {ben.beneficiary_token}"}


@router.post("/demo/inject/duplicate-image")
def inject_duplicate_image(db: Session = Depends(get_db)):
    HASH = "deadbeef12345678"
    batches = db.query(TrainingBatch).limit(3).all()
    for i, batch in enumerate(batches):
        db.add(Evidence(
            batch_id=batch.id, evidence_type="photo",
            file_path=f"/evidence/injected_dup_{i+1}.jpg",
            uploaded_at=datetime.now() - timedelta(days=i*3),
            captured_at=datetime.now() - timedelta(days=i*3+1),
            image_hash=HASH, source="upload",
        ))
    db.add(Anomaly(
        entity_type="batch", entity_id=batches[0].id,
        anomaly_type="duplicate_evidence", severity="high",
        description=f"3 monitoring evidence photos with identical hash '{HASH}' across different batches",
        detected_at=datetime.now(),
        evidence=json.dumps({"duplicate_count": 3, "image_hash": HASH}),
        status="open",
    ))
    db.commit()
    return {"status": "success", "message": f"Injected 3 evidence records with identical hash '{HASH}'"}


@router.post("/demo/inject/placement-anomaly")
def inject_placement_anomaly(db: Session = Depends(get_db)):
    batch = db.query(TrainingBatch).filter(TrainingBatch.status == "active").first()
    if not batch:
        return {"status": "error", "message": "No active batch found"}
    batch.end_date = date.today() + timedelta(days=30)
    db.flush()
    enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.batch_id == batch.id
    ).limit(5).all()
    for enr in enrolments:
        db.add(Placement(
            beneficiary_id=enr.beneficiary_id, batch_id=batch.id,
            employer_name="EarlyPlacement Corp",
            employment_type="full_time",
            placement_date=date.today() - timedelta(days=5),
            salary=18000, verification_status="pending",
        ))
    db.commit()
    return {"status": "success",
            "message": f"Injected 5 placements dated before batch end date ({batch.end_date}) for batch {batch.batch_code}"}


@router.post("/demo/inject/payment-anomaly")
def inject_payment_anomaly(db: Session = Depends(get_db)):
    batch = db.query(TrainingBatch).first()
    ben = db.query(Beneficiary).first()
    if not batch or not ben:
        return {"status": "error", "message": "No data found"}
    db.add(Payment(
        beneficiary_id=ben.id, batch_id=batch.id,
        payment_type="stipend", amount=1500,
        payment_date=date.today(),
        payment_status="paid",
        payment_reference=f"ANOM-PAY-{random.randint(1000,9999)}",
    ))
    db.add(Anomaly(
        entity_type="batch", entity_id=batch.id,
        anomaly_type="payment_low_attendance", severity="high",
        description=f"Stipend paid to {ben.beneficiary_token} who has <50% attendance",
        detected_at=datetime.now(),
        evidence=json.dumps({"beneficiary_token": ben.beneficiary_token, "attendance_pct": 42, "amount": 1500}),
        status="open",
    ))
    db.commit()
    return {"status": "success", "message": f"Injected payment anomaly: stipend paid to {ben.beneficiary_token} with low attendance"}


@router.post("/demo/inject/high-risk-centre")
def inject_high_risk_centre(db: Session = Depends(get_db)):
    """Recreate the Centre 07 full anomaly profile if it was wiped."""
    existing = db.query(TrainingCentre).filter(TrainingCentre.centre_code == "TC-MH-007").first()
    if existing:
        rs = db.query(RiskScore).filter(
            RiskScore.entity_type == "centre", RiskScore.entity_id == existing.id
        ).first()
        if rs:
            return {"status": "already_exists",
                    "message": f"Centre 07 (id={existing.id}) already exists with risk score {rs.score}"}

    c = TrainingCentre(
        centre_code="TC-MH-007-NEW",
        centre_name="CIVIS Training Centre 07 (Injected)",
        organisation_name="Skill India Foundation",
        state="Maharashtra", district="Pune",
        address="Plot 14, MIDC Industrial Area, Pune",
        latitude=18.5204, longitude=73.8567,
        status="active",
        registration_date=date(2022, 3, 15),
        last_inspection_date=date.today() - timedelta(days=470),
    )
    db.add(c)
    db.flush()

    anomaly_seeds = [
        ("centre", c.id, "duplicate_enrolment_match", "high", "12 beneficiaries simultaneously enrolled in another active batch"),
        ("centre", c.id, "trainer_conflict", "high", "Trainer recorded at two centres on same dates"),
        ("centre", c.id, "duplicate_evidence", "high", "3 evidence images with identical hash"),
        ("centre", c.id, "perfect_attendance_pattern", "medium", "All 50 beneficiaries at 100% attendance for 30 days"),
        ("centre", c.id, "placement_before_completion", "high", "8 placements before batch end date"),
        ("centre", c.id, "inspection_overdue", "low", "Last inspection 470 days ago"),
    ]
    for et, eid, atype, sev, desc in anomaly_seeds:
        db.add(Anomaly(
            entity_type=et, entity_id=eid, anomaly_type=atype,
            severity=sev, description=desc,
            detected_at=datetime.now(), evidence="{}", status="open",
        ))

    db.add(RiskScore(
        entity_type="centre", entity_id=c.id,
        score=89, risk_level="critical", calculated_at=datetime.now(),
        reasons=json.dumps([
            {"factor": "duplicate_enrolment_match", "contribution": 25, "description": "12 beneficiaries simultaneously enrolled and present in another centre"},
            {"factor": "duplicate_evidence", "contribution": 20, "description": "3 evidence images with identical perceptual hash"},
            {"factor": "perfect_attendance_pattern", "contribution": 15, "description": "All 50 beneficiaries at 100% attendance, identical check-in time"},
            {"factor": "placement_before_completion", "contribution": 12, "description": "8 placements claimed before course completion date"},
            {"factor": "trainer_conflict", "contribution": 10, "description": "Trainer recorded at two centres simultaneously"},
            {"factor": "inspection_overdue", "contribution": 7, "description": "Last inspection 470 days ago (overdue by 105 days)"},
        ]),
    ))
    db.commit()
    return {"status": "success",
            "message": f"High-risk centre injected (id={c.id}). Risk score: 89/100 CRITICAL with 6 anomalies."}


@router.post("/demo/run-all-checks")
def run_all_checks(db: Session = Depends(get_db)):
    from app.api.analyse import run_all
    return run_all(db)
