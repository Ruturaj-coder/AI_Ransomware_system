import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          AI-Powered Ransomware Detection System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Detect malicious files using deep learning technology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Predict</h2>
          <p className="text-gray-600 mb-4">
            Enter file attributes to check if a file is benign or malicious.
          </p>
          <Link 
            to="/predict" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Make Prediction
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload</h2>
          <p className="text-gray-600 mb-4">
            Upload a CSV file with file attributes for batch detection.
          </p>
          <Link 
            to="/upload" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Upload File
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <p className="text-gray-600 mb-4">
            View model performance metrics and prediction statistics.
          </p>
          <Link 
            to="/dashboard" 
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-12 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="font-bold text-lg mb-2">1. Data Collection</div>
            <p>System-level attributes like registry activity, network connections, and file properties are collected.</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="font-bold text-lg mb-2">2. Deep Learning Analysis</div>
            <p>Our neural network analyzes these attributes to identify patterns associated with ransomware.</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="font-bold text-lg mb-2">3. Prediction Result</div>
            <p>The system classifies files as benign or malicious with a confidence score.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 