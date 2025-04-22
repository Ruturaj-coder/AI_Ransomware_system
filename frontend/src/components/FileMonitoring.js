import React, { useState, useEffect, useRef } from 'react';
import { analysisApi } from '../api/api';
import CodeAnalysisResult from './CodeAnalysisResult';

const FileMonitoring = () => {
  const [monitoringStatus, setMonitoringStatus] = useState({
    running: false,
    monitored_paths: [],
    file_extensions: null
  });
  const [directoryPath, setDirectoryPath] = useState('');
  const [fileExtensions, setFileExtensions] = useState('js,html,py,ps1');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patterns, setPatterns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const socket = useRef(null);

  // Fetch patterns and monitoring status on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patterns
        const patternsResponse = await analysisApi.getDetectionPatterns();
        setPatterns(patternsResponse.data.patterns);
        
        // Fetch monitoring status
        const statusResponse = await analysisApi.getMonitoringStatus();
        setMonitoringStatus(statusResponse.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data');
      }
    };
    
    fetchData();
    
    // Set up WebSocket connection
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);
  
  const connectWebSocket = () => {
    try {
      socket.current = analysisApi.createMonitoringWebSocket();
      
      socket.current.onopen = () => {
        setConnected(true);
        setError('');
        console.log('WebSocket connected');
      };
      
      socket.current.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (!socket.current || socket.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      socket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!connected) {
          setError('WebSocket connection error');
        }
      };
      
      socket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'status') {
            setMonitoringStatus(data.data);
          } else {
            // Handle analysis result
            const newResult = {
              ...data,
              id: Date.now() // Add unique ID for React keys
            };
            
            setAnalysisResults(prev => [newResult, ...prev].slice(0, 100)); // Limit to last 100 results
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError('Failed to establish WebSocket connection');
    }
  };
  
  const handleStartMonitoring = async () => {
    if (!directoryPath) {
      setError('Please enter a directory path');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Split and trim file extensions
      const extensions = fileExtensions
        .split(',')
        .map(ext => ext.trim())
        .filter(ext => ext);
      
      // Start monitoring
      const response = await analysisApi.startMonitoring(
        [directoryPath], 
        extensions.length > 0 ? extensions : null
      );
      
      if (response.data.status === 'started') {
        // Update status
        const statusResponse = await analysisApi.getMonitoringStatus();
        setMonitoringStatus(statusResponse.data);
        
        // Clear directory path input
        setDirectoryPath('');
      } else if (response.data.invalid_paths && response.data.invalid_paths.includes(directoryPath)) {
        setError(`Invalid directory path: ${directoryPath}`);
      } else {
        setError(response.data.message || 'Failed to start monitoring');
      }
    } catch (err) {
      console.error('Error starting monitoring:', err);
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStopMonitoring = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await analysisApi.stopMonitoring();
      
      if (response.data.status === 'stopped') {
        // Update status
        setMonitoringStatus({
          running: false,
          monitored_paths: [],
          file_extensions: null
        });
      } else {
        setError(response.data.message || 'Failed to stop monitoring');
      }
    } catch (err) {
      console.error('Error stopping monitoring:', err);
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearResults = () => {
    setAnalysisResults([]);
    setSelectedResult(null);
  };
  
  const handleResultClick = (result) => {
    setSelectedResult(result === selectedResult ? null : result);
  };
  
  const getSeverityColor = (suspicionScore) => {
    if (suspicionScore > 0.7) return 'bg-red-100 border-red-500 text-red-700';
    if (suspicionScore > 0.4) return 'bg-orange-100 border-orange-500 text-orange-700';
    if (suspicionScore > 0.1) return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    return 'bg-green-100 border-green-500 text-green-700';
  };
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  const formatPath = (path) => {
    // Extract the filename from the path
    const parts = path.split(/[\/\\]/);
    const filename = parts[parts.length - 1];
    
    // Truncate the path if it's too long
    const maxLength = 30;
    let truncatedPath = path;
    if (path.length > maxLength) {
      truncatedPath = '...' + path.substring(path.length - maxLength);
    }
    
    return (
      <div>
        <span className="font-semibold">{filename}</span>
        <span className="text-xs text-gray-500 block truncate">{truncatedPath}</span>
      </div>
    );
  };
  
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'javascript':
        return '📄 JS';
      case 'html':
        return '📄 HTML';
      case 'python':
        return '📄 PY';
      case 'powershell':
        return '📄 PS';
      default:
        return '📄';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Real-Time File Monitoring</h2>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Monitor Settings</h3>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <div className="flex-grow">
              <input
                type="text"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                placeholder="Enter directory path to monitor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading || monitoringStatus.running}
              />
            </div>
            <div className="md:w-1/4">
              <input
                type="text"
                value={fileExtensions}
                onChange={(e) => setFileExtensions(e.target.value)}
                placeholder="File extensions (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading || monitoringStatus.running}
              />
            </div>
            <div>
              {monitoringStatus.running ? (
                <button
                  onClick={handleStopMonitoring}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  {loading ? 'Stopping...' : 'Stop Monitoring'}
                </button>
              ) : (
                <button
                  onClick={handleStartMonitoring}
                  disabled={loading || !directoryPath}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {loading ? 'Starting...' : 'Start Monitoring'}
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          
          {monitoringStatus.running && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
              <h4 className="font-semibold">Actively Monitoring:</h4>
              <ul className="mt-1 list-disc list-inside">
                {monitoringStatus.monitored_paths.map((path, index) => (
                  <li key={index} className="text-sm">{path}</li>
                ))}
              </ul>
              {monitoringStatus.file_extensions && (
                <p className="mt-1 text-sm">
                  <span className="font-semibold">File Extensions:</span> {monitoringStatus.file_extensions.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Detection Results</h3>
            {analysisResults.length > 0 && (
              <button
                onClick={handleClearResults}
                className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear Results
              </button>
            )}
          </div>
          
          {analysisResults.length === 0 ? (
            <div className="p-4 bg-gray-50 text-gray-500 text-center rounded">
              No files have been detected yet. Results will appear here in real-time when files are created or modified.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Detections</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResults.map((result) => (
                      <tr 
                        key={result.id} 
                        onClick={() => handleResultClick(result)}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedResult === result ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-2 px-3 text-sm">{formatTimestamp(result.timestamp)}</td>
                        <td className="py-2 px-3 text-sm">{getFileIcon(result.file_type)}</td>
                        <td className="py-2 px-3 text-sm">{formatPath(result.file_path)}</td>
                        <td className="py-2 px-3 text-sm capitalize">{result.event_type}</td>
                        <td className="py-2 px-3">
                          <div className="text-sm font-semibold rounded py-1 px-2 text-center w-16 inline-block whitespace-nowrap"
                               style={{ 
                                 background: `rgba(${
                                   result.analysis_result.summary.suspicion_score > 0.7 ? '239, 68, 68' : 
                                   result.analysis_result.summary.suspicion_score > 0.4 ? '249, 115, 22' : 
                                   result.analysis_result.summary.suspicion_score > 0.1 ? '245, 158, 11' : '34, 197, 94'
                                 }, 0.2)`,
                                 color: `rgb(${
                                   result.analysis_result.summary.suspicion_score > 0.7 ? '185, 28, 28' : 
                                   result.analysis_result.summary.suspicion_score > 0.4 ? '194, 65, 12' : 
                                   result.analysis_result.summary.suspicion_score > 0.1 ? '180, 83, 9' : '22, 101, 52'
                                 })`
                               }}
                          >
                            {(result.analysis_result.summary.suspicion_score * 100).toFixed(0)}%
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm">{result.analysis_result.summary.total_detections}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {selectedResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Detailed Analysis: {selectedResult.file_path.split(/[\/\\]/).pop()}
                  </h3>
                  <CodeAnalysisResult results={selectedResult.analysis_result} patterns={patterns} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileMonitoring; 