import os
from pathlib import Path

class Settings:
    """
    Application settings
    """
    # Base settings
    PROJECT_NAME: str = "ransomware-detection-api"
    API_V1_STR: str = "/v1"
    
    # Project paths
    BASE_DIR = Path(__file__).parent.parent.parent
    DATASET_DIR = os.path.join(BASE_DIR.parent, "Dataset")
    DATASET_PATH = os.path.join(DATASET_DIR, "Final_Dataset_without_duplicate.csv")
    MODEL_DIR = os.path.join(BASE_DIR, "models", "saved")
    MODEL_PATH = os.path.join(MODEL_DIR, "ransomware_model.h5")
    SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
    ENCODER_PATH = os.path.join(MODEL_DIR, "encoder.joblib")
    FEATURE_LIST_PATH = os.path.join(MODEL_DIR, "features.joblib")
    
    # Database
    SQLITE_DB_PATH = os.path.join(BASE_DIR, "ransomware.db")
    SQLITE_URL = f"sqlite+aiosqlite:///{SQLITE_DB_PATH}"
    
    # Model settings
    TARGET_COLUMN = "Class"
    TEST_SIZE = 0.2
    RANDOM_STATE = 42
    
    # Create directories if they don't exist
    os.makedirs(MODEL_DIR, exist_ok=True)

settings = Settings() 