from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database import Base

class TrainingBatch(Base):
    __tablename__ = "training_batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String, unique=True, index=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    course_name = Column(String)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    start_date = Column(Date)
    end_date = Column(Date)
    expected_training_hours = Column(Integer)
    batch_capacity = Column(Integer)
    registered_count = Column(Integer)
    status = Column(String)
