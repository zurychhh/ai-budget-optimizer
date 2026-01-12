"""Core module - configuration, database, and utilities"""

from .config import settings
from .database import SessionLocal, engine, get_db

__all__ = ["settings", "get_db", "engine", "SessionLocal"]
