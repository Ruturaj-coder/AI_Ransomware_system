from fastapi import APIRouter

from app.api.endpoints import predictions, metrics, model, analysis

api_router = APIRouter()

# Include prediction and batch prediction endpoints
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(model.router, prefix="/model", tags=["model"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"]) 