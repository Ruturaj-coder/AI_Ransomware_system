# AI-Powered Ransomware Detection System

An advanced ransomware detection system that uses deep learning to identify potentially malicious files based on their attributes and behaviors.

## Features

- **Machine Learning Detection**: Trained model detects ransomware based on file characteristics
- **Modern Web Interface**: React-based frontend with intuitive UI for file analysis
- **Batch Processing**: Support for CSV batch uploads and analysis
- **Dashboard**: Visualize prediction metrics and system performance
- **Model Training**: Train and fine-tune detection models through the interface

## Technology Stack

### Frontend
- React.js
- Tailwind CSS
- Axios for API communication

### Backend
- FastAPI (Python)
- SQLite/SQLAlchemy for data storage
- Scikit-learn and TensorFlow for ML models
- Imbalanced-learn for handling imbalanced datasets

## Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## System Architecture

The system consists of two main components:
1. **Backend API**: Handles prediction requests, model training, and data storage
2. **Frontend Application**: Provides user interface for prediction, batch uploads, and dashboard visualization

## File Detection Features

The system analyzes various file attributes including:
- File entropy
- Registry operations
- Network activities
- System behaviors
- File characteristics

## Contributors

- Ruturaj

## License

This project is licensed under the MIT License - see the LICENSE file for details. 