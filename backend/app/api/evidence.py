"""Evidence router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.evidence import Evidence
from app.models.anomaly import Anomaly

router = APIRouter(tags=["Evidence"])

@router.get("/evidence")
def list_evidence(batch_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Evidence)
    if batch_id:
        q = q.filter(Evidence.batch_id == batch_id)
    records = q.all()
    dup_hashes = set()
    dup_anomalies = db.query(Anomaly).filter(Anomaly.anomaly_type == "duplicate_evidence").all()
    for a in dup_anomalies:
        import json
        try:
            ev = json.loads(a.evidence) if a.evidence else {}
            if "image_hash" in ev:
                dup_hashes.add(ev["image_hash"])
        except Exception:
            pass
    return [{
        "id": e.id, "batch_id": e.batch_id, "evidence_type": e.evidence_type,
        "file_path": e.file_path, "uploaded_at": str(e.uploaded_at),
        "captured_at": str(e.captured_at) if e.captured_at else None,
        "latitude": e.latitude, "longitude": e.longitude,
        "image_hash": e.image_hash, "source": e.source,
        "is_flagged": e.image_hash in dup_hashes if e.image_hash else False,
    } for e in records]
