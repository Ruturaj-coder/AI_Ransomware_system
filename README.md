# AI-Powered Ransomware Detection System

This project implements a deep learning-based ransomware detection system that classifies files as benign or malicious using system-level attributes. The system consists of a React frontend and FastAPI backend with a machine learning model trained on file and system behavior data.

## Project Structure

```
ransomware-detection-system/
├── backend/                     # FastAPI backend
│   ├── app/                     # Backend application
│   │   ├── api/                 # API endpoints
│   │   ├── core/                # Core settings
│   │   ├── db/                  # Database models and session
│   │   ├── models/              # ML model implementation
│   │   ├── schemas/             # Pydantic schemas
│   │   └── utils/               # Utility functions
│   ├── models/                  # Saved model files
│   └── main.py                  # FastAPI entry point
├── frontend/                    # React frontend
├── Dataset/                     # Dataset directory
│   └── Final_Dataset_without_duplicate.csv  # Training dataset
└── README.md                    # Project documentation
```

## Features

- **Deep Learning Model**: Neural network for classifying files as benign or malicious
- **Real-time Prediction API**: REST API for file classification
- **Interactive UI**: Form-based and file upload interfaces for testing
- **Model Training**: API for retraining the model
- **Visualization Dashboard**: Performance metrics and feature importance visualization

## Technology Stack

- **Frontend**: React with TypeScript, TailwindCSS
- **Backend**: FastAPI
- **Database**: SQLite (local)
- **ML Framework**: TensorFlow/Keras
- **Data Processing**: Pandas, NumPy, Scikit-learn

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```
   python main.py
   ```

   The API will be available at http://localhost:8000, and Swagger documentation at http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```
   npm start
   # or
   yarn start
   ```

   The React app will be available at http://localhost:3000

## Usage

### Training the Model

1. Access the model training endpoint in the API:
   ```
   POST /api/model/train
   ```

2. Alternatively, use the training form in the frontend

### Making Predictions

1. Use the prediction form in the frontend to enter file attributes
2. Upload a CSV file with file attributes
3. Or call the prediction API directly:
   ```
   POST /api/predictions/
   ```

## Dataset

The project uses a dataset with the following characteristics:
- Size: 21,752 entries, 77 features
- Features include file-based attributes, system activity indicators, and network behavior
- Target variable: Class (Benign/Malicious)

## Model Details

- Deep learning neural network with multiple layers
- Input: Preprocessed file and system attributes
- Output: Binary classification (Benign/Malicious)
- Performance metrics available through the API

## License

This project is for educational purposes only. 