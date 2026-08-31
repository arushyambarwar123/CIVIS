from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class TrainingCentre(Base):
    __tablename__ = "training_centres"
    id = Column(Integer, primary_key=True, index=True)
    centre_code = Column(String, unique=True, index=True)
    centre_name = Column(String)
    organisation_name = Column(String)
    state = Column(String)
    district = Column(String)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String)
    registration_date = Column(Date)
    last_inspection_date = Column(Date, nullable=True)
