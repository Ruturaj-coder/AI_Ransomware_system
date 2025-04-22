import React, { useState, useEffect } from 'react';
import { analysisApi } from '../api/api';
import CodeAnalysisResult from '../components/CodeAnalysisResult';
import FileMonitoring from '../components/FileMonitoring';

const CodeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileType, setFileType] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [showMonitoring, setShowMonitoring] = useState(false);

  // Fetch available detection patterns on component mount
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const response = await analysisApi.getDetectionPatterns();
        setPatterns(response.data.patterns);
      } catch (err) {
        console.error('Error fetching patterns:', err);
      }
    };

    fetchPatterns();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect file type from extension
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (extension === 'js') {
        setFileType('javascript');
      } else if (extension === 'html' || extension === 'htm') {
        setFileType('html');
      } else if (extension === 'py') {
        setFileType('python');
      } else if (extension === 'ps1') {
        setFileType('powershell');
      } else {
        setFileType('javascript'); // Default to JavaScript
      }
    }
  };

  const handleFileContentChange = (e) => {
    setFileContent(e.target.value);
  };

  const handleFileTypeChange = (e) => {
    setFileType(e.target.value);
  };

  const readFileContent = () => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No file selected');
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = (e) => {
        reject('Error reading file');
      };
      
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      let content = '';
      
      if (activeTab === 'upload') {
        content = await readFileContent();
      } else {
        content = fileContent;
      }

      if (!content) {
        throw new Error('No file content to analyze');
      }

      const response = await analysisApi.analyzeFile(content, fileType);
      setResults(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  // Filter patterns by selected file type for the help text
  const selectedFileTypePatterns = patterns.filter(pattern => 
    pattern.file_type === fileType || 
    (fileType === 'javascript' && pattern.file_type === 'js') ||
    (fileType === 'html' && pattern.file_type === 'htm') ||
    (fileType === 'python' && pattern.file_type === 'py') ||
    (fileType === 'powershell' && pattern.file_type === 'ps1')
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Code Content Analysis</h1>
      <p className="mb-6 text-gray-600">
        Analyze script files for potentially malicious patterns and obfuscation techniques.
      </p>

      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${!showMonitoring ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setShowMonitoring(false)}
        >
          Manual Analysis
        </button>
        <button
          className={`px-4 py-2 rounded-md ${showMonitoring ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
          onClick={() => setShowMonitoring(true)}
        >
          Real-Time Monitoring
        </button>
      </div>

      {showMonitoring ? (
        <FileMonitoring />
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="flex border-b">
              <button
                className={`py-3 px-6 font-medium ${activeTab === 'upload' ? 'bg-blue-50 border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload File
              </button>
              <button
                className={`py-3 px-6 font-medium ${activeTab === 'paste' ? 'bg-blue-50 border-b-2 border-blue-500' : 'text-gray-500'}`}
                onClick={() => setActiveTab('paste')}
              >
                Paste Code
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === 'upload' ? (
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Select File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    accept=".js,.html,.htm,.py,.ps1,.txt"
                  />
                  {file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Paste Code</label>
                  <textarea
                    value={fileContent}
                    onChange={handleFileContentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="10"
                    placeholder="Paste your code here..."
                  ></textarea>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">File Type</label>
                <select
                  value={fileType}
                  onChange={handleFileTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="html">HTML</option>
                  <option value="python">Python</option>
                  <option value="powershell">PowerShell</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Supported file types: JavaScript, HTML, Python, PowerShell
                </p>
                {selectedFileTypePatterns.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <strong>Detectable patterns for {fileType}:</strong> {selectedFileTypePatterns.length} patterns 
                      including {selectedFileTypePatterns.filter(p => p.severity === 'high').length} high severity,
                      {' '}{selectedFileTypePatterns.filter(p => p.severity === 'medium').length} medium severity, and
                      {' '}{selectedFileTypePatterns.filter(p => p.severity === 'low').length} low severity patterns.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  disabled={loading || (activeTab === 'upload' && !file) || (activeTab === 'paste' && !fileContent)}
                >
                  {loading ? 'Analyzing...' : 'Analyze Code'}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {results && <CodeAnalysisResult results={results} patterns={patterns} />}
        </>
      )}
    </div>
  );
};

export default CodeAnalysis; 