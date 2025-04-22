# Technical Context

## Technology Stack

### Frontend
- **React.js**: Core framework for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Axios**: HTTP client for API communication
- **Chart.js/React-chartjs**: Data visualization library
- **React Router**: Client-side routing
- **React-PDF**: For displaying generated PDF reports in the browser
- **FileReader API**: For client-side file reading and analysis

### Backend
- **FastAPI**: Modern, high-performance Python web framework
- **Uvicorn**: ASGI server for running FastAPI applications
- **SQLite**: Lightweight database for storage
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and settings management
- **APScheduler**: Task scheduling for automated model retraining
- **ReportLab/WeasyPrint**: PDF generation libraries

### Machine Learning
- **TensorFlow**: Deep learning framework for model creation
- **Scikit-learn**: Machine learning library for preprocessing and metrics
- **Imbalanced-learn**: Library for handling imbalanced datasets
- **NumPy/Pandas**: Data manipulation and analysis
- **Joblib**: Model serialization and persistence
- **SHAP**: For model explanation and feature importance visualization

### Static Analysis (Implemented)
- **re (Python Regex)**: Pattern matching for suspicious code detection
- **Pydantic**: Schema validation for analysis requests and responses
- **JavaScript Pattern Library**: Custom detection patterns for malicious JavaScript
- **React Components**: Reusable UI components for displaying analysis results

## Development Setup
- **Python 3.8+**: Backend language
- **Node.js/npm**: Frontend build tools
- **Git**: Version control
- **Visual Studio Code**: Recommended IDE

## Technical Constraints
1. **Model Size**: ML models should be optimized for reasonable memory usage
2. **Response Time**: API responses should be returned within 500ms
3. **Browser Compatibility**: Support for modern browsers (Chrome, Firefox, Safari, Edge)
4. **Data Privacy**: No actual user files are uploaded, only metadata and characteristics
5. **PDF Generation**: PDF reports should be generated server-side and streamed to client
6. **File Analysis**: Currently limited to JavaScript files, with a size limit for browser performance

## Dependencies
### Critical Backend Dependencies
- FastAPI
- TensorFlow
- SQLAlchemy
- Scikit-learn
- Pandas
- Imbalanced-learn
- APScheduler (new)
- ReportLab/WeasyPrint (new)
- Yara-python (new)

### Critical Frontend Dependencies
- React
- Tailwind CSS
- Axios
- Chart.js
- React-PDF (new)

## API Endpoints

### Predictions
- `POST /api/predictions/single`: Process a single file prediction
- `POST /api/predictions/batch`: Process a batch prediction from CSV
- `GET /api/predictions/history`: Get prediction history

### Model Management
- `POST /api/model/train`: Train a new model
- `GET /api/model/performance`: Get model performance metrics
- `POST /api/model/schedule`: Set up automatic retraining schedule (new)
- `GET /api/model/versions`: Get available model versions (new)

### Metrics
- `GET /api/metrics/dashboard`: Get dashboard metrics
- `GET /api/metrics/feature-importance`: Get feature importance data

### Content Analysis (Implemented)
- `POST /api/analysis/static`: Perform static analysis on script files
- `GET /api/analysis/patterns`: Get available detection patterns

### Reports (New)
- `POST /api/reports/generate`: Generate a PDF report
- `GET /api/reports/templates`: Get available report templates

## Frontend Routes

### Main Pages
- `/`: Home page with overview
- `/predict`: File prediction page with attribute form
- `/upload`: Batch upload for CSV files
- `/dashboard`: Metrics and visualization dashboard
- `/train`: Model training interface
- `/batch-history`: History of batch predictions
- `/code-analysis`: JavaScript code analysis page

## Component Structure
- **Shared Components**: Navbar, DataVisualization, CodeAnalysisResult
- **Page Components**: Home, Predict, Upload, Train, Dashboard, BatchHistory, CodeAnalysis
- **API Integration**: Axios-based client with centralized API modules

## Deployment Considerations
- Currently designed for local deployment
- Future considerations for containerization with Docker
- Possible cloud deployment through AWS, Azure, or GCP
- Scheduled tasks require persistent server for retraining functionality 