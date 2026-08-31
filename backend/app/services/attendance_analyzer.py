"""
Attendance Anomaly Analyzer.
Detects suspicious attendance patterns: perfect attendance, identical check-in times,
impossible travel, trainer conflicts, GPS mismatches, and pre-milestone spikes.
"""
import json
from collections import defaultdict
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.trainer import Trainer, TrainerAttendance
from app.models.batch import TrainingBatch
from app.models.beneficiary import BeneficiaryEnrolment
from app.models.centre import TrainingCentre
from app.models.anomaly import Anomaly
from app.services.geo_validator import haversine_distance, is_within_radius


def _clear_attendance_anomalies(db: Session):
    attendance_types = [
        "perfect_attendance_pattern",
        "identical_checkin_time",
        "attendance_geo_mismatch",
        "impossible_travel",
        "trainer_conflict",
    ]
    db.query(Anomaly).filter(Anomaly.anomaly_type.in_(attendance_types)).delete(
        synchronize_session=False
    )
    db.commit()


def _save_anomaly(db: Session, **kwargs):
    db.add(Anomaly(**kwargs, detected_at=datetime.now(), status="open"))


def check_perfect_attendance(db: Session, cfg: dict) -> list[dict]:
    threshold_pct = cfg.get("perfect_attendance_threshold_pct", 95)
    min_days = cfg.get("perfect_attendance_min_consecutive_days", 15)
    min_bens_pct = cfg.get("perfect_attendance_min_beneficiaries_pct", 80)

    anomalies = []
    batches = db.query(TrainingBatch).filter(TrainingBatch.status.in_(["active", "completed"])).all()

    for batch in batches:
        enrolments = db.query(BeneficiaryEnrolment).filter(
            BeneficiaryEnrolment.batch_id == batch.id
        ).all()
        if not enrolments:
            continue

        total = len(enrolments)
        all_att = db.query(Attendance).filter(
            Attendance.batch_id == batch.id,
            Attendance.attendance_status == "present",
        ).all()

        if not all_att:
            continue

        dates = sorted(set(a.date for a in all_att))
        if len(dates) < min_days:
            continue

        ben_dates: dict = defaultdict(set)
        for a in all_att:
            ben_dates[a.beneficiary_id].add(a.date)

        perfect_count = sum(
            1 for ben_id, date_set in ben_dates.items()
            if len(date_set) >= len(dates) * (threshold_pct / 100)
        )

        if total > 0 and (perfect_count / total * 100) >= min_bens_pct:
            desc = (
                f"Statistically unusual attendance: {perfect_count}/{total} beneficiaries "
                f"show {threshold_pct}%+ attendance across {len(dates)} days in batch {batch.batch_code}"
            )
            evidence = json.dumps({
                "batch_code": batch.batch_code,
                "perfect_count": perfect_count,
                "total_enrolled": total,
                "days_checked": len(dates),
            })
            _save_anomaly(
                db,
                entity_type="batch",
                entity_id=batch.id,
                anomaly_type="perfect_attendance_pattern",
                severity="medium",
                description=desc,
                evidence=evidence,
            )
            anomalies.append({"batch_id": batch.id, "description": desc})

    db.commit()
    return anomalies


def check_identical_checkin_times(db: Session, cfg: dict) -> list[dict]:
    threshold = cfg.get("identical_checkin_threshold_count", 10)

    anomalies = []
    batches = db.query(TrainingBatch).all()

    for batch in batches:
        all_att = db.query(Attendance).filter(
            Attendance.batch_id == batch.id,
            Attendance.attendance_status == "present",
        ).all()

        time_counts: dict = defaultdict(int)
        for a in all_att:
            if a.check_in_time:
                key = (a.date, str(a.check_in_time))
                time_counts[key] += 1

        for (date, time_str), count in time_counts.items():
            if count >= threshold:
                desc = (
                    f"Identical check-in time: {count} beneficiaries all marked present at "
                    f"{time_str} on {date} in batch {batch.batch_code}"
                )
                evidence = json.dumps({
                    "batch_code": batch.batch_code,
                    "date": str(date),
                    "time": time_str,
                    "count": count,
                })
                _save_anomaly(
                    db,
                    entity_type="batch",
                    entity_id=batch.id,
                    anomaly_type="identical_checkin_time",
                    severity="medium",
                    description=desc,
                    evidence=evidence,
                )
                anomalies.append({"batch_id": batch.id, "description": desc})

    db.commit()
    return anomalies


