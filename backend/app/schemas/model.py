from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ModelMetricsBase(BaseModel):
    """
    Base class for model metrics data
    """
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    
    # Training parameters
    num_features: int
    training_samples: int
    test_samples: int
    epochs: Optional[int] = None
    batch_size: Optional[int] = None
    
    # Additional info
    architecture_summary: Optional[str] = None
    training_time: Optional[float] = None
    confusion_matrix: Optional[str] = None


class ModelMetricsCreate(ModelMetricsBase):
    """
    Schema for creating model metrics
    """
    pass


class ModelMetricsResponse(ModelMetricsBase):
    """
    Schema for model metrics response
    """
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True


class FeatureImportance(BaseModel):
    """
    Schema for feature importance
    """
    feature: str
    importance: float


class ModelInfoResponse(BaseModel):
    """
    Schema for comprehensive model information
    """
    metrics: ModelMetricsResponse
    feature_importance: List[FeatureImportance]
    confusion_matrix: Dict[str, Any]


class TrainingRequest(BaseModel):
    """
    Schema for training request
    """
    dataset_path: Optional[str] = None
    epochs: Optional[int] = 50
    batch_size: Optional[int] = 32
    test_size: Optional[float] = 0.2
    random_state: Optional[int] = 42 