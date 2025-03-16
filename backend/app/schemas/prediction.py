from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class PredictionBase(BaseModel):
    """
    Base class for prediction data common to requests and responses
    """
    file_hash: Optional[str] = None
    file_extension: Optional[str] = None
    file_size: Optional[float] = None
    entropy: Optional[float] = None
    machine_type: Optional[str] = None
    pe_type: Optional[str] = None
    
    # System activity
    registry_read: Optional[float] = Field(default=0.0, ge=0.0)
    registry_write: Optional[float] = Field(default=0.0, ge=0.0)
    registry_delete: Optional[float] = Field(default=0.0, ge=0.0)
    network_connections: Optional[float] = Field(default=0.0, ge=0.0)
    dns_queries: Optional[float] = Field(default=0.0, ge=0.0)
    suspicious_ips: Optional[float] = Field(default=0.0, ge=0.0)
    processes_monitored: Optional[float] = Field(default=0.0, ge=0.0)


class PredictionRequest(PredictionBase):
    """
    Request schema for file prediction
    Additional arbitrary features can be provided
    """
    additional_features: Optional[Dict[str, Any]] = Field(default_factory=dict)


class PredictionResponse(PredictionBase):
    """
    Response schema for prediction results
    """
    id: int
    prediction: str
    probability: float
    prediction_category: Optional[str] = None
    prediction_family: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True


class PredictionList(BaseModel):
    """
    List of predictions for pagination
    """
    items: List[PredictionResponse]
    total: int


class FileUploadResponse(BaseModel):
    """
    Response schema for file upload
    """
    filename: str
    prediction: str
    probability: float
    prediction_category: Optional[str] = None
    prediction_family: Optional[str] = None
    risk_factors: Optional[str] = None
    processed_rows: Optional[int] = 1
    all_results: Optional[str] = None 