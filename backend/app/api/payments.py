"""Payments router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment

router = APIRouter(tags=["Payments"])

@router.get("/payments")
def list_payments(batch_id: int = None, beneficiary_id: int = None,
                  payment_status: str = None, db: Session = Depends(get_db)):
    q = db.query(Payment)
    if batch_id:
        q = q.filter(Payment.batch_id == batch_id)
    if beneficiary_id:
        q = q.filter(Payment.beneficiary_id == beneficiary_id)
    if payment_status:
        q = q.filter(Payment.payment_status == payment_status)
    records = q.all()
    return [{"id": p.id, "beneficiary_id": p.beneficiary_id, "batch_id": p.batch_id,
             "payment_type": p.payment_type, "amount": p.amount,
             "payment_date": str(p.payment_date), "payment_status": p.payment_status,
             "payment_reference": p.payment_reference} for p in records]
