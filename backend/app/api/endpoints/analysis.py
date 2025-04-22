from fastapi import APIRouter, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from app.schemas.analysis import (
    StaticAnalysisRequest, 
    StaticAnalysisResponse, 
    PatternsResponse, 
    PatternInfo,
    FileMonitorRequest,
    FileMonitorResponse,
    MonitoringStatusResponse,
    MonitoredFileAnalysisResult
)
from app.utils.static_analysis import (
    analyze_file_content, 
    JS_PATTERNS, 
    HTML_PATTERNS, 
    PYTHON_PATTERNS,
    POWERSHELL_PATTERNS,
    get_patterns_by_file_type
)
from app.utils.file_monitor import monitor
import logging
import json
import time
import asyncio
import os
from typing import List, Dict, Set, Optional
from fastapi.responses import JSONResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# WebSocket connections for real-time monitoring updates
active_connections: List[WebSocket] = []

@router.post("/static", response_model=StaticAnalysisResponse)
async def static_analysis(request: StaticAnalysisRequest):
    """
    Perform static analysis on script file content.
    
    This endpoint analyzes script file content for potentially suspicious patterns 
    and obfuscation techniques that might indicate malicious code.
    
    Currently supports JavaScript, HTML, Python, and PowerShell files.
    """
    try:
        result = analyze_file_content(request.file_content, request.file_type)
        
        if not result["success"]:
            logger.error(f"Analysis failed: {result.get('error', 'Unknown error')}")
            return StaticAnalysisResponse(
                success=False,
                error=result.get("error", "Analysis failed"),
                summary=result["summary"]
            )
        
        return StaticAnalysisResponse(**result)
    
    except Exception as e:
        logger.exception(f"Error during static analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during analysis: {str(e)}"
        )


@router.get("/patterns", response_model=PatternsResponse)
async def get_patterns(file_type: str = Query(None, description="Filter patterns by file type")):
    """
    Get available detection patterns.
    
    Returns information about all the patterns that the static analysis module
    can detect, including descriptions and severity levels.
    
    Optionally filter patterns by file type (e.g., 'javascript', 'html', 'python', 'powershell').
    """
    try:
        patterns = []
        
        # If file_type is provided, get patterns for that file type
        if file_type:
            file_type = file_type.lower()
            pattern_dict = get_patterns_by_file_type(file_type)
            
            if not pattern_dict:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_type}"
                )
            
            for pattern_name, pattern_info in pattern_dict.items():
                patterns.append(PatternInfo(
                    pattern_name=pattern_name,
                    description=pattern_info["description"],
                    severity=pattern_info["severity"],
                    file_type=file_type
                ))
        else:
            # Get patterns for all file types
            for pattern_name, pattern_info in JS_PATTERNS.items():
                patterns.append(PatternInfo(
                    pattern_name=pattern_name,
                    description=pattern_info["description"],
                    severity=pattern_info["severity"],
                    file_type="javascript"
                ))
            
            for pattern_name, pattern_info in HTML_PATTERNS.items():
                patterns.append(PatternInfo(
                    pattern_name=pattern_name,
                    description=pattern_info["description"],
                    severity=pattern_info["severity"],
                    file_type="html"
                ))
            
            for pattern_name, pattern_info in PYTHON_PATTERNS.items():
                patterns.append(PatternInfo(
                    pattern_name=pattern_name,
                    description=pattern_info["description"],
                    severity=pattern_info["severity"],
                    file_type="python"
                ))
            
            for pattern_name, pattern_info in POWERSHELL_PATTERNS.items():
                patterns.append(PatternInfo(
                    pattern_name=pattern_name,
                    description=pattern_info["description"],
                    severity=pattern_info["severity"],
                    file_type="powershell"
                ))
        
        return PatternsResponse(patterns=patterns)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error retrieving patterns: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while retrieving patterns: {str(e)}"
        )


