from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.session import Base

class Prediction(Base):
    """
    Model for storing ransomware predictions
    """
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    file_hash = Column(String, index=True, nullable=True)
    file_extension = Column(String, nullable=True)
    file_size = Column(Float, nullable=True)
    entropy = Column(Float, nullable=True)
    machine_type = Column(String, nullable=True)
    pe_type = Column(String, nullable=True)
    
    # System activity
    registry_read = Column(Float, nullable=True)
    registry_write = Column(Float, nullable=True)
    registry_delete = Column(Float, nullable=True)
    network_connections = Column(Float, nullable=True)
    dns_queries = Column(Float, nullable=True)
    suspicious_ips = Column(Float, nullable=True)
    processes_monitored = Column(Float, nullable=True)
    
    # Additional features (can be stored as JSON in a Text field)
    features = Column(Text, nullable=True)
    
    # Prediction results
    prediction = Column(String, index=True)
    probability = Column(Float)
    prediction_category = Column(String, nullable=True)
    prediction_family = Column(String, nullable=True)
    
    # Batch relationship
    batch_id = Column(Integer, ForeignKey("batch_predictions.id"), nullable=True)
    batch = relationship("BatchPrediction", back_populates="predictions")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Prediction {self.id}: {self.prediction}>"


class BatchPrediction(Base):
    """
    Model for storing batch prediction data
    """
    __tablename__ = "batch_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_name = Column(String, index=True)
    description = Column(String, nullable=True)
    file_count = Column(Integer, default=0)
    malicious_count = Column(Integer, default=0)
    benign_count = Column(Integer, default=0)
    status = Column(String, default="completed")  # in_progress, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Relationship to individual predictions
    predictions = relationship("Prediction", back_populates="batch")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<BatchPrediction {self.id}: {self.batch_name}>"


class ModelMetrics(Base):
    """
    Model for storing model performance metrics
    """
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String, index=True)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    auc_roc = Column(Float)
    
    # Training parameters
    num_features = Column(Integer)
    training_samples = Column(Integer)
    test_samples = Column(Integer)
    epochs = Column(Integer, nullable=True)
    batch_size = Column(Integer, nullable=True)
    
    # Additional info
    architecture_summary = Column(Text, nullable=True)
    training_time = Column(Float, nullable=True)
    confusion_matrix = Column(Text, nullable=True)
    feature_importance = Column(Text, nullable=True)  # JSON string of feature importance data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ModelMetrics {self.model_version}: acc={self.accuracy}>" 