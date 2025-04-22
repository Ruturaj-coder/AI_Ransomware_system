import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Train from './pages/Train';
import BatchHistory from './pages/BatchHistory';
import CodeAnalysis from './pages/CodeAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/train" element={<Train />} />
            <Route path="/batch-history" element={<BatchHistory />} />
            <Route path="/code-analysis" element={<CodeAnalysis />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
