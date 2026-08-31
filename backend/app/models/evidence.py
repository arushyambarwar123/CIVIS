from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
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
