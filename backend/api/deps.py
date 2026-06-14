"""FastAPI dependency providers.

Endpoints declare these as parameters and FastAPI handles lifecycle
(opening, closing, error rollback) automatically.
"""

from collections.abc import Generator
from sqlalchemy.orm import Session

from db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session that's closed after the request completes."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()