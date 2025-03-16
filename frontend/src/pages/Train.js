import React, { useState } from 'react';
import { modelApi } from '../api/api';

const Train = () => {
  const [formData, setFormData] = useState({
    epochs: 50,
    batch_size: 32,
    test_size: 0.2,
    random_state: 42,
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'test_size' ? parseFloat(value) : parseInt(value, 10),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await modelApi.trainModel(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during model training');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Train Ransomware Detection Model</h1>
      <p className="mb-6 text-gray-600">
        Configure and train the deep learning model using the dataset.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Training Parameters</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Epochs</label>
                <input
                  type="number"
                  name="epochs"
                  value={formData.epochs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                  max="200"
                />
                <p className="text-sm text-gray-500 mt-1">Number of training epochs</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Batch Size</label>
                <input
                  type="number"
                  name="batch_size"
                  value={formData.batch_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="8"
                  max="256"
                  step="8"
                />
                <p className="text-sm text-gray-500 mt-1">Number of samples per batch</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Test Size</label>
                <input
                  type="number"
                  name="test_size"
                  value={formData.test_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                />
                <p className="text-sm text-gray-500 mt-1">Proportion of data used for testing (0.1-0.5)</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Random State</label>
                <input
                  type="number"
                  name="random_state"
                  value={formData.random_state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">Random seed for reproducibility</p>
              </div>
              
              <button
                type="submit"
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                disabled={loading}
              >
                {loading ? 'Training Model...' : 'Start Training'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Training Information</h2>
            
            {loading && (
              <div className="text-center py-10">
                <p className="text-lg font-medium text-gray-700 mb-2">Training in Progress</p>
                <p className="text-gray-600 mb-4">This may take several minutes depending on your parameters.</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            
            {!loading && !error && !result && (
              <div className="py-8">
                <p className="text-gray-600 mb-4">
                  The model will be trained on the dataset using the parameters you specify.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Training may take several minutes. Do not close this page during training.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {result && (
              <div>
                <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Model trained successfully!
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-3">Training Results</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-600">Model Version: <span className="font-medium">{result.model_version}</span></p>
                    <p className="text-gray-600">Accuracy: <span className="font-medium">{(result.accuracy * 100).toFixed(2)}%</span></p>
                    <p className="text-gray-600">Precision: <span className="font-medium">{(result.precision * 100).toFixed(2)}%</span></p>
                    <p className="text-gray-600">Recall: <span className="font-medium">{(result.recall * 100).toFixed(2)}%</span></p>
                  </div>
                  <div>
                    <p className="text-gray-600">F1 Score: <span className="font-medium">{(result.f1_score * 100).toFixed(2)}%</span></p>
                    <p className="text-gray-600">AUC-ROC: <span className="font-medium">{(result.auc_roc * 100).toFixed(2)}%</span></p>
                    <p className="text-gray-600">Training Samples: <span className="font-medium">{result.training_samples}</span></p>
                    <p className="text-gray-600">Test Samples: <span className="font-medium">{result.test_samples}</span></p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <a 
                    href="/dashboard" 
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    View Dashboard
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Train; 