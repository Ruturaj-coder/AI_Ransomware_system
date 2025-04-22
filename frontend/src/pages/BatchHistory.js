import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BatchHistory = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBatches, setTotalBatches] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    keyword: '',
  });
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchPredictions, setBatchPredictions] = useState([]);
  const [batchDetailsLoading, setBatchDetailsLoading] = useState(false);

  // Status options for the filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  // Function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to load batch predictions
  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      // Add filters if they're set
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      if (filters.status) params.status = filters.status;
      if (filters.keyword) params.keyword = filters.keyword;
      
      const response = await axios.get('http://localhost:8000/api/predictions/batch/', { params });
      setBatches(response.data.items);
      setTotalBatches(response.data.total);
    } catch (err) {
      console.error('Error loading batch predictions:', err);
      setError('Failed to load batch predictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load batches when component mounts or filters/pagination/sorting changes
  useEffect(() => {
    loadBatches();
  }, [page, limit, sortBy, sortOrder]);

  // Function to handle sort toggle
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
    loadBatches();
  };

  // Function to reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: '',
      keyword: '',
    });
    setPage(1);
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // Function to load batch details (predictions)
  const loadBatchDetails = async (batchId) => {
    if (selectedBatch === batchId) {
      // Toggle off if clicking the same batch
      setSelectedBatch(null);
      setBatchPredictions([]);
      return;
    }
    
    setBatchDetailsLoading(true);
    setSelectedBatch(batchId);
    
    try {
      const response = await axios.get(`http://localhost:8000/api/predictions/batch/${batchId}/predictions`);
      setBatchPredictions(response.data.items);
    } catch (err) {
      console.error('Error loading batch details:', err);
      setError('Failed to load batch details. Please try again later.');
    } finally {
      setBatchDetailsLoading(false);
    }
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalBatches / limit);
  const paginationItems = [];
  
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||                      // First page
      i === totalPages ||             // Last page
      (i >= page - 1 && i <= page + 1) // Current page and adjacent pages
    ) {
      paginationItems.push(i);
    } else if (
      (i === 2 && page > 3) ||        // Ellipsis after first page
      (i === totalPages - 1 && page < totalPages - 2) // Ellipsis before last page
    ) {
      paginationItems.push('...');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Batch Prediction History</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyword Search
            </label>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Search batch name or description..."
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Reset
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Main table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('batch_name')}
                >
                  <div className="flex items-center">
                    Batch Name
                    {sortBy === 'batch_name' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Date
                    {sortBy === 'created_at' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('file_count')}
                >
                  <div className="flex items-center">
                    Files Processed
                    {sortBy === 'file_count' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('malicious_count')}
                >
                  <div className="flex items-center">
                    Malicious Files
                    {sortBy === 'malicious_count' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === 'status' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    No batch predictions found
                  </td>
                </tr>
              ) : (
                batches.map(batch => (
                  <React.Fragment key={batch.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.batch_name}</div>
                        {batch.description && (
                          <div className="text-sm text-gray-500">{batch.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(batch.created_at)}</div>
                        {batch.completed_at && (
                          <div className="text-xs text-gray-500">
                            Completed: {formatDate(batch.completed_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch.file_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.malicious_count}</div>
                        <div className="text-xs text-gray-500">
                          {batch.file_count > 0
                            ? `(${((batch.malicious_count / batch.file_count) * 100).toFixed(1)}%)`
                            : '(0%)'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(batch.status)}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => loadBatchDetails(batch.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {selectedBatch === batch.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded details row */}
                    {selectedBatch === batch.id && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="border rounded-lg overflow-hidden">
                            <div className="px-4 py-3 bg-gray-100 border-b">
                              <h3 className="text-lg font-semibold">Prediction Details</h3>
                            </div>
                            {batchDetailsLoading ? (
                              <div className="p-4 text-center">Loading prediction details...</div>
                            ) : batchPredictions.length === 0 ? (
                              <div className="p-4 text-center">No predictions found for this batch</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Info</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prediction</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {batchPredictions.map(prediction => (
                                      <tr key={prediction.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-gray-900">
                                            {prediction.file_hash && prediction.file_hash.substring(0, 10) + '...'}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {prediction.file_extension && prediction.file_extension}
                                            {prediction.file_size && ` (${prediction.file_size.toFixed(2)} KB)`}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {formatDate(prediction.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            prediction.prediction === 'malicious'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            {prediction.prediction}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {(prediction.probability * 100).toFixed(2)}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === 1
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === totalPages
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{batches.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, totalBatches)}
                </span>{' '}
                of <span className="font-medium">{totalBatches}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                
                {paginationItems.map((item, index) => (
                  <React.Fragment key={index}>
                    {item === '...' ? (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    ) : (
                      <button
                        onClick={() => setPage(item)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                          page === item
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    )}
                  </React.Fragment>
                ))}
                
                <button
                  onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchHistory; 