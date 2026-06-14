"""Database engine and session factory."""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.models import Base


DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "recipes.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,                       # set True to log every SQL query (useful for learning)
    connect_args={"check_same_thread": False},  # SQLite quirk — needed for multi-threaded use later
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    """Create all tables. Idempotent — safe to call multiple times."""
    Base.metadata.create_all(bind=engine)


def get_session():
    """Yield a database session, ensuring it's closed afterward."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()