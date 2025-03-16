import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

# Create the SQLAlchemy engine
engine = create_async_engine(
    settings.SQLITE_URL,
    echo=True,
    future=True,
)

# Create a session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create a Base class for declarative models
Base = declarative_base()

async def get_db():
    """
    Dependency for getting async DB session
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_db_and_tables():
    """
    Create database and tables if they don't exist
    """
    # Ensure the directory exists
    os.makedirs(os.path.dirname(settings.SQLITE_DB_PATH), exist_ok=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 