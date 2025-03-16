import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
import pandas as pd

from app.models.model import model
from app.db.models import Prediction
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, PredictionList,
    FileUploadResponse
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