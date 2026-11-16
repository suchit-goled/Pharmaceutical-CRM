import os
import sys
import logging
import tempfile
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

logger = logging.getLogger("database")

Base = declarative_base()

def get_fallback_db_path() -> str:
    temp_dir = Path(tempfile.gettempdir())
    db_file = temp_dir / "medintel_cloud.db"
    return f"sqlite:///{db_file.as_posix()}"

def create_db_engine():
    db_url = settings.DATABASE_URL
    is_vercel = os.getenv("VERCEL") == "1" or os.getenv("NOW_REGION") is not None
    
    # In cloud environments where localhost PostgreSQL is unreachable, use SQLite fallback
    if is_vercel and ("localhost" in db_url or "127.0.0.1" in db_url):
        logger.info("Vercel cloud environment detected without remote PostgreSQL. Using SQLite cloud storage.")
        db_url = get_fallback_db_path()
        
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=False
        ), db_url
        
    try:
        eng = create_engine(
            db_url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=min(settings.DB_POOL_TIMEOUT, 3), # fast timeout if unreachable
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,
            echo=False
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1;"))
        return eng, db_url
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")
        fallback_url = get_fallback_db_path()
        eng = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
        return eng, fallback_url

engine, ACTIVE_DATABASE_URL = create_db_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

_IS_INITIALIZED = False

def ensure_db_initialized():
    """Ensure all tables exist and baseline Indian Healthcare test accounts are seeded."""
    global _IS_INITIALIZED
    try:
        import models
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            user_count = db.query(models.User).count()
            if user_count == 0:
                logger.info("No users found. Auto-seeding Indian Healthcare test accounts...")
                import seed_indian_data
                seed_indian_data.SessionLocal = SessionLocal
                seed_indian_data.seed_india()
                logger.info("Auto-seeding completed.")
            _IS_INITIALIZED = True
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error initializing/seeding database: {e}")

def get_db():
    """
    FastAPI dependency that yields a scoped database session and guarantees cleanup.
    """
    global _IS_INITIALIZED
    if not _IS_INITIALIZED and ACTIVE_DATABASE_URL.startswith("sqlite"):
        ensure_db_initialized()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

