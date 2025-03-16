import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.api.api import api_router
from app.core.config import settings
from app.db.session import create_db_and_tables

app = FastAPI(
    title="Ransomware Detection API",
    description="AI-Powered Ransomware Detection System",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """
    Initialize database and load ML model on startup
    """
    await create_db_and_tables()

@app.get("/")
async def root():
    """
    Root endpoint - health check
    """
    return {"message": "Ransomware Detection API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 