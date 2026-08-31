"""
Evidence Analyzer — detects duplicate images, geo mismatches, and unusual upload patterns.
Uses perceptual hash comparison (stored in DB as strings) — no actual image files required for demo.
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.models.batch import TrainingBatch
from app.models.centre import TrainingCentre
from app.models.anomaly import Anomaly
from app.services.geo_validator import haversine_distance


def _hamming_distance(hash1: str, hash2: str) -> int:
    """Compute bit-level Hamming distance between two hex hash strings."""
    try:
        h1 = int(hash1, 16)
        h2 = int(hash2, 16)
        xor = h1 ^ h2
        return bin(xor).count("1")
    except (ValueError, TypeError):
        # Fall back to character comparison
        return sum(c1 != c2 for c1, c2 in zip(str(hash1), str(hash2)))


def hash_similarity(hash1: str, hash2: str) -> float:
    """Return similarity 0-100 between two perceptual hashes."""
    if not hash1 or not hash2:
        return 0.0
    if hash1 == hash2:
        return 100.0
    max_bits = max(len(hash1), len(hash2)) * 4  # hex chars -> bits
    dist = _hamming_distance(hash1[:16], hash2[:16])  # compare first 16 chars
    return max(0.0, round((1 - dist / max(1, max_bits)) * 100, 1))


def _clear_evidence_anomalies(db: Session):
    db.query(Anomaly).filter(
        Anomaly.anomaly_type.in_(["duplicate_evidence", "evidence_geo_mismatch", "evidence_upload_anomaly"])
    ).delete(synchronize_session=False)
    db.commit()


def check_duplicate_hashes(db: Session, cfg: dict) -> list[dict]:
    """Find evidence records with identical or near-identical image hashes."""
    threshold = cfg.get("duplicate_hash_similarity_threshold", 90)

    all_evidence = db.query(Evidence).filter(Evidence.image_hash.isnot(None)).all()
    anomalies = []
    flagged_pairs = set()

    for i in range(len(all_evidence)):
        for j in range(i + 1, len(all_evidence)):
            e1, e2 = all_evidence[i], all_evidence[j]
            if e1.batch_id == e2.batch_id and e1.id == e2.id:
                continue

            sim = hash_similarity(e1.image_hash, e2.image_hash)
            if sim >= threshold:
                pair = (min(e1.id, e2.id), max(e1.id, e2.id))
                if pair in flagged_pairs:
                    continue
                flagged_pairs.add(pair)

                desc = (
                    f"Possible reused evidence: Image {e1.id} and Image {e2.id} "
                    f"are {sim:.0f}% similar (hash match)"
                )
                evidence_data = json.dumps({
                    "evidence_id_1": e1.id,
                    "evidence_id_2": e2.id,
                    "batch_id_1": e1.batch_id,
                    "batch_id_2": e2.batch_id,
                    "similarity_pct": sim,
                    "hash_1": e1.image_hash,
                    "hash_2": e2.image_hash,
                    "uploaded_at_1": str(e1.uploaded_at),
                    "uploaded_at_2": str(e2.uploaded_at),
                })
                db.add(Anomaly(
                    entity_type="batch",
                    entity_id=e1.batch_id,
                    anomaly_type="duplicate_evidence",
                    severity="high",
                    description=desc,
                    detected_at=datetime.now(),
                    evidence=evidence_data,
                    status="open",
                    related_entity_type="batch",
                    related_entity_id=e2.batch_id,
                ))
                anomalies.append({
                    "evidence_id_1": e1.id,
                    "evidence_id_2": e2.id,
                    "similarity": sim,
                })

    db.commit()
    return anomalies


def check_evidence_geo(db: Session, cfg: dict) -> list[dict]:
    """Flag evidence uploaded from locations far outside the training centre."""
    radius = cfg.get("geo_radius_metres", 1000)

    anomalies = []
    batch_centre: dict = {b.id: b.centre_id for b in db.query(TrainingBatch).all()}
    centres_map = {}
    for centre in db.query(TrainingCentre).all():
        if centre.latitude and centre.longitude:
            centres_map[centre.id] = (centre.latitude, centre.longitude, centre.centre_name)

    all_evidence = db.query(Evidence).filter(
        Evidence.latitude.isnot(None),
        Evidence.longitude.isnot(None),
    ).all()

    for e in all_evidence:
        c_id = batch_centre.get(e.batch_id)
        if not c_id:
            continue
        coords = centres_map.get(c_id)
        if not coords:
            continue

        dist = haversine_distance(coords[0], coords[1], e.latitude, e.longitude)
        if dist > radius:
            desc = (
                f"Evidence geo mismatch: Upload location is {dist/1000:.1f}km from "
                f"'{coords[2]}' (allowed radius: {radius}m)"
            )
            evidence_data = json.dumps({
                "evidence_id": e.id,
                "distance_metres": round(dist),
                "evidence_lat": e.latitude,
                "evidence_lon": e.longitude,
                "centre_name": coords[2],
                "allowed_radius": radius,
            })
            db.add(Anomaly(
                entity_type="batch",
                entity_id=e.batch_id,
                anomaly_type="evidence_geo_mismatch",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=evidence_data,
                status="open",
            ))
            anomalies.append({"evidence_id": e.id, "distance_metres": round(dist)})

    db.commit()
    return anomalies


def analyze_evidence(db: Session, cfg: dict = None) -> dict:
    if cfg is None:
        cfg = {
            "duplicate_hash_similarity_threshold": 90,
            "geo_radius_metres": 1000,
        }

    _clear_evidence_anomalies(db)

    return {
        "duplicate_images": len(check_duplicate_hashes(db, cfg)),
        "geo_mismatches": len(check_evidence_geo(db, cfg)),
    }
