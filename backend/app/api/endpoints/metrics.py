from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
import pandas as pd
import json
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

from app.db.models import Prediction, ModelMetrics
from app.schemas.model import ModelMetricsResponse
from app.db.session import get_db

router = APIRouter()


@router.get("/predictions")
async def get_prediction_metrics(
    db: AsyncSession = Depends(get_db)
):
    """
    Get metrics about predictions made by the system
    """
    try:
        # Get total predictions
        result = await db.execute(select(func.count(Prediction.id)))
        total_predictions = result.scalar()
        
        # Get count by prediction (benign/malicious)
        result = await db.execute(
            select(Prediction.prediction, func.count(Prediction.id))
            .group_by(Prediction.prediction)
        )
        predictions_by_class = dict(result.all())
        
        # Get average probability for each class
        result = await db.execute(
            select(Prediction.prediction, func.avg(Prediction.probability))
            .group_by(Prediction.prediction)
        )
        avg_probability_by_class = dict(result.all())
        
        # Get recent predictions
        result = await db.execute(
            select(Prediction.created_at, Prediction.prediction)
            .order_by(desc(Prediction.created_at))
            .limit(100)
        )
        recent_predictions = [{"date": row[0], "prediction": row[1]} for row in result]
        
        return {
            "total_predictions": total_predictions,
            "predictions_by_class": predictions_by_class,
            "avg_probability_by_class": avg_probability_by_class,
            "recent_predictions": recent_predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting metrics: {str(e)}")


@router.get("/model-performance")
async def get_model_performance_metrics(
    db: AsyncSession = Depends(get_db)
):
    """
    Get model performance metrics over time
    """
    try:
        # Get all model metrics
        result = await db.execute(
            select(ModelMetrics)
            .order_by(ModelMetrics.created_at)
        )
        metrics = result.scalars().all()
        
        if not metrics:
            return {"message": "No model metrics available yet"}
        
        # Convert to list of dicts for easier processing
        metrics_list = []
        for m in metrics:
            metrics_dict = {
                "id": m.id,
                "model_version": m.model_version,
                "accuracy": m.accuracy,
                "precision": m.precision,
                "recall": m.recall,
                "f1_score": m.f1_score,
                "auc_roc": m.auc_roc,
                "created_at": m.created_at
            }
            metrics_list.append(metrics_dict)
        
        # Get latest metrics
        latest_metrics = metrics_list[-1] if metrics_list else None
        
        return {
            "metrics_history": metrics_list,
            "latest_metrics": latest_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting metrics: {str(e)}")


@router.get("/feature-distribution")
async def get_feature_distribution(
    feature: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get distribution of a specific feature from predictions
    """
    # List of allowed features for visualization
    allowed_features = [
        "registry_read", "registry_write", "registry_delete",
        "network_connections", "dns_queries", "suspicious_ips",
        "processes_monitored", "entropy"
    ]
    
    if feature not in allowed_features:
        raise HTTPException(
            status_code=400, 
            detail=f"Feature not allowed. Choose from: {', '.join(allowed_features)}"
        )
    
    try:
        # Get feature values and prediction class
        result = await db.execute(
            select(getattr(Prediction, feature), Prediction.prediction)
            .where(getattr(Prediction, feature).isnot(None))
            .limit(1000)  # Limit for performance
        )
        data = result.all()
        
        if not data:
            return {"message": f"No data available for feature '{feature}'"}
        
        # Convert to dataframe for stats
        df = pd.DataFrame(data, columns=[feature, "prediction"])
        
        # Basic statistics
        stats = {
            "mean": float(df[feature].mean()),
            "median": float(df[feature].median()),
            "min": float(df[feature].min()),
            "max": float(df[feature].max()),
            "std": float(df[feature].std()),
            "count": int(df[feature].count()),
            "count_by_class": df.groupby("prediction")[feature].count().to_dict()
        }
        
        return {
            "feature": feature,
            "statistics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting metrics: {str(e)}") 