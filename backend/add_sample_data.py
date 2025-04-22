import json
import asyncio
import aiosqlite
import os
import random
from datetime import datetime, timedelta

# Path to the SQLite database - will create it if it doesn't exist
DB_PATH = "./ransomware.db"

async def add_sample_data():
    """
    Add sample data to the database for testing purposes
    """
    # Create the database if it doesn't exist
    async with aiosqlite.connect(DB_PATH) as db:
        # Create the necessary tables if they don't exist
        await db.execute('''
        CREATE TABLE IF NOT EXISTS model_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_version TEXT,
            accuracy REAL,
            precision REAL,
            recall REAL,
            f1_score REAL,
            auc_roc REAL,
            num_features INTEGER,
            training_samples INTEGER,
            test_samples INTEGER,
            epochs INTEGER,
            batch_size INTEGER,
            architecture_summary TEXT,
            training_time REAL,
            confusion_matrix TEXT,
            feature_importance TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        await db.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_hash TEXT,
            file_extension TEXT,
            file_size REAL,
            entropy REAL,
            machine_type TEXT,
            pe_type TEXT,
            registry_read REAL,
            registry_write REAL,
            registry_delete REAL,
            network_connections REAL,
            dns_queries REAL,
            suspicious_ips REAL,
            processes_monitored REAL,
            features TEXT,
            prediction TEXT,
            probability REAL,
            prediction_category TEXT,
            prediction_family TEXT,
            batch_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
        ''')
        
        await db.commit()
        
        # Check if we already have data in the model_metrics table
        cursor = await db.execute('SELECT COUNT(*) FROM model_metrics')
        count = await cursor.fetchone()
        
        if count and count[0] > 0:
            print(f"Already have {count[0]} records in model_metrics table. Skipping model metrics insertion.")
        else:
            # Add a sample model metrics record
            feature_importance = json.dumps([
                {"feature": "entropy", "importance": 0.28},
                {"feature": "registry_write", "importance": 0.22},
                {"feature": "suspicious_ips", "importance": 0.18},
                {"feature": "network_connections", "importance": 0.15},
                {"feature": "dns_queries", "importance": 0.08},
                {"feature": "processes_monitored", "importance": 0.05},
                {"feature": "registry_read", "importance": 0.03},
                {"feature": "registry_delete", "importance": 0.01}
            ])
            
            await db.execute('''
            INSERT INTO model_metrics (
                model_version, accuracy, precision, recall, f1_score, auc_roc, 
                num_features, training_samples, test_samples, epochs, batch_size,
                architecture_summary, training_time, feature_importance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'v1.0.0', 0.95, 0.92, 0.94, 0.93, 0.97, 
                8, 5000, 1000, 100, 32,
                'Neural Network with 3 hidden layers', 120.5, feature_importance
            ))
            
            await db.commit()
            print("Added sample model metrics record.")
        
        # Check if we already have data in the predictions table
        cursor = await db.execute('SELECT COUNT(*) FROM predictions')
        count = await cursor.fetchone()
        
        if count and count[0] > 0:
            print(f"Already have {count[0]} records in predictions table. Skipping predictions insertion.")
        else:
            # Add sample prediction records
            base_date = datetime.now() - timedelta(days=14)
            file_extensions = ['.exe', '.dll', '.sys', '.zip', '.rar', '.pdf', '.doc', '.xls']
            
            for i in range(100):
                is_malicious = random.random() < 0.3  # 30% chance of being malicious
                date = base_date + timedelta(days=random.randint(0, 14), 
                                           hours=random.randint(0, 23),
                                           minutes=random.randint(0, 59))
                
                await db.execute('''
                INSERT INTO predictions (
                    file_hash, file_extension, file_size, entropy, 
                    registry_read, registry_write, registry_delete,
                    network_connections, dns_queries, suspicious_ips, processes_monitored,
                    prediction, probability, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    f'hash_{i}',
                    random.choice(file_extensions),
                    random.uniform(100, 10000),
                    random.uniform(0.1, 8.0),
                    random.randint(10, 100) if is_malicious else random.randint(0, 30),
                    random.randint(5, 50) if is_malicious else random.randint(0, 10),
                    random.randint(0, 10) if is_malicious else random.randint(0, 3),
                    random.randint(5, 30) if is_malicious else random.randint(0, 15),
                    random.randint(3, 20) if is_malicious else random.randint(0, 10),
                    random.randint(1, 15) if is_malicious else random.randint(0, 3),
                    random.randint(5, 30) if is_malicious else random.randint(1, 15),
                    'Malicious' if is_malicious else 'Benign',
                    random.uniform(0.7, 0.99) if is_malicious else random.uniform(0.01, 0.3),
                    date.strftime('%Y-%m-%d %H:%M:%S')
                ))
            
            await db.commit()
            print(f"Added 100 sample prediction records.")
            
    print(f"Database initialized with sample data at {DB_PATH}")

if __name__ == "__main__":
    asyncio.run(add_sample_data()) 