async def broadcast_analysis_result(result: Dict):
    """
    Broadcast analysis result to all connected WebSocket clients.
    
    Args:
        result: Analysis result to broadcast
    """
    if not active_connections:
        return
        
    # Create a serializable copy of the result
    serializable_result = json.dumps(result)
    
    # Send to all connected clients
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(serializable_result)
        except Exception:
            disconnected.append(connection)
    
    # Remove disconnected clients
    for connection in disconnected:
        if connection in active_connections:
            active_connections.remove(connection)


async def analyze_monitored_file(file_path: str, file_type: str, event_type: str):
    """
    Analyze a monitored file and broadcast the results.
    
    Args:
        file_path: Path to the file
        file_type: Type of the file
        event_type: Type of event (created/modified)
    """
    try:
        # Check if file exists and is accessible
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            logger.error(f"File not found or not accessible: {file_path}")
            return
            
        # Read file content with better error handling
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                file_content = f.read()
        except UnicodeDecodeError:
            # If UTF-8 fails, try with Latin-1 encoding which never fails
            try:
                with open(file_path, 'r', encoding='latin-1', errors='replace') as f:
                    file_content = f.read()
            except Exception as e:
                logger.error(f"Failed to read file {file_path}: {str(e)}")
                return
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            return
            
        # Skip empty files
        if not file_content.strip():
            logger.info(f"Skipping empty file: {file_path}")
            return
        
        # Analyze file
        result = analyze_file_content(file_content, file_type)
        
        # Create analysis result
        analysis_result = MonitoredFileAnalysisResult(
            file_path=file_path,
            file_type=file_type,
            event_type=event_type,
            analysis_result=StaticAnalysisResponse(**result),
            timestamp=time.time()
        )
        
        # Broadcast result
        await broadcast_analysis_result(analysis_result.dict())
        
        logger.info(f"Analyzed file: {file_path}, Suspicion score: {result['summary']['suspicion_score']}")
        
    except Exception as e:
        logger.error(f"Error analyzing monitored file {file_path}: {str(e)}")


@router.post("/monitor/start", response_model=FileMonitorResponse)
async def start_monitoring(request: FileMonitorRequest):
    """
    Start monitoring directories for new or modified script files.
    
    The system will automatically analyze any new or modified files
    in the specified directories with supported extensions.
    """
    try:
        # Convert file extensions to include dots if not already
        file_extensions = request.file_extensions
        if file_extensions:
            file_extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in file_extensions]
        
        # Define callback function that will run in the monitor's thread
        def file_callback(file_path, file_type, event_type):
            # We need to run the async function in the event loop
            asyncio.run(analyze_monitored_file(file_path, file_type, event_type))
        
        # Start monitoring
        result = monitor.start_monitoring(request.paths, file_callback, file_extensions)
        
        return FileMonitorResponse(**result)
        
    except Exception as e:
        logger.exception(f"Error starting file monitoring: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while starting file monitoring: {str(e)}"
        )


@router.post("/monitor/stop", response_model=FileMonitorResponse)
async def stop_monitoring():
    """
    Stop all active file monitoring.
    """
    try:
        result = monitor.stop_monitoring()
        return FileMonitorResponse(**result)
        
    except Exception as e:
        logger.exception(f"Error stopping file monitoring: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while stopping file monitoring: {str(e)}"
        )


@router.get("/monitor/status", response_model=MonitoringStatusResponse)
async def get_monitoring_status():
    """
    Get the current status of file monitoring.
    """
    try:
        result = monitor.get_status()
        return MonitoringStatusResponse(**result)
        
    except Exception as e:
        logger.exception(f"Error getting monitoring status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while getting monitoring status: {str(e)}"
        )


@router.websocket("/monitor/ws")
async def monitoring_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for receiving real-time monitoring results.
    
    Clients can connect to this endpoint to receive real-time
    updates when monitored files are analyzed.
    """
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial monitoring status to the client
        status = monitor.get_status()
        await websocket.send_text(json.dumps({
            "type": "status",
            "data": status
        }))
        
        # Keep the connection alive
        while True:
            # Wait for client messages (e.g., ping)
            data = await websocket.receive_text()
            
            # Handle client messages if needed
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        # Remove connection when client disconnects
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if websocket in active_connections:
            active_connections.remove(websocket) 