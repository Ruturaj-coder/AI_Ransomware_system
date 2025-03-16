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
};

// Create the API object
const apiObject = {
  predictionsApi,
  modelApi,
  metricsApi,
};

export default apiObject; 