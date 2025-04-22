import React from 'react';

const CodeAnalysisResult = ({ results, patterns }) => {
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-gray-600';
    }
  };

  const getFileTypeDisplay = (patternName) => {
    // Find the pattern in the patterns array to get its file type
    const pattern = patterns.find(p => p.pattern_name === patternName);
    if (!pattern) return '';
    
    const fileType = pattern.file_type;
    switch (fileType) {
      case 'javascript':
      case 'js':
        return 'JavaScript';
      case 'html':
      case 'htm':
        return 'HTML';
      case 'python':
      case 'py':
        return 'Python';
      case 'powershell':
      case 'ps1':
        return 'PowerShell';
      default:
        return fileType;
    }
  };

  if (!results) return null;

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-1">Total Detections</p>
              <p className="text-3xl font-bold">{results.summary.total_detections}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-1">Suspicion Score</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                  <div 
                    className={`h-4 rounded-full ${
                      results.summary.suspicion_score > 0.7 ? 'bg-red-500' : 
                      results.summary.suspicion_score > 0.4 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} 
                    style={{ width: `${results.summary.suspicion_score * 100}%` }}
                  ></div>
                </div>
                <span className="font-bold">{(results.summary.suspicion_score * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-1">Risk Level</p>
              <p className={`text-xl font-bold ${
                results.summary.suspicion_score > 0.7 ? 'text-red-600' : 
                results.summary.suspicion_score > 0.4 ? 'text-orange-500' : 
                results.summary.suspicion_score > 0.1 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {results.summary.suspicion_score > 0.7 ? 'High Risk' : 
                 results.summary.suspicion_score > 0.4 ? 'Medium Risk' : 
                 results.summary.suspicion_score > 0.1 ? 'Low Risk' : 'Clean'}
              </p>
            </div>
          </div>
        </div>

        {Object.keys(results.summary.pattern_count).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Pattern Distribution</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Pattern</th>
                    <th className="py-2 px-4 text-left">Description</th>
                    <th className="py-2 px-4 text-left">Type</th>
                    <th className="py-2 px-4 text-left">Severity</th>
                    <th className="py-2 px-4 text-left">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.summary.pattern_count).map(([pattern, count]) => {
                    const patternInfo = patterns.find(p => p.pattern_name === pattern) || { 
                      description: 'Unknown pattern', 
                      severity: 'medium',
                      file_type: ''
                    };
                    
                    return (
                      <tr key={pattern} className="border-t">
                        <td className="py-2 px-4">{pattern}</td>
                        <td className="py-2 px-4">{patternInfo.description}</td>
                        <td className="py-2 px-4">{getFileTypeDisplay(pattern)}</td>
                        <td className={`py-2 px-4 ${getSeverityColor(patternInfo.severity)}`}>
                          {patternInfo.severity.toUpperCase()}
                        </td>
                        <td className="py-2 px-4">{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results.results && results.results.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Detected Patterns</h3>
            <div className="space-y-4">
              {results.results.map((detection, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className={`p-3 ${
                    detection.severity === 'high' ? 'bg-red-50' : 
                    detection.severity === 'medium' ? 'bg-orange-50' : 'bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{detection.pattern_name}</h4>
                        <p className="text-sm">{detection.description}</p>
                        <p className="text-xs text-gray-600 mt-1">Type: {getFileTypeDisplay(detection.pattern_name)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                        detection.severity === 'high' ? 'bg-red-100 text-red-800' : 
                        detection.severity === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {detection.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Line {detection.line_number}</p>
                  </div>
                  <div className="p-3 bg-gray-50">
                    <p className="text-sm font-medium mb-1">Matched Code:</p>
                    <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto text-sm">
                      <code>{detection.matched_text}</code>
                    </pre>
                    {detection.context && detection.context.length > 0 && (
                      <>
                        <p className="text-sm font-medium mt-3 mb-1">Context:</p>
                        <pre className="bg-gray-800 text-white p-2 rounded overflow-x-auto text-sm">
                          <code>{detection.context.join('\n')}</code>
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAnalysisResult; 