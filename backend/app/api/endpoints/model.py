from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

from app.models.model import model
from app.db.models import ModelMetrics
from app.schemas.model import (
    ModelMetricsCreate, ModelMetricsResponse, ModelInfoResponse,
    FeatureImportance, TrainingRequest
)
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()


@router.post("/train", response_model=ModelMetricsResponse)
async def train_model(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Train the model on the dataset
    """
    # Use default dataset if not provided
    dataset_path = request.dataset_path or settings.DATASET_PATH
    
    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_path}")
    
    try:
        # Train the model (could be long-running, consider making async)
        metrics = model.train(
            dataset_path,
            epochs=request.epochs,
            batch_size=request.batch_size
        )
        
        # Create DB record for metrics
        db_metrics = ModelMetrics(**metrics)
        db.add(db_metrics)
        await db.commit()
        await db.refresh(db_metrics)
        
        return db_metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/info", response_model=ModelInfoResponse)
async def get_model_info(
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive information about the model
    """
    # Get latest model metrics
    result = await db.execute(
        select(ModelMetrics).order_by(ModelMetrics.id.desc()).limit(1)
    )
    metrics = result.scalars().first()
    
    if not metrics:
        raise HTTPException(status_code=404, detail="No model metrics found. Train a model first.")
    
    # For demo purposes, mock feature importance
    # In a real application, this would be calculated from the model
    feature_importance = [
        {"feature": "registry_read", "importance": 0.85},
        {"feature": "registry_write", "importance": 0.78},
        {"feature": "network_connections", "importance": 0.72},
        {"feature": "file_extension", "importance": 0.65},
        {"feature": "entropy", "importance": 0.61},
        {"feature": "processes_monitored", "importance": 0.58},
        {"feature": "dns_queries", "importance": 0.52},
        {"feature": "suspicious_ips", "importance": 0.49},
    ]
    
    # Get confusion matrix from metrics
    try:
        # First try to get it from the dedicated field
        if metrics.confusion_matrix:
            confusion_matrix = json.loads(metrics.confusion_matrix)
        else:
            # Fall back to extracting from architecture_summary
            arch_summary = json.loads(metrics.architecture_summary) if isinstance(metrics.architecture_summary, str) else {}
            confusion_matrix = arch_summary.get("confusion_matrix", [[0, 0], [0, 0]])
    except (json.JSONDecodeError, TypeError, AttributeError):
        confusion_matrix = [[0, 0], [0, 0]]
    
    return {
        "metrics": metrics,
        "feature_importance": feature_importance,
        "confusion_matrix": {
            "matrix": confusion_matrix,
            "labels": ["Benign", "Malicious"]
        }
    }


@router.get("/status")
async def get_model_status():
    """
    Check if the model is loaded and ready for predictions
    """
    try:
        is_loaded = model.model_loaded
        if not is_loaded:
            # Try to load the model
            success = model.load()
            return {"status": "loaded" if success else "not_loaded"}
        return {"status": "loaded"}
    except Exception as e:
        return {"status": "error", "detail": str(e)} 