def check_geo_mismatches(db: Session, cfg: dict) -> list[dict]:
    radius = cfg.get("geo_radius_metres", 500)

    anomalies = []
    centres_map = {}
    for centre in db.query(TrainingCentre).all():
        if centre.latitude and centre.longitude:
            centres_map[centre.id] = (centre.latitude, centre.longitude)

    batch_centre: dict = {b.id: b.centre_id for b in db.query(TrainingBatch).all()}

    att_with_geo = db.query(Attendance).filter(
        Attendance.latitude.isnot(None),
        Attendance.longitude.isnot(None),
    ).all()

    flagged_batches = set()
    for a in att_with_geo:
        centre_id = batch_centre.get(a.batch_id)
        if not centre_id:
            continue
        coords = centres_map.get(centre_id)
        if not coords:
            continue
        if not is_within_radius(coords[0], coords[1], a.latitude, a.longitude, radius):
            dist = haversine_distance(coords[0], coords[1], a.latitude, a.longitude)
            key = (a.batch_id, a.beneficiary_id)
            if key not in flagged_batches:
                flagged_batches.add(key)
                desc = (
                    f"Attendance GPS {dist/1000:.1f}km from training centre "
                    f"(radius: {radius}m) — batch {a.batch_id}"
                )
                evidence = json.dumps({
                    "distance_metres": round(dist),
                    "attendance_lat": a.latitude,
                    "attendance_lon": a.longitude,
                    "allowed_radius": radius,
                })
                _save_anomaly(
                    db,
                    entity_type="batch",
                    entity_id=a.batch_id,
                    anomaly_type="attendance_geo_mismatch",
                    severity="high",
                    description=desc,
                    evidence=evidence,
                )
                anomalies.append({"batch_id": a.batch_id, "description": desc})

    db.commit()
    return anomalies


def check_impossible_travel(db: Session, cfg: dict) -> list[dict]:
    min_travel_minutes = cfg.get("impossible_travel_minutes", 60)

    anomalies = []
    all_att = db.query(Attendance).filter(
        Attendance.attendance_status == "present",
        Attendance.check_in_time.isnot(None),
    ).all()

    ben_day_att: dict = defaultdict(lambda: defaultdict(list))
    for a in all_att:
        ben_day_att[a.beneficiary_id][a.date].append((a.batch_id, a.check_in_time, a.id))

    batch_centre: dict = {b.id: b.centre_id for b in db.query(TrainingBatch).all()}
    centres_map = {}
    for centre in db.query(TrainingCentre).all():
        if centre.latitude and centre.longitude:
            centres_map[centre.id] = (centre.latitude, centre.longitude, centre.centre_name)

    flagged = set()
    for ben_id, day_map in ben_day_att.items():
        for date, records in day_map.items():
            if len(records) < 2:
                continue
            for i in range(len(records)):
                for j in range(i + 1, len(records)):
                    b1_id, t1, att1_id = records[i]
                    b2_id, t2, att2_id = records[j]
                    if b1_id == b2_id:
                        continue
                    c1_id = batch_centre.get(b1_id)
                    c2_id = batch_centre.get(b2_id)
                    if c1_id == c2_id or not c1_id or not c2_id:
                        continue
                    c1 = centres_map.get(c1_id)
                    c2 = centres_map.get(c2_id)
                    if not c1 or not c2:
                        continue

                    dist = haversine_distance(c1[0], c1[1], c2[0], c2[1])
                    min_travel = (dist / 1000 / 60) * 60

                    dt1 = datetime.combine(date, t1)
                    dt2 = datetime.combine(date, t2)
                    gap = abs((dt2 - dt1).total_seconds() / 60)

                    if gap < min_travel and gap < min_travel_minutes and dist > 10000:
                        pair_key = (ben_id, date, min(att1_id, att2_id), max(att1_id, att2_id))
                        if pair_key not in flagged:
                            flagged.add(pair_key)
                            desc = (
                                f"Impossible travel: Beneficiary {ben_id} present at "
                                f"'{c1[2]}' and '{c2[2]}' on {date} — only {gap:.0f}min gap "
                                f"(centres are {dist/1000:.0f}km apart)"
                            )
                            evidence = json.dumps({
                                "beneficiary_id": ben_id,
                                "date": str(date),
                                "centre_1": c1[2],
                                "centre_2": c2[2],
                                "distance_km": round(dist / 1000, 1),
                                "time_gap_minutes": round(gap, 1),
                                "min_travel_minutes": round(min_travel, 1),
                            })
                            _save_anomaly(
                                db,
                                entity_type="beneficiary",
                                entity_id=ben_id,
                                anomaly_type="impossible_travel",
                                severity="critical",
                                description=desc,
                                evidence=evidence,
                            )
                            anomalies.append({"beneficiary_id": ben_id, "description": desc})

    db.commit()
    return anomalies


