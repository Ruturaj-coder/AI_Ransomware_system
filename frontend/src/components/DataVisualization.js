import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { metricsApi } from '../api/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DataVisualization = () => {
  const [fileTypeData, setFileTypeData] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // Change default to 7 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVisualizationData();
  }, [timeRange]);

  const fetchVisualizationData = async () => {
    setLoading(true);
    setError('');
    setFileTypeData(null);
    
    try {
      console.log('Fetching visualization data with timeRange:', timeRange);
      const response = await metricsApi.getTimeSeriesPredictions(timeRange);
      console.log('API response:', response.data);
      const data = response.data;
      
      if (data.file_type_distribution && data.file_type_distribution.length > 0) {
        processFileTypeData(data.file_type_distribution);
      } else {
        console.log('No file type distribution data available');
      }
    } catch (err) {
      console.error('Visualization error:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(`Failed to load visualization data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const processFileTypeData = (rawData) => {
    try {
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.log('No file type data available');
        setFileTypeData(null);
        return;
      }
      
      console.log('Processing file type data:', rawData);
      
      // Format data for pie chart
      const fileTypeChartData = {
        labels: rawData.map(item => item.file_type ? String(item.file_type) : 'Unknown'),
        datasets: [
          {
            label: 'File Types',
            data: rawData.map(item => parseInt(item.count) || 0),
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)',
              'rgba(199, 199, 199, 0.5)',
              'rgba(83, 102, 255, 0.5)',
              'rgba(78, 205, 196, 0.5)',
              'rgba(144, 175, 197, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
              'rgba(78, 205, 196, 1)',
              'rgba(144, 175, 197, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
      
      console.log('File type chart data prepared:', fileTypeChartData);
      
      setFileTypeData(fileTypeChartData);
    } catch (err) {
      console.error('Error processing file type data:', err);
      setError(`Error processing file type data: ${err.message}`);
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(parseInt(e.target.value));
  };

  const timeRangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 14 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Data Visualization</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchVisualizationData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Range:</label>
          <select
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchVisualizationData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Refresh Data
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading visualization data...</p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">File Type Distribution</h3>
          {fileTypeData ? (
            <div className="h-[400px] flex items-center justify-center">
              <Pie 
                data={fileTypeData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                          const percentage = Math.round((context.raw / total) * 100);
                          return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-100 rounded-lg">
              <p className="text-gray-600 mb-2">No file type data available</p>
              <p className="text-sm text-gray-500">
                This could be because:
                <ul className="list-disc pl-5 mt-2 text-left max-w-md mx-auto">
                  <li>No file extension information is recorded in predictions</li>
                  <li>The database doesn't have any prediction records</li>
                  <li>Try making predictions with different file types</li>
                </ul>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataVisualization; 