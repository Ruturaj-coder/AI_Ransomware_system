import asyncio
import os
import sqlite3

from app.core.config import settings
from app.db.session import create_db_and_tables

async def recreate_database():
    """Recreate the SQLite database with all tables"""
    print("Recreating database...")
    
    # Delete the existing database file if it exists
    if os.path.exists(settings.SQLITE_DB_PATH):
        try:
            os.remove(settings.SQLITE_DB_PATH)
            print(f"Deleted existing database: {settings.SQLITE_DB_PATH}")
        except Exception as e:
            print(f"Error deleting database: {e}")
            return
    
    # Create the new tables
    await create_db_and_tables()
    print("Successfully recreated database with new schema")

if __name__ == "__main__":
    asyncio.run(recreate_database()) 