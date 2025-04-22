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


@router.get("/time-series-predictions")
async def get_time_series_predictions(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """
    Get prediction data over time for time-series visualization
    """
    try:
        from datetime import datetime, timedelta
        import pytz
        from sqlalchemy import func, cast, Date, TEXT
        
        # Calculate the start date (days ago from now)
        end_date = datetime.now(pytz.UTC)
        start_date = end_date - timedelta(days=days)
        
        # Get daily predictions count grouped by date and prediction class
        # Cast date to text to avoid SQLite date conversion issues
        result = await db.execute(
            select(
                func.strftime('%Y-%m-%d', Prediction.created_at).label('date'),
                Prediction.prediction,
                func.count(Prediction.id).label('count')
            )
            .where(Prediction.created_at >= start_date)
            .group_by(
                func.strftime('%Y-%m-%d', Prediction.created_at),
                Prediction.prediction
            )
            .order_by(func.strftime('%Y-%m-%d', Prediction.created_at))
        )
        daily_data = result.all()
        
        # Format data for frontend - ensure date is a string
        formatted_data = []
        for date_str, prediction, count in daily_data:
            formatted_data.append({
                "date": str(date_str),  # Ensure it's a string
                "prediction": prediction,
                "count": count
            })
        
        # Get file extension distribution (using file_extension instead of file_type)
        result = await db.execute(
            select(
                Prediction.file_extension,
                func.count(Prediction.id).label('count')
            )
            .where(Prediction.file_extension.isnot(None))
            .group_by(Prediction.file_extension)
            .order_by(desc(func.count(Prediction.id)))
            .limit(10)  # Top 10 file types
        )
        file_type_data = [{"file_type": str(file_ext) if file_ext else "Unknown", "count": count} 
                          for file_ext, count in result.all()]
        
        return {
            "time_series": formatted_data,
            "file_type_distribution": file_type_data
        }
        
    except Exception as e:
        import traceback
        error_detail = f"Error getting time series data: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log the full error
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/feature-importance-details")
async def get_feature_importance_details(
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed feature importance with statistical analysis
    """
    try:
        # First check if we have a trained model with feature importance
        result = await db.execute(
            select(ModelMetrics)
            .order_by(desc(ModelMetrics.created_at))
            .limit(1)
        )
        latest_model = result.scalars().first()
        
        if not latest_model:
            return {"message": "No model metrics available yet. Train a model first."}
            
        if not latest_model.feature_importance:
            # Return a default response with empty data
            return {
                "message": "No feature importance data available yet. Train a model with feature importance.",
                "feature_importance": [],
                "feature_value_distributions": {}
            }
        
        # Parse the feature importance data
        try:
            feature_importance = json.loads(latest_model.feature_importance)
        except (json.JSONDecodeError, TypeError):
            # If feature_importance is not valid JSON, return empty data
            return {
                "message": "Feature importance data is not in a valid format.",
                "feature_importance": [],
                "feature_value_distributions": {}
            }
        
        # Get prediction data for feature value ranges
        feature_data = {}
        
        for feature_item in feature_importance:
            feature_name = feature_item["feature"]
            
            # Skip if not a numeric feature
            if feature_name not in [
                "registry_read", "registry_write", "registry_delete",
                "network_connections", "dns_queries", "processes_monitored", 
                "entropy", "file_size"
            ]:
                continue
                
            # Query for this feature's distribution by prediction class
            try:
                # Use a simpler query that avoids complex SQLite type conversions
                result = await db.execute(
                    select(
                        func.round(getattr(Prediction, feature_name)).label('value'),
                        Prediction.prediction,
                        func.count(Prediction.id).label('count')
                    )
                    .where(getattr(Prediction, feature_name).isnot(None))
                    .group_by(
                        func.round(getattr(Prediction, feature_name)),
                        Prediction.prediction
                    )
                    .order_by('value')
                    .limit(100)  # Limit for performance
                )
                
                # Format the feature data with value ranges and counts by class
                feature_value_data = []
                for value, prediction, count in result.all():
                    try:
                        # Handle possible None or non-integer values
                        value_int = int(float(value)) if value is not None else 0
                    except (ValueError, TypeError):
                        value_int = 0
                        
                    feature_value_data.append({
                        "value_range": value_int,
                        "prediction": str(prediction),
                        "count": int(count)
                    })
                
                if feature_value_data:
                    feature_data[feature_name] = feature_value_data
            except Exception as e:
                # Skip this feature if there's an error
                print(f"Error processing feature {feature_name}: {str(e)}")
                continue
        
        return {
            "feature_importance": feature_importance,
            "feature_value_distributions": feature_data
        }
        
    except Exception as e:
        import traceback
        error_detail = f"Error getting feature importance details: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log the full error
        raise HTTPException(status_code=500, detail=error_detail) 