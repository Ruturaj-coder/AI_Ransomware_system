import axios from 'axios';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API for predictions
export const predictionsApi = {
  // Create prediction with file attributes
  createPrediction: (data) => api.post('/predictions', data),
  
  // Get prediction by ID
  getPrediction: (id) => api.get(`/predictions/${id}`),
  
  // List all predictions with pagination
  listPredictions: (skip = 0, limit = 10) => 
    api.get(`/predictions?skip=${skip}&limit=${limit}`),
  
  // Upload CSV file for prediction
  uploadCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/predictions/upload-csv/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Clear all predictions from the database
  clearPredictions: () => api.delete('/predictions/clear'),
};

// API for model operations
export const modelApi = {
  // Train the model
  trainModel: (data) => api.post('/model/train', data),
  
  // Get model info
  getModelInfo: () => api.get('/model/info'),
  
  // Check model status
  getModelStatus: () => api.get('/model/status'),
};

// API for metrics
export const metricsApi = {
  // Get prediction metrics
  getPredictionMetrics: () => api.get('/metrics/predictions'),
  
  // Get model performance metrics
  getModelPerformanceMetrics: () => api.get('/metrics/model-performance'),
  
  // Get feature distribution
  getFeatureDistribution: (feature) => 
    api.get(`/metrics/feature-distribution?feature=${feature}`),
    
  // Get time-series prediction data
  getTimeSeriesPredictions: (days = 30) => 
    api.get(`/metrics/time-series-predictions?days=${days}`),
    
  // Get detailed feature importance data
  getFeatureImportanceDetails: () => 
    api.get('/metrics/feature-importance-details'),
};

// API for code analysis
export const analysisApi = {
  // Perform static analysis on file content
  analyzeFile: (fileContent, fileType) => 
    api.post('/analysis/static', { file_content: fileContent, file_type: fileType }),
  
  // Get available detection patterns
  getDetectionPatterns: (fileType = null) => 
    fileType ? api.get(`/analysis/patterns?file_type=${fileType}`) : api.get('/analysis/patterns'),
  
  // Start file monitoring
  startMonitoring: (paths, fileExtensions = null) => 
    api.post('/analysis/monitor/start', { paths, file_extensions: fileExtensions }),
  
  // Stop file monitoring
  stopMonitoring: () => 
    api.post('/analysis/monitor/stop'),
  
  // Get monitoring status
  getMonitoringStatus: () => 
    api.get('/analysis/monitor/status'),
  
  // Create WebSocket connection for real-time monitoring
  createMonitoringWebSocket: () => {
    // Create WebSocket URL by directly replacing the protocol
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    console.log('Connecting to WebSocket:', wsUrl + '/analysis/monitor/ws');
    return new WebSocket(wsUrl + '/analysis/monitor/ws');
  }
};

// Create the API object
const apiObject = {
  predictionsApi,
  modelApi,
  metricsApi,
  analysisApi,
};

export default apiObject; 