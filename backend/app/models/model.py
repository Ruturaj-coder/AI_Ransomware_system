import os
import time
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, 
    f1_score, roc_auc_score, confusion_matrix
)
from imblearn.over_sampling import SMOTE
import joblib
import logging

from app.core.config import settings

class RansomwareDetectionModel:
    """
    Deep learning model for ransomware detection using TensorFlow
    """
    def __init__(self):
        self.model = None
        self.scaler = None
        self.encoder = None
        self.feature_list = None
        self.target_column = settings.TARGET_COLUMN
        self.model_path = settings.MODEL_PATH
        self.scaler_path = settings.SCALER_PATH
        self.encoder_path = settings.ENCODER_PATH
        self.feature_list_path = settings.FEATURE_LIST_PATH
        self.model_loaded = False
        
    def load(self):
        """
        Load the trained model and preprocessors
        """
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                self.model = load_model(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.encoder = joblib.load(self.encoder_path)
                self.feature_list = joblib.load(self.feature_list_path)
                self.model_loaded = True
                logging.info("Model and preprocessors loaded successfully")
                return True
            except Exception as e:
                logging.error(f"Error loading model: {str(e)}")
                return False
        else:
            logging.warning("Model or preprocessors not found, need training first")
            return False
            
    def preprocess_data(self, data_path):
        """
        Preprocess the dataset for training
        """
        # Load dataset
        df = pd.read_csv(data_path, low_memory=False)
        
        # Extract target and features
        y = df[self.target_column]
        
        # Handle categorical variables
        categorical_cols = df.select_dtypes(include=['object']).columns
        categorical_cols = [col for col in categorical_cols if col != self.target_column]
        
        # Encode categorical features
        self.encoder = LabelEncoder()
        y_encoded = self.encoder.fit_transform(y)
        
        # For simplicity, we'll use a subset of features
        # In a real application, feature selection should be more sophisticated
        # Exclude the target column, Category, and Family
        exclude_cols = [self.target_column, 'Category', 'Family']
        features = [col for col in df.columns if col not in exclude_cols]
        
        # Keep only numeric features for this simple example
        numeric_features = df[features].select_dtypes(include=['float64', 'int64']).columns.tolist()
        
        # Save feature list for prediction
        self.feature_list = numeric_features
        
        # Select features
        X = df[numeric_features].copy()
        
        # Handle missing values
        X.fillna(0, inplace=True)
        
        # Normalize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data into train and test sets
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded,
            test_size=settings.TEST_SIZE,
            random_state=settings.RANDOM_STATE,
            stratify=y_encoded
        )
        
        # Check for class imbalance
        class_counts = np.bincount(y_encoded)
        if min(class_counts) / max(class_counts) < 0.2:  # If imbalanced
            smote = SMOTE(random_state=settings.RANDOM_STATE)
            X_train, y_train = smote.fit_resample(X_train, y_train)
        
        return X_train, X_test, y_train, y_test, len(numeric_features)
    
    def build_model(self, input_dim):
        """
        Build a neural network for binary classification
        """
        model = Sequential([
            Dense(128, activation='relu', input_dim=input_dim),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(64, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(32, activation='relu'),
            BatchNormalization(),
            Dropout(0.2),
            
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, data_path, epochs=50, batch_size=32):
        """
        Train the model on the dataset
        """
        start_time = time.time()
        
        # Preprocess data
        X_train, X_test, y_train, y_test, n_features = self.preprocess_data(data_path)
        
        # Build model
        self.model = self.build_model(n_features)
        
        # Define callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train model
        history = self.model.fit(
            X_train, y_train,
            validation_split=0.2,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping],
            verbose=1
        )
        
        # Calculate training time
        training_time = time.time() - start_time
        
        # Evaluate model
        y_pred_proba = self.model.predict(X_test)
        y_pred = (y_pred_proba > 0.5).astype(int).flatten()
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_pred_proba)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        
        # Save model and preprocessors
        self.model.save(self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        joblib.dump(self.encoder, self.encoder_path)
        joblib.dump(self.feature_list, self.feature_list_path)
        
        self.model_loaded = True
        
        # Return training results
        metrics = {
            "model_version": "v1.0",
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "auc_roc": float(auc),
            "num_features": n_features,
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "epochs": epochs,
            "batch_size": batch_size,
            "training_time": training_time,
            "architecture_summary": json.dumps({"model_summary": str(self.model.summary()), "confusion_matrix": conf_matrix})
        }
        
        return metrics
    
    def predict(self, features_dict):
        """
        Make a prediction for the input features
        """
        if not self.model_loaded:
            success = self.load()
            if not success:
                raise ValueError("Model not loaded and could not be loaded")
        
        # First, let's implement some direct rule-based detection for high-risk scenarios
        # These are common indicators of ransomware activity
        
        # Check for high-risk indicators
        is_high_risk = False
        risk_score = 0.0
        risk_factors = []
        
        # High entropy (typical for encrypted/packed files)
        if features_dict.get('entropy', 0) > 7.5:
            risk_score += 0.25
            risk_factors.append("High entropy")
        
        # Excessive registry operations (common in ransomware)
        if features_dict.get('registry_write', 0) > 100:
            risk_score += 0.25
            risk_factors.append("Excessive registry writes")
        
        if features_dict.get('registry_delete', 0) > 20:
            risk_score += 0.25
            risk_factors.append("Excessive registry deletions")
            
        # Network activity (C&C communication)
        if features_dict.get('network_connections', 0) > 50:
            risk_score += 0.15
            risk_factors.append("High network activity")
            
        if features_dict.get('suspicious_ips', 0) > 5:
            risk_score += 0.25
            risk_factors.append("Multiple suspicious IPs")
        
        # Determine if high risk based on combined factors
        if risk_score >= 0.5:
            is_high_risk = True
        
        # Now proceed with model-based prediction as well
        # Ensure we have all required features
        features = np.zeros(len(self.feature_list))
        
        # Fill in available features
        for i, feature_name in enumerate(self.feature_list):
            if feature_name in features_dict:
                features[i] = features_dict[feature_name]
        
        # Scale features
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # Make prediction
        prediction_proba = self.model.predict(features_scaled)[0][0]
        
        # If the probability is > 0.5, it's malicious (class 1)
        # If the probability is <= 0.5, it's benign (class 0)
        model_prediction = 1 if prediction_proba > 0.5 else 0
        
        # Combine rule-based and model-based approaches
        # If high risk is detected through rules, override the model prediction
        final_prediction = 1 if is_high_risk else model_prediction
        
        # Get the label
        try:
            prediction_label = self.encoder.inverse_transform([final_prediction])[0]
        except:
            # Fallback if encoder fails
            prediction_label = "Malicious" if final_prediction == 1 else "Benign"
        
        # Determine final probability
        if is_high_risk:
            # Use risk score for rule-based detections
            probability = max(0.85, risk_score)
        else:
            # Use model probability but ensure it matches the prediction
            probability = prediction_proba if model_prediction == 1 else 1.0 - prediction_proba
        
        result = {
            "prediction": prediction_label,
            "probability": float(probability),
            "risk_factors": risk_factors if is_high_risk else []
        }
        
        return result

# Create singleton instance
model = RansomwareDetectionModel() 