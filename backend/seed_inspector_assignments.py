"""
CIVIS — Seed sample inspection assignments for demo inspectors.
Run AFTER seed_data.py and seed_users.py.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Inspection, TrainingCentre, Notification
import datetime
import random

def seed_inspector_assignments():
    db = SessionLocal()
    try:
        # Check if inspections already have employee_id-style inspector_name
        existing = db.query(Inspection).filter(
            Inspection.inspector_name.like("INS-%")
        ).count()
        if existing > 0:
            print(f"  [SKIP] {existing} inspections already assigned to INS-* inspectors")
            db.close()
            return

        # Get centres for assignment
        centres = db.query(TrainingCentre).all()
        if not centres:
            print("  [SKIP] No centres found - run seed_data.py first")
            db.close()
            return

        inspectors = [
            {"id": "INS-PUN-001", "name": "Aarav Sharma"},
            {"id": "INS-PUN-002", "name": "Neha Patil"},
            {"id": "INS-PUN-003", "name": "Rohan Deshmukh"},
            {"id": "INS-PUN-004", "name": "Sneha Kulkarni"},
            {"id": "INS-PUN-005", "name": "Aditya Joshi"},
        ]

        now = datetime.datetime.utcnow()
        inspection_records = []

        # Assign 2-4 inspections per inspector
        for idx, insp in enumerate(inspectors):
            # One pending upcoming inspection
            inspection_records.append(Inspection(
                centre_id=centres[idx % len(centres)].id,
                batch_id=None,
                inspector_name=insp["id"],
                inspection_date=now + datetime.timedelta(days=random.randint(3, 14)),
                actual_people_found=None,
                findings=None,
                compliance_status="pending",
                status="scheduled",
                duration_minutes=None,
                checklist=None,
            ))

            # One in-progress inspection
            if idx < 3:
                inspection_records.append(Inspection(
                    centre_id=centres[(idx + 2) % len(centres)].id,
                    batch_id=None,
                    inspector_name=insp["id"],
                    inspection_date=now - datetime.timedelta(days=random.randint(0, 2)),
                    actual_people_found=None,
                    findings=None,
                    compliance_status="pending",
                    status="in_progress",
                    duration_minutes=None,
                    checklist=None,
                ))

            # 1-2 completed inspections
            for j in range(random.randint(1, 2)):
                inspection_records.append(Inspection(
                    centre_id=centres[(idx + j + 5) % len(centres)].id,
                    batch_id=None,
                    inspector_name=insp["id"],
                    inspection_date=now - datetime.timedelta(days=random.randint(15, 60)),
                    actual_people_found=random.randint(20, 45),
                    findings='{"summary": "Routine inspection completed."}',
                    compliance_status=random.choice(["compliant", "partially_compliant"]),
                    status="submitted",
                    duration_minutes=random.randint(45, 120),
                    checklist='{"infrastructure": true, "attendance_register": true, "trainer_present": true}',
                ))

        db.add_all(inspection_records)

        # Add some notifications for inspectors
        notifications = []
        for insp in inspectors[:3]:
            notifications.append(Notification(
                recipient_employee_id=insp["id"],
                title="New Inspection Assigned",
                message=f"You have been assigned a new inspection. Please review your schedule.",
                notification_type="info",
                related_entity_type="Inspection",
                is_read=False,
            ))
        notifications.append(Notification(
            recipient_employee_id="MO-PUN-001",
            title="Inspection Report Submitted",
            message="INS-PUN-001 (Aarav Sharma) has submitted an inspection report for review.",
            notification_type="info",
            related_entity_type="Inspection",
            is_read=False,
        ))
        db.add_all(notifications)

        db.commit()
        print(f"  [CREATE] {len(inspection_records)} inspector-assigned inspections")
        print(f"  [CREATE] {len(notifications)} notifications")
        print("Inspector assignment seed complete.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding inspector assignments...")
    seed_inspector_assignments()
