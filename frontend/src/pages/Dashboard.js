import React, { useState, useEffect } from 'react';
import { metricsApi, modelApi, predictionsApi } from '../api/api';
import DataVisualization from '../components/DataVisualization';
import FeatureImportanceVisualization from '../components/FeatureImportanceVisualization';

const Dashboard = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [predictionsMetrics, setPredictionsMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearingPredictions, setClearingPredictions] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setClearSuccess(null);
    
    try {
      // Get model info and prediction metrics
      const [modelInfoResponse, predictionsResponse] = await Promise.all([
        modelApi.getModelInfo().catch(() => null),
        metricsApi.getPredictionMetrics().catch(() => null)
      ]);
      
      if (modelInfoResponse) {
        setModelInfo(modelInfoResponse.data);
      }
      
      if (predictionsResponse) {
        setPredictionsMetrics(predictionsResponse.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearPredictions = async () => {
    if (window.confirm('Are you sure you want to clear all predictions? This action cannot be undone.')) {
      setClearingPredictions(true);
      setError('');
      setClearSuccess(null);
      
      try {
        const response = await predictionsApi.clearPredictions();
        setClearSuccess(response.data.message);
        // Refresh dashboard data
        fetchData();
      } catch (err) {
        setError('Failed to clear predictions: ' + (err.response?.data?.detail || err.message));
        console.error('Clear predictions error:', err);
      } finally {
        setClearingPredictions(false);
      }
    }
  };

  // Function to render model metrics card
  const renderModelMetricsCard = () => {
    if (!modelInfo?.metrics) return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Model Metrics</h2>
        <p className="text-gray-600">No model metrics available. Train a model first.</p>
      </div>
    );

    const metrics = modelInfo.metrics;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Model Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800 font-medium">Accuracy</p>
            <p className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-800 font-medium">Precision</p>
            <p className="text-2xl font-bold">{(metrics.precision * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <p className="text-sm text-purple-800 font-medium">Recall</p>
            <p className="text-2xl font-bold">{(metrics.recall * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-sm text-yellow-800 font-medium">F1 Score</p>
            <p className="text-2xl font-bold">{(metrics.f1_score * 100).toFixed(2)}%</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Training Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Model Version: <span className="font-medium">{metrics.model_version}</span></p>
              <p className="text-gray-600">Features Used: <span className="font-medium">{metrics.num_features}</span></p>
              <p className="text-gray-600">Training Samples: <span className="font-medium">{metrics.training_samples}</span></p>
            </div>
            <div>
              <p className="text-gray-600">Test Samples: <span className="font-medium">{metrics.test_samples}</span></p>
              <p className="text-gray-600">Epochs: <span className="font-medium">{metrics.epochs || 'N/A'}</span></p>
              <p className="text-gray-600">Batch Size: <span className="font-medium">{metrics.batch_size || 'N/A'}</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render predictions metrics card
  const renderPredictionsCard = () => {
    if (!predictionsMetrics) return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Predictions Overview</h2>
        <p className="text-gray-600">No prediction data available yet.</p>
      </div>
    );

    // Function to format and ensure probability is between 0-100%
    const formatProbability = (probability) => {
      // Convert to number if it's a string
      const numProb = typeof probability === 'string' ? parseFloat(probability) : probability;
      // Clamp between 0 and 1
      const clampedProb = Math.min(Math.max(numProb, 0), 1);
      // Return the clamped value
      return clampedProb;
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Predictions Overview</h2>
          <button
            onClick={handleClearPredictions}
            disabled={clearingPredictions}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {clearingPredictions ? 'Clearing...' : 'Clear All Predictions'}
          </button>
        </div>
        
        {clearSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded">
            {clearSuccess}
          </div>
        )}
        
        <p className="text-2xl font-bold mb-4">{predictionsMetrics.total_predictions} <span className="text-lg font-normal text-gray-600">total predictions</span></p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Prediction Distribution</h3>
            {predictionsMetrics.predictions_by_class && Object.keys(predictionsMetrics.predictions_by_class).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(predictionsMetrics.predictions_by_class).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${key === 'Malicious' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <span className="flex-1">{key}</span>
                    <span className="font-medium">{value}</span>
                    <span className="text-gray-600 text-sm ml-2">
                      ({((value / predictionsMetrics.total_predictions) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No prediction data available</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Confidence Scores</h3>
            {predictionsMetrics.avg_probability_by_class && Object.keys(predictionsMetrics.avg_probability_by_class).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(predictionsMetrics.avg_probability_by_class).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{key}</span>
                      <span className="font-medium">{(formatProbability(value) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${key === 'Malicious' ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${formatProbability(value) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No confidence data available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Function to render feature importance card
  const renderFeatureImportanceCard = () => {
    if (!modelInfo?.feature_importance) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Feature Importance</h2>
        <div className="space-y-3">
          {modelInfo.feature_importance.map(feature => (
            <div key={feature.feature} className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">{feature.feature}</span>
                <span>{(feature.importance * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${feature.importance * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {renderModelMetricsCard()}
          {renderPredictionsCard()}
          
          {/* New Data Visualization Components */}
          <DataVisualization />
          
          {/* Either show the new detailed feature importance visualization or the simpler one */}
          {modelInfo?.feature_importance ? (
            <FeatureImportanceVisualization />
          ) : (
            renderFeatureImportanceCard()
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 