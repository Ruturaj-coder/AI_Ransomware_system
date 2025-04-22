import asyncio
import random
from datetime import datetime, timedelta
import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session, create_db_and_tables
from app.db.models import BatchPrediction, Prediction


async def create_test_batch_data():
    """Create test batch prediction data"""
    print("Creating test batch prediction data...")
    
    # First ensure the database tables exist
    await create_db_and_tables()
    
    async with async_session() as session:
        # Create 5 test batch predictions with different statuses
        batches = []
        
        # Batch 1: Completed with high malicious rate
        batch1 = BatchPrediction(
            batch_name="Windows System Files Scan",
            description="Scan of critical system files on Windows servers",
            file_count=25,
            malicious_count=8,
            benign_count=17,
            status="completed",
            created_at=datetime.utcnow() - timedelta(days=2),
            completed_at=datetime.utcnow() - timedelta(days=2, hours=1)
        )
        session.add(batch1)
        await session.flush()
        batches.append(batch1)
        
        # Batch 2: In progress
        batch2 = BatchPrediction(
            batch_name="Network Share Files",
            description="Files from department shared drives",
            file_count=15,
            malicious_count=0,
            benign_count=0,
            status="in_progress",
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        session.add(batch2)
        await session.flush()
        batches.append(batch2)
        
        # Batch 3: Failed
        batch3 = BatchPrediction(
            batch_name="Email Attachments",
            description="Suspicious email attachments from security team",
            file_count=0,
            malicious_count=0,
            benign_count=0,
            status="failed",
            error_message="Processing timeout after 30 minutes",
            created_at=datetime.utcnow() - timedelta(days=1),
            completed_at=datetime.utcnow() - timedelta(days=1)
        )
        session.add(batch3)
        await session.flush()
        batches.append(batch3)
        
        # Batch 4: Completed with low malicious rate
        batch4 = BatchPrediction(
            batch_name="Developer Scripts",
            description="Python and PowerShell scripts from dev team",
            file_count=50,
            malicious_count=2,
            benign_count=48,
            status="completed",
            created_at=datetime.utcnow() - timedelta(days=5),
            completed_at=datetime.utcnow() - timedelta(days=5, hours=2)
        )
        session.add(batch4)
        await session.flush()
        batches.append(batch4)
        
        # Batch 5: Completed recent
        batch5 = BatchPrediction(
            batch_name="User Downloads",
            description="Files from user downloads folders",
            file_count=35,
            malicious_count=12,
            benign_count=23,
            status="completed",
            created_at=datetime.utcnow() - timedelta(hours=5),
            completed_at=datetime.utcnow() - timedelta(hours=4)
        )
        session.add(batch5)
        await session.flush()
        batches.append(batch5)
        
        # Create associated predictions for completed batches
        for batch in batches:
            if batch.status == "completed":
                for i in range(batch.file_count):
                    is_malicious = i < batch.malicious_count
                    file_hash = f"hash_{batch.id}_{i}_{random.randint(1000, 9999)}"
                    file_ext = random.choice([".exe", ".dll", ".js", ".py", ".pdf", ".docx"])
                    file_size = random.uniform(10.0, 5000.0)
                    
                    prediction = Prediction(
                        file_hash=file_hash,
                        file_extension=file_ext,
                        file_size=file_size,
                        entropy=random.uniform(0.1, 8.0),
                        machine_type=random.choice(["AMD64", "x86", "ARM"]),
                        pe_type=random.choice(["PE32", "PE64", None]),
                        registry_read=random.randint(0, 100) if is_malicious else random.randint(0, 20),
                        registry_write=random.randint(0, 50) if is_malicious else random.randint(0, 5),
                        registry_delete=random.randint(0, 10) if is_malicious else 0,
                        network_connections=random.randint(0, 30) if is_malicious else random.randint(0, 3),
                        dns_queries=random.randint(0, 20) if is_malicious else random.randint(0, 2),
                        suspicious_ips=random.randint(0, 5) if is_malicious else 0,
                        processes_monitored=random.randint(1, 20),
                        prediction="malicious" if is_malicious else "benign",
                        probability=random.uniform(0.70, 0.99),
                        features=json.dumps({"custom_feature": random.random()}),
                        batch_id=batch.id,
                        created_at=batch.created_at + timedelta(minutes=random.randint(5, 55))
                    )
                    session.add(prediction)
        
        await session.commit()
        print("Successfully created test batch prediction data")


if __name__ == "__main__":
    asyncio.run(create_test_batch_data()) 