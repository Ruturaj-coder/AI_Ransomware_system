import os
import asyncio
import sqlite3

# Path to the SQLite database (search in common locations)
DB_PATHS = [
    "./app.db",
    "./ransomware.db", 
    "./backend.db",
    "./database.db"
]

async def update_schema():
    """
    Update the database schema to add the feature_importance column
    to the model_metrics table if it doesn't exist
    """
    # Find the database file
    db_path = None
    for path in DB_PATHS:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("Database file not found in common locations.")
        print("Please specify the correct path to the database file.")
        return False
    
    print(f"Using database file: {db_path}")
    
    # Connect to the database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get the columns in the model_metrics table
        cursor.execute("PRAGMA table_info(model_metrics)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Check if feature_importance column exists
        if "feature_importance" not in columns:
            print("Adding feature_importance column to model_metrics table...")
            cursor.execute("ALTER TABLE model_metrics ADD COLUMN feature_importance TEXT")
            conn.commit()
            print("Schema updated successfully!")
        else:
            print("feature_importance column already exists in model_metrics table")
        
        # Close the connection
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    # Run the async function
    asyncio.run(update_schema()) 