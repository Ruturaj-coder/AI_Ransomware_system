import React, { useState } from 'react';
import { predictionsApi } from '../api/api';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [allResults, setAllResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setAllResults(null);

    try {
      const response = await predictionsApi.uploadCsv(file);
      setResult(response.data);
      
      // Parse and set all results if available
      if (response.data.all_results) {
        try {
          const parsedResults = JSON.parse(response.data.all_results);
          setAllResults(parsedResults);
        } catch (parseErr) {
          console.error('Error parsing all_results:', parseErr);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during file upload');
    } finally {
      setLoading(false);
    }
  };

  // Function to ensure probability is always between 0-100%
  const formatProbability = (probability) => {
    // Convert to number if it's a string
    const numProb = typeof probability === 'string' ? parseFloat(probability) : probability;
    // Clamp between 0 and 1
    const clampedProb = Math.min(Math.max(numProb, 0), 1);
    // Format as percentage with 2 decimal places
    return (clampedProb * 100).toFixed(2);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload File for Analysis</h1>
      <p className="mb-6 text-gray-600">
        Upload a CSV file containing file attributes for ransomware detection.
      </p>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              CSV File
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md"
                accept=".csv"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                disabled={loading || !file}
              >
                {loading ? 'Uploading...' : 'Upload & Analyze'}
              </button>
            </div>
          </div>
        </form>

        {file && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800">
              <span className="font-medium">Selected File:</span> {file.name}
            </p>
            <p className="text-blue-800">
              <span className="font-medium">Size:</span> {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">CSV File Requirements</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>File must be in CSV format</li>
            <li>Each row should contain attributes for a single file</li>
            <li>
              The file should include columns like: file_hash, file_extension, entropy,
              registry_read, network_connections, etc.
            </li>
            <li>
              The system will analyze based on available columns and ignore missing ones
            </li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
          
          {result.processed_rows > 1 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                <span className="font-medium">Processed Rows:</span> {result.processed_rows}
              </p>
            </div>
          )}

          {/* First/Summary Result */}
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
                  Confidence: {formatProbability(result.probability)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <p><span className="font-medium">Filename:</span> {result.filename}</p>
            <p><span className="font-medium">Category:</span> {result.prediction_category || 'N/A'}</p>
            <p><span className="font-medium">Family:</span> {result.prediction_family || 'N/A'}</p>
            
            {result.risk_factors && (
              <div className="mt-3">
                <p><span className="font-medium">Risk Factors:</span> {result.risk_factors}</p>
              </div>
            )}
          </div>
          
          {/* All Results Table */}
          {allResults && allResults.length > 1 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">All Rows Analysis</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">Row</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">Prediction</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">Confidence</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-500">Risk Factors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allResults.map((item) => (
                      <tr key={item.row} className={item.prediction === 'Malicious' ? 'bg-red-50' : 'bg-green-50'}>
                        <td className="py-2 px-4 text-sm">{item.row}</td>
                        <td className="py-2 px-4 text-sm font-medium">
                          <span className="mr-1">
                            {item.prediction === 'Malicious' ? '⚠️' : '✅'}
                          </span>
                          {item.prediction}
                        </td>
                        <td className="py-2 px-4 text-sm">{formatProbability(item.probability)}%</td>
                        <td className="py-2 px-4 text-sm">
                          {item.risk_factors && item.risk_factors.length > 0 
                            ? item.risk_factors.join(', ') 
                            : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload; 