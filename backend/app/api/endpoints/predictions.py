import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text, desc, asc, or_, and_
from datetime import datetime, timedelta
import pandas as pd

from app.models.model import model
from app.db.models import Prediction, BatchPrediction
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, PredictionList,
    FileUploadResponse, BatchPredictionCreate, BatchPredictionResponse,
    BatchPredictionList, BatchPredictionFilter
)
from app.db.session import get_db

router = APIRouter()


@router.post("/", response_model=PredictionResponse)
async def create_prediction(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new prediction based on file attributes
    """
    # Create features dictionary
    features = request.dict(exclude_unset=True)
    
    # Add additional features if provided
    if 'additional_features' in features and features['additional_features']:
        features.update(features.pop('additional_features', {}))
    
    try:
        # Get prediction from model
        result = model.predict(features)
        
        # Create DB record
        prediction_data = features.copy()
        prediction_data.pop('additional_features', None)
        prediction_data.update({
            'prediction': result['prediction'],
            'probability': result['probability'],
            'features': json.dumps(features)
        })
        
        db_prediction = Prediction(**prediction_data)
        db.add(db_prediction)
        await db.commit()
        await db.refresh(db_prediction)
        
        # Update batch statistics if this prediction is part of a batch
        if db_prediction.batch_id:
            await update_batch_statistics(db, db_prediction.batch_id)
        
        return db_prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a prediction by ID
    """
    result = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    prediction = result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    return prediction


@router.get("/", response_model=PredictionList)
async def list_predictions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all predictions with pagination
    """
    # Get total count
    total_result = await db.execute(select(Prediction.id))
    total = len(total_result.scalars().all())
    
    # Get items with pagination
    result = await db.execute(
        select(Prediction)
        .order_by(Prediction.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    
    return {"items": items, "total": total}


@router.post("/upload-csv/", response_model=FileUploadResponse)
async def upload_csv_for_prediction(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a CSV file containing file attributes for prediction
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        
        # Process the first row for the response
        # Note: We'll process all rows and save to DB, but only return details for first row
        if len(df) == 0:
            raise HTTPException(
                status_code=400, 
                detail="CSV must contain at least one row for prediction"
            )
        
        # Process all rows
        all_results = []
        for idx, row in df.iterrows():
            # Convert row to dictionary
            features = row.to_dict()
            
            # Make sure numeric features are actually numeric
            for key, value in features.items():
                if isinstance(value, str) and value.replace('.', '', 1).isdigit():
                    features[key] = float(value)
            
            # Debug print
            print(f"Features from CSV row {idx}: {features}")
            
            # Make prediction
            result = model.predict(features)
            
            # Create DB record
            prediction_data = {
                'file_hash': features.get('file_hash', None),
                'file_extension': features.get('file_extension', None),
                'file_size': features.get('file_size', None),
                'entropy': features.get('entropy', None),
                'machine_type': features.get('machine_type', None),
                'pe_type': features.get('pe_type', None),
                'registry_read': features.get('registry_read', 0),
                'registry_write': features.get('registry_write', 0),
                'registry_delete': features.get('registry_delete', 0),
                'network_connections': features.get('network_connections', 0),
                'dns_queries': features.get('dns_queries', 0),
                'suspicious_ips': features.get('suspicious_ips', 0),
                'processes_monitored': features.get('processes_monitored', 0),
                'prediction': result['prediction'],
                'probability': result['probability'],
                'features': json.dumps(features)
            }
            
            db_prediction = Prediction(**prediction_data)
            db.add(db_prediction)
            
            # Save result
            all_results.append({
                'row': idx + 1,
                'prediction': result['prediction'],
                'probability': result['probability'],
                'risk_factors': result.get('risk_factors', [])
            })
        
        # Commit all records at once
        await db.commit()
        
        # Get first row's result for the response
        first_result = all_results[0]
        risk_factors = ", ".join(first_result.get('risk_factors', []))
        
        return {
            'filename': file.filename,
            'prediction': first_result['prediction'],
            'probability': first_result['probability'],
            'risk_factors': risk_factors,
            'processed_rows': len(all_results),
            'all_results': json.dumps(all_results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.delete("/clear", response_model=dict)
async def clear_predictions(
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all predictions from the database
    """
    try:
        # Delete all records from the predictions table
        await db.execute(text("DELETE FROM predictions"))
        await db.commit()
        
        return {
            "status": "success",
            "message": "All predictions have been cleared",
            "deleted_count": "all"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear predictions: {str(e)}")


# Batch prediction endpoints
@router.post("/batch/", response_model=BatchPredictionResponse)
async def create_batch_prediction(
    request: BatchPredictionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new batch prediction
    """
    try:
        # Create batch prediction record
        db_batch = BatchPrediction(**request.dict())
        db_batch.status = "in_progress"
        
        db.add(db_batch)
        await db.commit()
        await db.refresh(db_batch)
        
        return db_batch
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch creation failed: {str(e)}")


@router.get("/batch/{batch_id}", response_model=BatchPredictionResponse)
async def get_batch_prediction(
    batch_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a batch prediction by ID
    """
    result = await db.execute(select(BatchPrediction).where(BatchPrediction.id == batch_id))
    batch = result.scalars().first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch prediction not found")
    
    return batch


@router.get("/batch/", response_model=BatchPredictionList)
async def list_batch_predictions(
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all batch predictions with filtering, sorting and pagination
    """
    # Base query
    query = select(BatchPrediction)
    count_query = select(BatchPrediction.id)
    
    # Apply filters
    filters = []
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            filters.append(BatchPrediction.created_at >= from_date)
        except ValueError:
            pass  # Invalid date format, ignore filter
            
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            filters.append(BatchPrediction.created_at <= to_date)
        except ValueError:
            pass  # Invalid date format, ignore filter
            
    if status:
        filters.append(BatchPrediction.status == status)
        
    if keyword:
        filters.append(or_(
            BatchPrediction.batch_name.ilike(f"%{keyword}%"),
            BatchPrediction.description.ilike(f"%{keyword}%")
        ))
    
    if filters:
        filter_condition = and_(*filters)
        query = query.where(filter_condition)
        count_query = count_query.where(filter_condition)
    
    # Apply sorting
    if sort_order.lower() == "asc":
        sort_func = asc
    else:
        sort_func = desc
        
    if hasattr(BatchPrediction, sort_by):
        sort_column = getattr(BatchPrediction, sort_by)
        query = query.order_by(sort_func(sort_column))
    else:
        # Default to created_at if invalid sort column
        query = query.order_by(sort_func(BatchPrediction.created_at))
    
    # Get total count with filters
    total_result = await db.execute(count_query)
    total = len(total_result.scalars().all())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {"items": items, "total": total}


@router.get("/batch/{batch_id}/predictions", response_model=PredictionList)
async def get_batch_predictions(
    batch_id: int,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get predictions for a specific batch
    """
    # Verify batch exists
    batch_result = await db.execute(select(BatchPrediction).where(BatchPrediction.id == batch_id))
    batch = batch_result.scalars().first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch prediction not found")
    
    # Get total count for this batch
    total_result = await db.execute(select(Prediction.id).where(Prediction.batch_id == batch_id))
    total = len(total_result.scalars().all())
    
    # Get predictions for this batch with pagination
    result = await db.execute(
        select(Prediction)
        .where(Prediction.batch_id == batch_id)
        .order_by(Prediction.id.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    
    return {"items": items, "total": total}


@router.put("/batch/{batch_id}/complete", response_model=BatchPredictionResponse)
async def complete_batch_prediction(
    batch_id: int,
    error_message: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a batch prediction as completed
    """
    # Get batch
    result = await db.execute(select(BatchPrediction).where(BatchPrediction.id == batch_id))
    batch = result.scalars().first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch prediction not found")
    
    # Update batch status
    if error_message:
        batch.status = "failed"
        batch.error_message = error_message
    else:
        batch.status = "completed"
    
    batch.completed_at = datetime.utcnow()
    
    # Update batch statistics
    await update_batch_statistics(db, batch_id)
    
    await db.commit()
    await db.refresh(batch)
    
    return batch


async def update_batch_statistics(db: AsyncSession, batch_id: int):
    """
    Update batch statistics based on the associated predictions
    """
    # Get batch
    result = await db.execute(select(BatchPrediction).where(BatchPrediction.id == batch_id))
    batch = result.scalars().first()
    
    if not batch:
        return
    
    # Count total predictions
    count_result = await db.execute(select(Prediction.id).where(Prediction.batch_id == batch_id))
    batch.file_count = len(count_result.scalars().all())
    
    # Count malicious predictions
    malicious_result = await db.execute(
        select(Prediction.id)
        .where(Prediction.batch_id == batch_id)
        .where(Prediction.prediction == "malicious")
    )
    batch.malicious_count = len(malicious_result.scalars().all())
    
    # Calculate benign count
    batch.benign_count = batch.file_count - batch.malicious_count
    
    await db.commit() 