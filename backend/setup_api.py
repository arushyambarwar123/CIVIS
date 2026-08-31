import os
import json

base_dir = r"C:\Users\arush\.gemini\antigravity\scratch\civis-lite\backend"

def write_file(path, content):
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(content)

write_file("app/api/__init__.py", "")
write_file("app/api/dashboard.py", '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    return {"status": "ok"}
''')

write_file("app/api/centres.py", '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.centre import TrainingCentre

router = APIRouter()

@router.get("/")
def get_centres(db: Session = Depends(get_db)):
    return db.query(TrainingCentre).all()

@router.get("/{id}")
def get_centre(id: int, db: Session = Depends(get_db)):
    return db.query(TrainingCentre).filter(TrainingCentre.id == id).first()
''')

write_file("app/api/batches.py", '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.batch import TrainingBatch

router = APIRouter()

@router.get("/")
def get_batches(db: Session = Depends(get_db)):
    return db.query(TrainingBatch).all()
''')

write_file("app/api/demo.py", '''from fastapi import APIRouter
router = APIRouter()

@router.post("/reset")
def reset_demo():
    return {"status": "reset"}
''')

print("Created api routers.")
