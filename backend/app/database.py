import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# On Vercel (serverless), the filesystem is read-only except /tmp/.
# Use /tmp/ for SQLite in production; local path for development.
_is_vercel = os.environ.get("VERCEL", "") == "1"
_db_path = "/tmp/civis.db" if _is_vercel else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "civis.db")
DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
