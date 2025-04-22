import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { metricsApi } from '../api/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const FeatureImportanceVisualization = () => {
  const [featureImportance, setFeatureImportance] = useState([]);
  const [featureDistributions, setFeatureDistributions] = useState({});
  const [selectedFeature, setSelectedFeature] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barChartData, setBarChartData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);

  useEffect(() => {
    fetchFeatureImportanceData();
  }, []);

  useEffect(() => {
    if (featureImportance.length > 0 && !selectedFeature) {
      // Select the most important feature by default
      setSelectedFeature(featureImportance[0].feature);
    }
  }, [featureImportance]);

  useEffect(() => {
    if (selectedFeature) {
      createDistributionChart(selectedFeature);
    }
  }, [selectedFeature, featureDistributions]);

  const fetchFeatureImportanceData = async () => {
    setLoading(true);
    setError('');
    setFeatureImportance([]);
    setFeatureDistributions({});
    setBarChartData(null);
    setDistributionData(null);
    
    try {
      console.log('Fetching feature importance data');
      const response = await metricsApi.getFeatureImportanceDetails();
      console.log('Feature importance API response:', response.data);
      const data = response.data;
      
      if (data.message) {
        // If there's a message in the response, it's likely an informational message
        console.log('Feature importance message:', data.message);
      }
      
      if (data.feature_importance && data.feature_importance.length > 0) {
        // Sort features by importance (descending)
        const sortedFeatures = [...data.feature_importance].sort((a, b) => b.importance - a.importance);
        setFeatureImportance(sortedFeatures);
        createBarChart(sortedFeatures);
      } else {
        console.log('No feature importance data available');
      }
      
      if (data.feature_value_distributions && Object.keys(data.feature_value_distributions).length > 0) {
        setFeatureDistributions(data.feature_value_distributions);
      } else {
        console.log('No feature distribution data available');
      }
    } catch (err) {
      console.error('Feature importance error:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to load feature importance data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const createBarChart = (features) => {
    try {
      // Use only top 10 features for better visibility
      const topFeatures = features.slice(0, 10);
      
      console.log('Creating bar chart with features:', topFeatures);
      
      const chartData = {
        labels: topFeatures.map(f => f.feature || 'Unknown'),
        datasets: [
          {
            label: 'Feature Importance',
            data: topFeatures.map(f => {
              const importance = parseFloat(f.importance);
              return isNaN(importance) ? 0 : parseFloat((importance * 100).toFixed(2));
            }),
            backgroundColor: topFeatures.map((_, index) => {
              // Generate color gradient from red to blue
              const ratio = index / (topFeatures.length - 1 || 1);  // Avoid division by zero
              const r = Math.round(255 * (1 - ratio));
              const b = Math.round(255 * ratio);
              return `rgba(${r}, 80, ${b}, 0.7)`;
            }),
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
          }
        ]
      };
      
      console.log('Bar chart data prepared:', chartData);
      setBarChartData(chartData);
    } catch (err) {
      console.error('Error creating bar chart:', err);
      setError(`Error creating feature importance chart: ${err.message}`);
    }
  };

  const createDistributionChart = (featureName) => {
    try {
      if (!featureDistributions[featureName]) {
        console.log(`No distribution data for feature: ${featureName}`);
        setDistributionData(null);
        return;
      }
      
      console.log(`Creating distribution chart for feature: ${featureName}`, featureDistributions[featureName]);
      
      const featureData = featureDistributions[featureName];
      
      // Group by prediction class
      const maliciousData = {};
      const benignData = {};
      const allRanges = new Set();
      
      featureData.forEach(item => {
        // Use default of 0 if value_range is not available or is not a number
        let range = 0;
        try {
          range = parseInt(item.value_range);
          if (isNaN(range)) range = 0;
        } catch (e) {
          console.warn('Invalid value_range:', item.value_range);
        }
        
        allRanges.add(range);
        
        // Convert count to number
        const count = parseInt(item.count) || 0;
        
        if (item.prediction === 'Malicious') {
          maliciousData[range] = (maliciousData[range] || 0) + count;
        } else if (item.prediction === 'Benign') {
          benignData[range] = (benignData[range] || 0) + count;
        }
      });
      
      // Convert to arrays and sort
      const sortedRanges = Array.from(allRanges).sort((a, b) => a - b);
      
      console.log('Sorted ranges:', sortedRanges);
      console.log('Malicious data:', maliciousData);
      console.log('Benign data:', benignData);
      
      const chartData = {
        labels: sortedRanges,
        datasets: [
          {
            label: 'Malicious',
            data: sortedRanges.map(range => maliciousData[range] || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Benign',
            data: sortedRanges.map(range => benignData[range] || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }
        ]
      };
      
      console.log('Distribution chart data prepared:', chartData);
      setDistributionData(chartData);
    } catch (err) {
      console.error('Error creating distribution chart:', err);
      setError(`Error creating feature distribution chart: ${err.message}`);
    }
  };

  const handleFeatureChange = (e) => {
    setSelectedFeature(e.target.value);
  };

  const getFeatureDescription = (feature) => {
    const descriptions = {
      'registry_read': 'Number of registry read operations',
      'registry_write': 'Number of registry write operations',
      'registry_delete': 'Number of registry deletion operations',
      'network_connections': 'Number of network connections established',
      'dns_queries': 'Number of DNS resolution queries',
      'suspicious_ips': 'Number of connections to suspicious IP addresses',
      'processes_monitored': 'Number of processes monitored',
      'entropy': 'Shannon entropy of the file content (higher is more random)',
      'file_size': 'Size of the file in bytes',
      'executable_sections': 'Number of executable sections in the file',
      'imports': 'Number of imported functions',
      'exports': 'Number of exported functions'
    };
    
    return descriptions[feature] || 'No description available';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Feature Importance Analysis</h2>
        <button
          onClick={fetchFeatureImportanceData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Refresh Data
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchFeatureImportanceData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Retry
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading feature importance data...</p>
        </div>
      ) : (
        <>
          {featureImportance.length > 0 ? (
            <>
              {/* Feature Importance Bar Chart */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Top Features by Importance</h3>
                <div className="h-[400px]">
                  {barChartData ? (
                    <Bar 
                      data={barChartData} 
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Importance (%)'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `Importance: ${context.raw}%`;
                              },
                              afterLabel: function(context) {
                                const feature = context.label;
                                return getFeatureDescription(feature);
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                      <p className="text-gray-600">Chart data is being processed...</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Feature Distribution Analysis */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Feature Distribution Analysis</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Feature:</label>
                  <select
                    value={selectedFeature}
                    onChange={handleFeatureChange}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {featureImportance.map(feature => (
                      <option 
                        key={feature.feature} 
                        value={feature.feature}
                        disabled={!featureDistributions[feature.feature]}
                      >
                        {feature.feature} ({(feature.importance * 100).toFixed(1)}%)
                        {!featureDistributions[feature.feature] ? ' (no data)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedFeature && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
                      <div className="md:w-1/2">
                        <h4 className="text-md font-medium">{selectedFeature}</h4>
                        <p className="text-sm text-gray-600">{getFeatureDescription(selectedFeature)}</p>
                        <p className="text-sm font-medium mt-1">
                          Importance: {(featureImportance.find(f => f.feature === selectedFeature)?.importance * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="md:w-1/2 mt-3 md:mt-0">
                        <div className="p-3 bg-blue-50 rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">How to interpret:</span> This chart shows the distribution 
                            of {selectedFeature} values for malicious vs. benign files. Significant differences 
                            between distributions indicate this feature is effective for detection.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-[300px]">
                      {distributionData ? (
                        <Bar 
                          data={distributionData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: selectedFeature
                                }
                              },
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Count'
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              tooltip: {
                                callbacks: {
                                  title: function(context) {
                                    const value = context[0].label;
                                    return `${selectedFeature}: ${value}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="text-center py-10 bg-gray-100 rounded-lg">
                          <p className="text-gray-600 mb-2">No distribution data available for this feature</p>
                          <p className="text-sm text-gray-500">
                            This could be because:
                            <ul className="list-disc pl-5 mt-2 text-left max-w-md mx-auto">
                              <li>No prediction data contains values for this feature</li>
                              <li>The feature is not numeric or has no variation</li>
                              <li>Try making predictions that use this feature</li>
                            </ul>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <p className="text-gray-600 py-4 mb-2">
                No feature importance data available.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This could be because:
                <ul className="list-disc pl-5 mt-2 text-left max-w-md mx-auto">
                  <li>No model has been trained yet</li>
                  <li>The trained model doesn't include feature importance values</li>
                  <li>Train a model with feature importance metrics enabled</li>
                </ul>
              </p>
              <button 
                onClick={fetchFeatureImportanceData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Check Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeatureImportanceVisualization; 