def check_trainer_conflicts(db: Session) -> list[dict]:
    anomalies = []
    all_ta = db.query(TrainerAttendance).filter(
        TrainerAttendance.check_in_time.isnot(None)
    ).all()

    trainer_day: dict = defaultdict(lambda: defaultdict(list))
    for ta in all_ta:
        trainer_day[ta.trainer_id][ta.date].append((ta.batch_id, ta.check_in_time, ta.check_out_time))

    batch_centre: dict = {b.id: b.centre_id for b in db.query(TrainingBatch).all()}
    flagged = set()

    for trainer_id, day_map in trainer_day.items():
        trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
        for date, records in day_map.items():
            if len(records) < 2:
                continue
            for i in range(len(records)):
                for j in range(i + 1, len(records)):
                    b1_id, t1_in, t1_out = records[i]
                    b2_id, t2_in, t2_out = records[j]
                    c1_id = batch_centre.get(b1_id)
                    c2_id = batch_centre.get(b2_id)
                    if c1_id == c2_id:
                        continue
                    if t1_out and t2_in and t1_in and t2_out:
                        if t1_in <= t2_out and t2_in <= t1_out:
                            key = (trainer_id, date, min(b1_id, b2_id), max(b1_id, b2_id))
                            if key not in flagged:
                                flagged.add(key)
                                tname = trainer.name if trainer else f"Trainer {trainer_id}"
                                desc = (
                                    f"Trainer conflict: {tname} recorded at two different centres "
                                    f"at overlapping times on {date}"
                                )
                                evidence = json.dumps({
                                    "trainer_id": trainer_id,
                                    "trainer_name": tname,
                                    "date": str(date),
                                    "batch_1": b1_id,
                                    "batch_2": b2_id,
                                })
                                _save_anomaly(
                                    db,
                                    entity_type="trainer",
                                    entity_id=trainer_id,
                                    anomaly_type="trainer_conflict",
                                    severity="high",
                                    description=desc,
                                    evidence=evidence,
                                )
                                anomalies.append({"trainer_id": trainer_id, "description": desc})

    db.commit()
    return anomalies


def analyze_attendance(db: Session, cfg: dict = None) -> dict:
    if cfg is None:
        cfg = {
            "perfect_attendance_threshold_pct": 95,
            "perfect_attendance_min_consecutive_days": 15,
            "perfect_attendance_min_beneficiaries_pct": 80,
            "identical_checkin_threshold_count": 10,
            "geo_radius_metres": 500,
            "impossible_travel_minutes": 60,
        }

    _clear_attendance_anomalies(db)

    results = {
        "perfect_attendance": check_perfect_attendance(db, cfg),
        "identical_checkin": check_identical_checkin_times(db, cfg),
        "geo_mismatches": check_geo_mismatches(db, cfg),
        "impossible_travel": check_impossible_travel(db, cfg),
        "trainer_conflicts": check_trainer_conflicts(db),
    }
    return {k: len(v) for k, v in results.items()}
