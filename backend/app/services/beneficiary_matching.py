"""
Beneficiary Matching Engine.
Detects possible duplicate/related beneficiaries using token matching and fuzzy name similarity.
Flags conflicting/impossible enrolment overlaps.
"""
import json
from datetime import datetime
from difflib import SequenceMatcher
from sqlalchemy.orm import Session

from app.models.beneficiary import Beneficiary, BeneficiaryEnrolment
from app.models.attendance import Attendance
from app.models.anomaly import Anomaly
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.services.geo_validator import haversine_distance


def name_similarity(a: str, b: str) -> float:
    """Return name similarity 0-100 using SequenceMatcher."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() * 100


def compute_match_confidence(b1: Beneficiary, b2: Beneficiary, cfg: dict) -> tuple[float, list[str]]:
    """
    Compute confidence score 0-100 and list of reasons.
    Weights from config.
    """
    name_w = cfg.get("name_similarity_weight", 0.4)
    mobile_w = cfg.get("mobile_token_weight", 0.3)
    bank_w = cfg.get("bank_token_weight", 0.2)
    age_w = cfg.get("age_weight", 0.1)

    score = 0.0
    reasons = []

    # Mobile token exact match
    if b1.mobile_token == b2.mobile_token:
        score += mobile_w * 100
        reasons.append(f"Same mobile token ({b1.mobile_token})")

    # Bank token exact match
    if b1.bank_account_token == b2.bank_account_token:
        score += bank_w * 100
        reasons.append(f"Same bank account token ({b1.bank_account_token})")

    # Name similarity
    ns = name_similarity(b1.name, b2.name)
    score += name_w * ns
    if ns > 80:
        reasons.append(f"Name similarity {ns:.0f}% ('{b1.name}' vs '{b2.name}')")

    # Age match
    if b1.age == b2.age:
        score += age_w * 100
        reasons.append(f"Same age ({b1.age})")
    elif abs(b1.age - b2.age) <= 1:
        score += age_w * 50
        reasons.append(f"Similar age ({b1.age} vs {b2.age})")

    # District match bonus
    if b1.district == b2.district:
        score = min(100, score + 5)
        reasons.append(f"Same district ({b1.district})")

    return round(min(100, score), 1), reasons


def check_enrolment_conflict(b1_id: int, b2_id: int, db: Session) -> tuple[bool, str | None]:
    """
    Check if two matched beneficiaries have conflicting enrolments.
    Returns (is_conflict, description).
    """
    enrolments_1 = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.beneficiary_id == b1_id,
        BeneficiaryEnrolment.status == "active",
    ).all()
    enrolments_2 = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.beneficiary_id == b2_id,
        BeneficiaryEnrolment.status == "active",
    ).all()

    if not enrolments_1 or not enrolments_2:
        return False, None

    # Check for overlapping batch dates
    for e1 in enrolments_1:
        batch1 = db.query(TrainingBatch).filter(TrainingBatch.id == e1.batch_id).first()
        for e2 in enrolments_2:
            batch2 = db.query(TrainingBatch).filter(TrainingBatch.id == e2.batch_id).first()
            if not batch1 or not batch2 or batch1.id == batch2.id:
                continue
            # Check date overlap
            if batch1.start_date <= batch2.end_date and batch2.start_date <= batch1.end_date:
                return True, (
                    f"Same beneficiary enrolled in overlapping batches: "
                    f"{batch1.batch_code} and {batch2.batch_code}"
                )

    return False, None


def run_matching(db: Session, cfg: dict | None = None) -> list[dict]:
    """
    Run full beneficiary matching and store results as Anomaly records.
    Returns list of match result dicts.
    """
    if cfg is None:
        cfg = {
            "high_match_threshold": 85,
            "possible_match_threshold": 60,
            "name_similarity_weight": 0.4,
            "mobile_token_weight": 0.3,
            "bank_token_weight": 0.2,
            "age_weight": 0.1,
        }

    # Clear old matching anomalies
    db.query(Anomaly).filter(
        Anomaly.anomaly_type.in_(["beneficiary_match_high", "beneficiary_match_possible", "duplicate_enrolment_match"])
    ).delete(synchronize_session=False)
    db.commit()

    beneficiaries = db.query(Beneficiary).all()
    results = []
    seen_pairs = set()

    # Group by mobile token first (fast path for exact matches)
    mobile_groups: dict[str, list[Beneficiary]] = {}
    for b in beneficiaries:
        if b.mobile_token not in mobile_groups:
            mobile_groups[b.mobile_token] = []
        mobile_groups[b.mobile_token].append(b)

    # Group by bank token
    bank_groups: dict[str, list[Beneficiary]] = {}
    for b in beneficiaries:
        if b.bank_account_token not in bank_groups:
            bank_groups[b.bank_account_token] = []
        bank_groups[b.bank_account_token].append(b)

    candidate_pairs: set[tuple[int, int]] = set()

    for group in list(mobile_groups.values()) + list(bank_groups.values()):
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    pair = (min(group[i].id, group[j].id), max(group[i].id, group[j].id))
                    candidate_pairs.add(pair)

    for b1_id, b2_id in candidate_pairs:
        if (b1_id, b2_id) in seen_pairs:
            continue
        seen_pairs.add((b1_id, b2_id))

        b1 = db.query(Beneficiary).filter(Beneficiary.id == b1_id).first()
        b2 = db.query(Beneficiary).filter(Beneficiary.id == b2_id).first()
        if not b1 or not b2:
            continue

        confidence, reasons = compute_match_confidence(b1, b2, cfg)

        if confidence < cfg["possible_match_threshold"]:
            continue

        if confidence >= 95:
            match_level = "exact"
        elif confidence >= cfg["high_match_threshold"]:
            match_level = "high"
        else:
            match_level = "possible"

        is_conflict, conflict_desc = check_enrolment_conflict(b1_id, b2_id, db)

        result = {
            "beneficiary_a_id": b1_id,
            "beneficiary_b_id": b2_id,
            "beneficiary_a_token": b1.beneficiary_token,
            "beneficiary_b_token": b2.beneficiary_token,
            "beneficiary_a_name": b1.name,
            "beneficiary_b_name": b2.name,
            "confidence_score": confidence,
            "match_level": match_level,
            "reasons": reasons,
            "is_conflict": is_conflict,
            "conflict_description": conflict_desc,
        }
        results.append(result)

        # Store as Anomaly
        if is_conflict:
            anomaly_type = "duplicate_enrolment_match"
            severity = "high"
            desc = conflict_desc or f"Possible duplicate beneficiary with {confidence:.0f}% confidence"
        elif match_level == "exact":
            anomaly_type = "beneficiary_match_high"
            severity = "high"
            desc = f"Exact match detected: {b1.beneficiary_token} and {b2.beneficiary_token}"
        else:
            anomaly_type = "beneficiary_match_possible"
            severity = "medium"
            desc = f"Possible match ({confidence:.0f}% confidence): {b1.beneficiary_token} and {b2.beneficiary_token}"

        evidence_data = json.dumps({
            "confidence": confidence,
            "match_level": match_level,
            "reasons": reasons,
            "conflict_description": conflict_desc,
        })

        db.add(
            Anomaly(
                entity_type="beneficiary",
                entity_id=b1_id,
                anomaly_type=anomaly_type,
                severity=severity,
                description=desc,
                detected_at=datetime.now(),
                evidence=evidence_data,
                status="open",
                related_entity_type="beneficiary",
                related_entity_id=b2_id,
            )
        )

    db.commit()
    return results
