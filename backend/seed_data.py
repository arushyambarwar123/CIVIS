"""
CIVIS Lite -- Comprehensive Seed Data Generator
Generates ~20 centres, 40 batches, 400 beneficiaries, 2000+ attendance records,
assessments, placements, payments, evidence, inspections, and Centre 07 anomaly profile.
Idempotent: checks if data exists before inserting.
"""
import json
import random
from datetime import date, time, datetime, timedelta
from faker import Faker

from app.database import engine, Base, SessionLocal
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

fake = Faker("en_IN")
random.seed(42)

Base.metadata.create_all(bind=engine)

# ??????????????????????????????????????????????
# CONSTANTS
# ??????????????????????????????????????????????
STATES_DISTRICTS = {
    "Maharashtra": ["Pune", "Mumbai", "Nagpur", "Nashik", "Aurangabad"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"],
}
COURSES = [
    "Web Development", "Computer Hardware", "Electrical Technician",
    "Retail Management", "Digital Marketing", "Data Entry Operator",
    "Solar Panel Installation", "Apparel Stitching", "BPO / Customer Service",
    "Hospitality & Catering",
]
CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"]
GENDERS = ["Male", "Female", "Other"]
QUALIFICATIONS = [
    "B.Tech (Electronics)", "B.Sc (Computer Science)", "Diploma (Electrical)",
    "MBA (HR)", "B.Com", "B.Voc (IT)",
]
EMPLOYERS = [
    "InfoSys BPO", "Wipro Skills", "Tata Consultancy", "HCL Tech",
    "Reliance Retail", "Decathlon India", "Zomato", "BigBasket",
    "Jio Platforms", "HDFC Bank Operations",
]


def random_state_district():
    state = random.choice(list(STATES_DISTRICTS.keys()))
    district = random.choice(STATES_DISTRICTS[state])
    return state, district


def random_coords(state: str):
    coords = {
        "Maharashtra": (17.5, 73.0, 21.0, 77.5),
        "Tamil Nadu": (8.5, 76.5, 13.5, 80.5),
        "Gujarat": (20.5, 68.5, 24.5, 74.0),
        "Rajasthan": (23.5, 69.5, 30.0, 78.0),
        "Karnataka": (11.5, 74.0, 18.5, 78.5),
    }
    lat_min, lon_min, lat_max, lon_max = coords.get(state, (10, 70, 30, 85))
    return round(random.uniform(lat_min, lat_max), 4), round(random.uniform(lon_min, lon_max), 4)


def seed_db():
    db = SessionLocal()

    if db.query(TrainingCentre).count() > 0:
        print("? Database already seeded -- skipping.")
        db.close()
        return

    print("[SEED] Seeding CIVIS Lite database...")

    # ??????????????????????????????????????????????
    # TRAINERS (10 trainers, assigned later)
    # ??????????????????????????????????????????????
    trainers = []
    for i in range(1, 11):
        t = Trainer(
            trainer_code=f"TR-{i:03d}",
            name=fake.name(),
            qualification=random.choice(QUALIFICATIONS),
            centre_id=None,  # will update after centres
        )
        db.add(t)
        trainers.append(t)
    db.flush()

    # ??????????????????????????????????????????????
    # TRAINING CENTRES (20 total)
    # ??????????????????????????????????????????????
    centres = []

    # Centre 07 -- CRITICAL ANOMALY PROFILE
    c07 = TrainingCentre(
        centre_code="TC-MH-007",
        centre_name="CIVIS Training Centre 07",
        organisation_name="Skill India Foundation",
        state="Maharashtra",
        district="Pune",
        address="Plot 14, MIDC Industrial Area, Pune, Maharashtra 411019",
        latitude=18.5204,
        longitude=73.8567,
        status="active",
        registration_date=date(2022, 3, 15),
        last_inspection_date=date.today() - timedelta(days=470),
    )
    db.add(c07)
    db.flush()
    centres.append(c07)
    trainers[0].centre_id = c07.id  # Trainer 1 belongs to Centre 07

    # Other 19 centres with varying risk profiles
    risk_profiles = [
        # (last_inspection_offset_days, is_high_risk)
        (120, True),   # Centre will get anomalies -> HIGH
        (200, True),   # HIGH
        (90, False),   # MEDIUM
        (60, False),   # LOW
        (30, False),   # LOW
        (150, False),  # MEDIUM
        (250, True),   # HIGH -- inspection overdue
        (45, False),   # LOW
        (80, False),   # MEDIUM
        (180, False),  # MEDIUM
        (20, False),   # LOW
        (300, False),  # MEDIUM -- overdue
        (50, False),   # LOW
        (70, False),   # LOW
        (110, False),  # MEDIUM
        (40, False),   # LOW
        (95, False),   # MEDIUM
        (160, False),  # MEDIUM
        (25, False),   # LOW
    ]

    for i, (insp_days, _) in enumerate(risk_profiles, start=1):
        state, district = random_state_district()
        lat, lon = random_coords(state)
        c = TrainingCentre(
            centre_code=f"TC-{['MH', 'TN', 'GJ', 'RJ', 'KA'][i % 5]}-{i:03d}",
            centre_name=f"National Skill Centre {i:02d}",
            organisation_name=fake.company() + " Skills Pvt Ltd",
            state=state,
            district=district,
            address=fake.address(),
            latitude=lat,
            longitude=lon,
            status="active",
            registration_date=fake.date_between(start_date="-4y", end_date="-1y"),
            last_inspection_date=date.today() - timedelta(days=insp_days),
        )
        db.add(c)
        db.flush()
        centres.append(c)
        if i < len(trainers):
            trainers[i].centre_id = c.id

    db.commit()
    print(f"  -> {len(centres)} training centres created")

    # ??????????????????????????????????????????????
    # TRAINING BATCHES (2 per centre = 40 total)
    # ??????????????????????????????????????????????
    batches = []
    for ci, centre in enumerate(centres):
        trainer = trainers[ci % len(trainers)]
        for bi in range(1, 3):
            start = fake.date_between(start_date="-6m", end_date="-3m")
            duration = random.choice([60, 90, 120])
            end = start + timedelta(days=duration)
            cap = random.choice([30, 40, 50])
            reg = random.randint(int(cap * 0.7), cap)
            status = "completed" if end < date.today() else "active"

            batch = TrainingBatch(
                batch_code=f"{centre.centre_code}-B{bi:02d}",
                centre_id=centre.id,
                course_name=random.choice(COURSES),
                trainer_id=trainer.id,
                start_date=start,
                end_date=end,
                expected_training_hours=random.choice([200, 300, 400]),
                batch_capacity=cap,
                registered_count=reg,
                status=status,
            )
            db.add(batch)
            db.flush()
            batches.append(batch)

    db.commit()
    print(f"  -> {len(batches)} training batches created")

    # ??????????????????????????????????????????????
    # BENEFICIARIES (400 total)
    # ??????????????????????????????????????????????
    beneficiaries = []
    state_codes = {"Maharashtra": "MH", "Tamil Nadu": "TN", "Gujarat": "GJ", "Rajasthan": "RJ", "Karnataka": "KA"}

    for i in range(1, 401):
        state, district = random_state_district()
        sc = state_codes.get(state, "IN")
        b = Beneficiary(
            beneficiary_token=f"BEN-{sc}-{i:05d}",
            name=fake.name(),
            age=random.randint(18, 35),
            gender=random.choice(GENDERS),
            category=random.choice(CATEGORIES),
            district=district,
            state=state,
            eligibility_status=random.random() > 0.05,  # 95% eligible
            bank_account_token=f"BAK-{i:05d}",
            mobile_token=f"MOB-{i:05d}",
        )
        db.add(b)
        beneficiaries.append(b)
    db.flush()
    db.commit()
    print(f"  -> {len(beneficiaries)} beneficiaries created")

    # ??????????????????????????????????????????????
    # ENROLMENTS -- assign ~10 beneficiaries per batch
    # ??????????????????????????????????????????????
    enrolment_map: dict[int, list[int]] = {}  # batch_id -> [beneficiary_ids]
    used_bens = set()

    ben_pool = list(range(len(beneficiaries)))
    random.shuffle(ben_pool)
    pool_cursor = 0

    for batch in batches:
        count = min(batch.registered_count, 15)
        batch_bens = []
        for _ in range(count):
            if pool_cursor >= len(ben_pool):
                pool_cursor = 0
            ben_idx = ben_pool[pool_cursor]
            pool_cursor += 1
            ben = beneficiaries[ben_idx]
            enrol_date = batch.start_date + timedelta(days=random.randint(0, 5))
            comp = random.choice(["completed", "in_progress", "not_started"])
            if batch.status == "completed":
                comp = random.choice(["completed", "completed", "failed"])
            enrolment = BeneficiaryEnrolment(
                beneficiary_id=ben.id,
                batch_id=batch.id,
                enrolment_date=enrol_date,
                status="active" if batch.status == "active" else "completed",
                completion_status=comp,
            )
            db.add(enrolment)
            batch_bens.append(ben.id)
        enrolment_map[batch.id] = batch_bens

    db.commit()
    print(f"  -> Enrolments created")

    # ??????????????????????????????????????????????
    # ATTENDANCE -- regular records for normal batches
    # ??????????????????????????????????????????????
    att_count = 0
    for batch in batches[:30]:  # first 30 batches get regular attendance
        batch_bens = enrolment_map.get(batch.id, [])
        if not batch_bens:
            continue
        training_days = [
            batch.start_date + timedelta(days=d)
            for d in range(min(30, (batch.end_date - batch.start_date).days))
            if (batch.start_date + timedelta(days=d)).weekday() < 5  # Mon-Fri
        ]
        for day in training_days:
            for ben_id in batch_bens:
                present = random.random() > 0.15  # 85% attendance normally
                check_in_h = random.randint(8, 10)
                check_in_m = random.randint(0, 45)
                att = Attendance(
                    beneficiary_id=ben_id,
                    batch_id=batch.id,
                    date=day,
                    check_in_time=time(check_in_h, check_in_m, random.randint(0, 59)),
                    check_out_time=time(check_in_h + 7, check_in_m, 0),
                    attendance_status="present" if present else "absent",
                    attendance_source=random.choice(["biometric", "manual"]),
                    latitude=None,
                    longitude=None,
                )
                db.add(att)
                att_count += 1

    db.commit()
    print(f"  -> {att_count} attendance records created")

    # ??????????????????????????????????????????????
    # ASSESSMENTS
    # ??????????????????????????????????????????????
    assess_count = 0
    for batch in batches:
        if batch.status != "completed":
            continue
        batch_bens = enrolment_map.get(batch.id, [])
        for ben_id in batch_bens:
            score = round(random.uniform(40, 95), 1)
            result = "pass" if score >= 50 else "fail"
            cert = "certified" if result == "pass" else "not_certified"
            assess = Assessment(
                beneficiary_id=ben_id,
                batch_id=batch.id,
                score=score,
                result=result,
                assessment_date=batch.end_date,
                certification_status=cert,
            )
            db.add(assess)
            assess_count += 1
    db.commit()
    print(f"  -> {assess_count} assessments created")

    # ??????????????????????????????????????????????
    # PLACEMENTS (normal)
    # ??????????????????????????????????????????????
    place_count = 0
    for batch in batches[:20]:
        if batch.status != "completed":
            continue
        batch_bens = enrolment_map.get(batch.id, [])
        placed = random.sample(batch_bens, min(len(batch_bens), random.randint(4, 8)))
        for ben_id in placed:
            p = Placement(
                beneficiary_id=ben_id,
                batch_id=batch.id,
                employer_name=random.choice(EMPLOYERS),
                employment_type=random.choice(["full_time", "part_time"]),
                placement_date=batch.end_date + timedelta(days=random.randint(7, 45)),
                salary=round(random.uniform(12000, 25000), 2),
                verification_status=random.choice(["verified", "pending", "pending"]),
            )
            db.add(p)
            place_count += 1
    db.commit()
    print(f"  -> {place_count} placements created")

    # ??????????????????????????????????????????????
    # PAYMENTS (normal)
    # ??????????????????????????????????????????????
    pay_count = 0
    for batch in batches[:25]:
        batch_bens = enrolment_map.get(batch.id, [])
        for ben_id in batch_bens[:5]:
            pay = Payment(
                beneficiary_id=ben_id,
                batch_id=batch.id,
                payment_type="stipend",
                amount=round(random.uniform(500, 1500), 2),
                payment_date=batch.start_date + timedelta(days=random.randint(30, 60)),
                payment_status=random.choice(["paid", "paid", "pending"]),
                payment_reference=f"PAY-{batch.id}-{ben_id}-{random.randint(1000,9999)}",
            )
            db.add(pay)
            pay_count += 1
    db.commit()
    print(f"  -> {pay_count} payments created")

    # ??????????????????????????????????????????????
    # EVIDENCE (normal)
    # ??????????????????????????????????????????????
    ev_count = 0
    for batch in batches[:30]:
        for evi in range(random.randint(2, 4)):
            ev = Evidence(
                batch_id=batch.id,
                evidence_type="photo",
                file_path=f"/evidence/batch_{batch.id}_img_{evi+1}.jpg",
                uploaded_at=datetime.now() - timedelta(days=random.randint(1, 60)),
                captured_at=datetime.now() - timedelta(days=random.randint(1, 60)),
                latitude=None,
                longitude=None,
                image_hash=f"{random.randint(0xaabb0000, 0xffff9999):016x}",
                source="upload",
            )
            db.add(ev)
            ev_count += 1
    db.commit()
    print(f"  -> {ev_count} evidence records created")

    # ??????????????????????????????????????????????
    # INSPECTIONS (normal -- past ones)
    # ??????????????????????????????????????????????
    for centre in centres[1:10]:
        insp = Inspection(
            centre_id=centre.id,
            batch_id=None,
            inspector_name=fake.name(),
            inspection_date=datetime.now() - timedelta(days=random.randint(90, 365)),
            actual_people_found=random.randint(20, 45),
            findings=json.dumps({"summary": "Routine inspection -- no major issues found."}),
            compliance_status="compliant",
            status="submitted",
            duration_minutes=random.randint(30, 90),
            inspector_latitude=None,
            inspector_longitude=None,
            checklist=json.dumps({
                "trainer_present": True,
                "training_active": True,
                "equipment_available": True,
                "remarks": "All in order.",
            }),
        )
        db.add(insp)
    db.commit()

    # ??????????????????????????????????????????????
    # RISK SCORES for normal centres (mixed)
    # ??????????????????????????????????????????????
    normal_scores = [72, 78, 28, 15, 10, 45, 62, 22, 38, 51, 8, 48, 19, 14, 42, 11, 35, 44, 18]
    for i, centre in enumerate(centres[1:20]):
        score = normal_scores[i] if i < len(normal_scores) else random.randint(10, 60)
        level = "critical" if score > 75 else "high" if score > 55 else "medium" if score > 30 else "low"
        db.add(RiskScore(
            entity_type="centre",
            entity_id=centre.id,
            score=score,
            risk_level=level,
            calculated_at=datetime.now(),
            reasons=json.dumps([
                {"factor": "inspection_overdue", "contribution": min(score, 15),
                 "description": "Inspection overdue"}
            ] if score > 40 else [
                {"factor": "routine", "contribution": score, "description": "Routine monitoring"}
            ]),
        ))
    db.commit()

    # ??????????????????????????????????????????????
    # ??????????????????????????????????????????????
    # CENTRE 07 -- FULL ANOMALY PROFILE
    # ??????????????????????????????????????????????
    # ??????????????????????????????????????????????
    print("\n   Building Centre 07 anomaly profile...")

    c07_batches = [b for b in batches if b.centre_id == c07.id]
    if not c07_batches:
        # Create dedicated batches for c07
        for bi in range(1, 3):
            start = date.today() - timedelta(days=50)
            b = TrainingBatch(
                batch_code=f"TC-MH-007-B{bi:02d}",
                centre_id=c07.id,
                course_name="Web Development",
                trainer_id=trainers[0].id,
                start_date=start,
                end_date=start + timedelta(days=90),
                expected_training_hours=300,
                batch_capacity=50,
                registered_count=50,
                status="active",
            )
            db.add(b)
            db.flush()
            c07_batches.append(b)
            batches.append(b)
    db.commit()

    main_batch = c07_batches[0]

    # Create 50 beneficiaries for Centre 07 main batch
    c07_bens = []
    for i in range(50):
        b = Beneficiary(
            beneficiary_token=f"BEN-MH-C07-{i+1:03d}",
            name=fake.name(),
            age=random.randint(19, 30),
            gender=random.choice(["Male", "Female"]),
            category=random.choice(CATEGORIES),
            district="Pune",
            state="Maharashtra",
            eligibility_status=True,
            bank_account_token=f"BAK-C07-{i+1:03d}",
            mobile_token=f"MOB-C07-{i+1:03d}",
        )
        db.add(b)
        c07_bens.append(b)
    db.flush()
    db.commit()

    # Enrol all 50 in main batch
    for ben in c07_bens:
        db.add(BeneficiaryEnrolment(
            beneficiary_id=ben.id,
            batch_id=main_batch.id,
            enrolment_date=main_batch.start_date,
            status="active",
            completion_status="in_progress",
        ))
    db.commit()

    # ANOMALY 1: Perfect Attendance -- all 50 present every day, all at 09:00:00
    training_start = main_batch.start_date
    c07_att_days = [
        training_start + timedelta(days=d)
        for d in range(30)
        if (training_start + timedelta(days=d)).weekday() < 5
    ]
    c07_att_count = 0
    for day in c07_att_days:
        for ben in c07_bens:
            db.add(Attendance(
                beneficiary_id=ben.id,
                batch_id=main_batch.id,
                date=day,
                check_in_time=time(9, 0, 0),   # IDENTICAL -- anomaly trigger
                check_out_time=time(17, 0, 0),
                attendance_status="present",
                attendance_source="biometric",
                latitude=None,
                longitude=None,
            ))
            c07_att_count += 1
    db.commit()
    print(f"    -> Perfect attendance: {c07_att_count} records (50 beneficiaries ? {len(c07_att_days)} days)")

    # ANOMALY 2: 12 beneficiaries also enrolled in a different active batch at another centre
    other_centre = centres[3]  # choose a distant centre
    other_batch = next((b for b in batches if b.centre_id == other_centre.id), None)

    if other_batch:
        dup_bens = c07_bens[:12]
        for ben in dup_bens:
            # Add enrolment in other batch (overlapping dates)
            db.add(BeneficiaryEnrolment(
                beneficiary_id=ben.id,
                batch_id=other_batch.id,
                enrolment_date=other_batch.start_date,
                status="active",
                completion_status="in_progress",
            ))
            # Also mark them present there on same days (creates impossible travel if centres are far)
            for day in c07_att_days[:5]:
                db.add(Attendance(
                    beneficiary_id=ben.id,
                    batch_id=other_batch.id,
                    date=day,
                    check_in_time=time(9, 30, 0),
                    check_out_time=time(17, 0, 0),
                    attendance_status="present",
                    attendance_source="manual",
                    latitude=None,
                    longitude=None,
                ))
        db.commit()
        print(f"    -> Duplicate enrolment: 12 beneficiaries in both {main_batch.batch_code} and {other_batch.batch_code}")

    # ANOMALY 3: Trainer conflict -- Trainer 1 also in another centre's batch same dates
    if other_batch:
        other_batch.trainer_id = trainers[0].id  # assign same trainer
        for day in c07_att_days[:10]:
            # Trainer at Centre 07
            db.add(TrainerAttendance(
                trainer_id=trainers[0].id,
                batch_id=main_batch.id,
                date=day,
                check_in_time=time(8, 55, 0),
                check_out_time=time(17, 5, 0),
                latitude=c07.latitude,
                longitude=c07.longitude,
            ))
            # Same trainer at other centre (overlapping) -- CONFLICT
            db.add(TrainerAttendance(
                trainer_id=trainers[0].id,
                batch_id=other_batch.id,
                date=day,
                check_in_time=time(9, 0, 0),
                check_out_time=time(17, 0, 0),
                latitude=other_centre.latitude,
                longitude=other_centre.longitude,
            ))
        db.commit()
        print(f"    -> Trainer conflict: Trainer '{trainers[0].name}' at 2 centres simultaneously")

    # ANOMALY 4: 3 Evidence records with identical hash (duplicate photo)
    DUPLICATE_HASH = "aabbccdd11223344"
    for ei in range(3):
        db.add(Evidence(
            batch_id=(c07_batches[ei % len(c07_batches)]).id,
            evidence_type="photo",
            file_path=f"/evidence/c07_monitoring_{ei+1}.jpg",
            uploaded_at=datetime.now() - timedelta(days=ei * 5),
            captured_at=datetime.now() - timedelta(days=ei * 5 + 1),
            latitude=c07.latitude,
            longitude=c07.longitude,
            image_hash=DUPLICATE_HASH,
            source="upload",
        ))
    db.commit()
    print(f"    -> Duplicate evidence: 3 images with identical hash '{DUPLICATE_HASH}'")

    # ANOMALY 5: 8 Placements before batch end date
    place_batch = c07_batches[-1] if len(c07_batches) > 1 else c07_batches[0]
    # Make sure this batch has future end date
    place_batch.end_date = date.today() + timedelta(days=30)
    db.flush()
    for ben in c07_bens[:8]:
        db.add(Placement(
            beneficiary_id=ben.id,
            batch_id=place_batch.id,
            employer_name="QuickJob Solutions",
            employment_type="full_time",
            placement_date=date.today() - timedelta(days=5),  # BEFORE end_date -> anomaly
            salary=15000,
            verification_status="pending",
        ))
    db.commit()
    print(f"    -> Pre-completion placements: 8 placements before batch end date ({place_batch.end_date})")

    # ANOMALY 6: Pre-seed Anomaly records for Centre 07
    c07_anomaly_seeds = [
        Anomaly(
            entity_type="centre",
            entity_id=c07.id,
            anomaly_type="duplicate_enrolment_match",
            severity="high",
            description="12 beneficiaries simultaneously enrolled and marked present in another active batch (National Skill Centre 04)",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "affected_beneficiaries": 12,
                "conflicting_batch": other_batch.batch_code if other_batch else "NSC-04-B01",
                "overlap_days": len(c07_att_days[:5]),
            }),
            status="open",
            related_entity_type="batch",
            related_entity_id=other_batch.id if other_batch else None,
        ),
        Anomaly(
            entity_type="trainer",
            entity_id=trainers[0].id,
            anomaly_type="trainer_conflict",
            severity="high",
            description=f"Trainer '{trainers[0].name}' (TR-001) recorded at CIVIS Training Centre 07 and another centre at overlapping times on 10 dates",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "trainer_name": trainers[0].name,
                "batch_1": main_batch.batch_code,
                "batch_2": other_batch.batch_code if other_batch else "NSC-04-B01",
                "conflicting_dates": 10,
            }),
            status="open",
        ),
        Anomaly(
            entity_type="batch",
            entity_id=main_batch.id,
            anomaly_type="duplicate_evidence",
            severity="high",
            description="3 monitoring evidence photos uploaded with identical perceptual hash (aabbccdd11223344) -- possible reused image",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "duplicate_count": 3,
                "image_hash": DUPLICATE_HASH,
                "batch_code": main_batch.batch_code,
            }),
            status="open",
        ),
        Anomaly(
            entity_type="batch",
            entity_id=main_batch.id,
            anomaly_type="perfect_attendance_pattern",
            severity="medium",
            description=f"Statistically unusual attendance: all 50 beneficiaries show 100% attendance for {len(c07_att_days)} consecutive days. All check-in at exactly 09:00:00.",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "total_enrolled": 50,
                "perfect_attendees": 50,
                "days_span": len(c07_att_days),
                "identical_checkin_time": "09:00:00",
                "batch_code": main_batch.batch_code,
            }),
            status="open",
        ),
        Anomaly(
            entity_type="batch",
            entity_id=place_batch.id,
            anomaly_type="placement_before_completion",
            severity="high",
            description=f"8 placements claimed before batch end date ({place_batch.end_date}). Placements dated {date.today() - timedelta(days=5)} -- 35 days before course completes.",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "placement_count": 8,
                "placement_date": str(date.today() - timedelta(days=5)),
                "batch_end_date": str(place_batch.end_date),
                "days_before_completion": 35,
            }),
            status="open",
        ),
        Anomaly(
            entity_type="centre",
            entity_id=c07.id,
            anomaly_type="inspection_overdue",
            severity="low",
            description="Last inspection was 470 days ago (overdue by 105 days). Minimum inspection frequency: 365 days.",
            detected_at=datetime.now(),
            evidence=json.dumps({
                "last_inspection_date": str(date.today() - timedelta(days=470)),
                "days_since": 470,
                "overdue_by": 105,
            }),
            status="open",
        ),
    ]
    for a in c07_anomaly_seeds:
        db.add(a)
    db.commit()

    # Centre 07 Risk Score
    db.add(RiskScore(
        entity_type="centre",
        entity_id=c07.id,
        score=89,
        risk_level="critical",
        calculated_at=datetime.now(),
        reasons=json.dumps([
            {"factor": "duplicate_enrolment_match", "contribution": 25,
             "description": "12 beneficiaries simultaneously enrolled and present in another centre"},
            {"factor": "duplicate_evidence", "contribution": 20,
             "description": "3 evidence images with identical perceptual hash"},
            {"factor": "perfect_attendance_pattern", "contribution": 15,
             "description": "All 50 beneficiaries at 100% attendance, identical check-in time"},
            {"factor": "placement_before_completion", "contribution": 12,
             "description": "8 placements claimed before course completion date"},
            {"factor": "trainer_conflict", "contribution": 10,
             "description": "Trainer recorded at two centres simultaneously"},
            {"factor": "inspection_overdue", "contribution": 7,
             "description": "Last inspection 470 days ago (overdue by 105 days)"},
        ]),
    ))
    db.commit()
    print(f"    -> Risk Score: 89/100 CRITICAL -- 6 anomalies seeded")

    # ??????????????????????????????????????????????
    # CORRECTIVE ACTIONS (sample)
    # ??????????????????????????????????????????????
    anomalies_for_actions = db.query(Anomaly).filter(
        Anomaly.severity.in_(["critical", "high"]),
        Anomaly.entity_type == "centre",
    ).limit(5).all()

    for a in anomalies_for_actions:
        db.add(CorrectiveAction(
            anomaly_id=a.id,
            centre_id=a.entity_id,
            responsible_person=fake.name(),
            action_required="Review and verify the flagged records. Submit supporting documentation within deadline.",
            deadline=date.today() + timedelta(days=random.choice([15, 30, 45])),
            severity=a.severity,
            status=random.choice(["open", "in_progress", "open"]),
            verified=False,
            created_at=datetime.now(),
        ))
    db.commit()

    # ??????????????????????????????????????????????
    # ADDITIONAL ANOMALIES for 3 other high-risk centres
    # ??????????????????????????????????????????????
    for centre in centres[1:4]:
        rs = db.query(RiskScore).filter(
            RiskScore.entity_type == "centre",
            RiskScore.entity_id == centre.id,
        ).first()
        if rs and rs.score >= 60:
            db.add(Anomaly(
                entity_type="centre",
                entity_id=centre.id,
                anomaly_type="attendance_anomaly",
                severity="medium",
                description="Unusual attendance spike detected 3 days before assessment date",
                detected_at=datetime.now() - timedelta(days=random.randint(5, 30)),
                evidence=json.dumps({"spike_pct": random.randint(15, 30)}),
                status="open",
            ))
    db.commit()

    total_att = db.query(Attendance).count()
    total_anomalies = db.query(Anomaly).count()
    print(f"\n[OK] Seeding complete!")
    print(f"   Centres:      {db.query(TrainingCentre).count()}")
    print(f"   Batches:      {db.query(TrainingBatch).count()}")
    print(f"   Beneficiaries:{db.query(Beneficiary).count()}")
    print(f"   Enrolments:   {db.query(BeneficiaryEnrolment).count()}")
    print(f"   Attendance:   {total_att}")
    print(f"   Assessments:  {db.query(Assessment).count()}")
    print(f"   Placements:   {db.query(Placement).count()}")
    print(f"   Payments:     {db.query(Payment).count()}")
    print(f"   Evidence:     {db.query(Evidence).count()}")
    print(f"   Anomalies:    {total_anomalies}")
    print(f"   Risk Scores:  {db.query(RiskScore).count()}")
    db.close()


if __name__ == "__main__":
    seed_db()
