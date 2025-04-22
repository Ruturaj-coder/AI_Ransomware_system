from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator


class StaticAnalysisRequest(BaseModel):
    """Schema for static code analysis request."""
    file_content: str = Field(..., description="Content of the file to analyze")
    file_type: str = Field(..., description="Type of the file (e.g., 'javascript', 'html', 'python', 'powershell')")
    
    @validator('file_type')
    def validate_file_type(cls, v):
        """Validate the file type."""
        supported_types = ['javascript', 'js', 'html', 'htm', 'python', 'py', 'powershell', 'ps1']
        if v.lower() not in supported_types:
            raise ValueError(f"Unsupported file type: {v}. Supported types: {', '.join(supported_types)}")
        return v.lower()


class AnalysisResult(BaseModel):
    """Schema for an individual pattern detection result."""
    pattern_name: str = Field(..., description="Name of the detected pattern")
    description: str = Field(..., description="Description of the pattern")
    severity: str = Field(..., description="Severity of the pattern (high, medium, low)")
    line_number: int = Field(..., description="Line number where the pattern was detected")
    matched_text: str = Field(..., description="Text that matched the pattern")
    context: List[str] = Field(..., description="Context lines around the detection")


class AnalysisSummary(BaseModel):
    """Schema for analysis summary."""
    pattern_count: Dict[str, int] = Field(..., description="Count of each pattern found")
    total_detections: int = Field(..., description="Total number of detections")
    suspicion_score: float = Field(..., description="Calculated suspicion score (0-1)")


class StaticAnalysisResponse(BaseModel):
    """Schema for static code analysis response."""
    success: bool = Field(..., description="Whether the analysis was successful")
    error: Optional[str] = Field(None, description="Error message if analysis failed")
    results: List[AnalysisResult] = Field([], description="List of pattern detection results")
    summary: AnalysisSummary = Field(..., description="Summary of analysis results")


class PatternInfo(BaseModel):
    """Schema for pattern information."""
    pattern_name: str = Field(..., description="Name of the pattern")
    description: str = Field(..., description="Description of the pattern")
    severity: str = Field(..., description="Severity of the pattern (high, medium, low)")
    file_type: str = Field(..., description="File type this pattern applies to")


class PatternsResponse(BaseModel):
    """Schema for available patterns response."""
    patterns: List[PatternInfo] = Field(..., description="List of available detection patterns")


class FileMonitorRequest(BaseModel):
    """Schema for file monitoring request."""
    paths: List[str] = Field(..., description="List of directory paths to monitor")
    file_extensions: Optional[List[str]] = Field(None, description="List of file extensions to monitor")


class FileMonitorResponse(BaseModel):
    """Schema for file monitoring response."""
    status: str = Field(..., description="Status of the monitoring operation")
    message: Optional[str] = Field(None, description="Additional information about the operation")
    monitored_paths: Optional[List[str]] = Field(None, description="List of paths being monitored")
    invalid_paths: Optional[List[str]] = Field(None, description="List of invalid paths that couldn't be monitored")
    file_extensions: Optional[List[str]] = Field(None, description="List of file extensions being monitored")


class MonitoringStatusResponse(BaseModel):
    """Schema for monitoring status response."""
    running: bool = Field(..., description="Whether file monitoring is active")
    monitored_paths: List[str] = Field([], description="List of paths being monitored")
    file_extensions: Optional[List[str]] = Field(None, description="List of file extensions being monitored")


class MonitoredFileAnalysisResult(BaseModel):
    """Schema for the result of analyzing a monitored file."""
    file_path: str = Field(..., description="Path to the analyzed file")
    file_type: str = Field(..., description="Type of the analyzed file")
    event_type: str = Field(..., description="Type of event that triggered the analysis (created/modified)")
    analysis_result: StaticAnalysisResponse = Field(..., description="Result of the file analysis")
    timestamp: float = Field(..., description="Timestamp of the analysis") 