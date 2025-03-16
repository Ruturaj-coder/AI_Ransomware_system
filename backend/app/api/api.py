from fastapi import APIRouter

from app.api.endpoints import predictions, model, metrics

api_router = APIRouter()

# Include routers from endpoint modules
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(model.router, prefix="/model", tags=["model"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"]) 