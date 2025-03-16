import React, { useState } from 'react';
import { predictionsApi } from '../api/api';

const Predict = () => {
  const [formData, setFormData] = useState({
    file_hash: '',
    file_extension: '',
    file_size: '',
    entropy: '',
    machine_type: '',
    pe_type: '',
    registry_read: 0,
    registry_write: 0,
    registry_delete: 0,
    network_connections: 0,
    dns_queries: 0,
    suspicious_ips: 0,
    processes_monitored: 0,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.startsWith('registry_') || 
              name.startsWith('network_') || 
              name.startsWith('dns_') || 
              name.startsWith('suspicious_') || 
              name.startsWith('processes_') || 
              name === 'entropy' || 
              name === 'file_size' 
                ? parseFloat(value) || 0 
                : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await predictionsApi.createPrediction(formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Ransomware Detection</h1>
      <p className="mb-6 text-gray-600">
        Enter file and system attributes to check if a file is potentially malicious.
      </p>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">File Attributes</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">File Hash</label>
                <input
                  type="text"
                  name="file_hash"
                  value={formData.file_hash}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., a1b2c3d4e5f6..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">File Extension</label>
                <input
                  type="text"
                  name="file_extension"
                  value={formData.file_extension}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., exe, dll, pdf"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">File Size (bytes)</label>
                <input
                  type="number"
                  name="file_size"
                  value={formData.file_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="File size in bytes"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Entropy</label>
                <input
                  type="number"
                  name="entropy"
                  value={formData.entropy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="File entropy (0-8)"
                  step="0.01"
                  min="0"
                  max="8"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Machine Type</label>
                <input
                  type="text"
                  name="machine_type"
                  value={formData.machine_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., AMD64, x86"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">PE Type</label>
                <input
                  type="text"
                  name="pe_type"
                  value={formData.pe_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., PE32, PE32+"
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">System Activity</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Registry Read Operations</label>
                <input
                  type="number"
                  name="registry_read"
                  value={formData.registry_read}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of registry reads"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Registry Write Operations</label>
                <input
                  type="number"
                  name="registry_write"
                  value={formData.registry_write}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of registry writes"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Registry Delete Operations</label>
                <input
                  type="number"
                  name="registry_delete"
                  value={formData.registry_delete}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of registry deletes"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Network Connections</label>
                <input
                  type="number"
                  name="network_connections"
                  value={formData.network_connections}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of network connections"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">DNS Queries</label>
                <input
                  type="number"
                  name="dns_queries"
                  value={formData.dns_queries}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of DNS queries"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Suspicious IPs</label>
                <input
                  type="number"
                  name="suspicious_ips"
                  value={formData.suspicious_ips}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of suspicious IP connections"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Processes Monitored</label>
                <input
                  type="number"
                  name="processes_monitored"
                  value={formData.processes_monitored}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Number of processes monitored"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Detect Ransomware'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Detection Result</h2>
          
          <div className={`p-4 mb-4 rounded-md ${
            result.prediction === 'Malicious' 
              ? 'bg-red-100 text-red-800 border border-red-300' 
              : 'bg-green-100 text-green-800 border border-green-300'
          }`}>
            <div className="flex items-center">
              <span className="text-2xl mr-2">
                {result.prediction === 'Malicious' ? '⚠️' : '✅'}
              </span>
              <div>
                <p className="font-bold">
                  File is classified as: {result.prediction}
                </p>
                <p>
                  Confidence: {(result.probability * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">ID:</span> {result.id}</p>
                <p><span className="font-medium">File Hash:</span> {result.file_hash || 'N/A'}</p>
                <p><span className="font-medium">File Extension:</span> {result.file_extension || 'N/A'}</p>
              </div>
              <div>
                <p><span className="font-medium">Created:</span> {new Date(result.created_at).toLocaleString()}</p>
                <p><span className="font-medium">Category:</span> {result.prediction_category || 'N/A'}</p>
                <p><span className="font-medium">Family:</span> {result.prediction_family || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predict; 