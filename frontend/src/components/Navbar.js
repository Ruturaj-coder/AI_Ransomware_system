import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-bold text-xl">Ransomware Detection System</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="hover:text-blue-300">Home</Link>
          <Link to="/predict" className="hover:text-blue-300">Predict</Link>
          <Link to="/upload" className="hover:text-blue-300">Upload</Link>
          <Link to="/batch-history" className="hover:text-blue-300">Batch History</Link>
          <Link to="/train" className="hover:text-blue-300">Train Model</Link>
          <Link to="/code-analysis" className="hover:text-blue-300">Code Analysis</Link>
          <Link to="/dashboard" className="hover:text-blue-300">Dashboard</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 