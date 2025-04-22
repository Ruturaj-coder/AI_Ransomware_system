import requests
import json
import os
import sys

BASE_URL = "http://localhost:8000"

def test_time_series_endpoint():
    """Test the time series endpoint"""
    print("\n\n=== TESTING TIME SERIES ENDPOINT ===")
    
    try:
        # Try different days values
        for days in [7, 30]:
            print(f"\nTesting with days={days}")
            response = requests.get(f"{BASE_URL}/api/metrics/time-series-predictions?days={days}")
            
            # Check if request was successful
            if response.status_code == 200:
                data = response.json()
                print(f"Response status: {response.status_code}")
                print(f"Time series data length: {len(data.get('time_series', []))}")
                print(f"File type distribution length: {len(data.get('file_type_distribution', []))}")
                
                # Print sample data if available
                if data.get('time_series'):
                    print("\nSample time series data:")
                    for i, item in enumerate(data['time_series'][:3]):
                        print(f"  {i+1}. Date: {item.get('date')}, Prediction: {item.get('prediction')}, Count: {item.get('count')}")
                
                if data.get('file_type_distribution'):
                    print("\nSample file type distribution:")
                    for i, item in enumerate(data['file_type_distribution'][:3]):
                        print(f"  {i+1}. File Type: {item.get('file_type')}, Count: {item.get('count')}")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"Error testing time series endpoint: {e}")

def test_feature_importance_endpoint():
    """Test the feature importance endpoint"""
    print("\n\n=== TESTING FEATURE IMPORTANCE ENDPOINT ===")
    
    try:
        response = requests.get(f"{BASE_URL}/api/metrics/feature-importance-details")
        
        # Check if request was successful
        if response.status_code == 200:
            data = response.json()
            print(f"Response status: {response.status_code}")
            
            if data.get('message'):
                print(f"Message: {data['message']}")
            
            print(f"Feature importance length: {len(data.get('feature_importance', []))}")
            print(f"Feature distributions: {list(data.get('feature_value_distributions', {}).keys())}")
            
            # Print sample data if available
            if data.get('feature_importance'):
                print("\nSample feature importance data:")
                for i, item in enumerate(data['feature_importance'][:3]):
                    print(f"  {i+1}. Feature: {item.get('feature')}, Importance: {item.get('importance')}")
            
            for feature, distributions in list(data.get('feature_value_distributions', {}).items())[:1]:
                print(f"\nSample distribution data for {feature}:")
                for i, item in enumerate(distributions[:3]):
                    print(f"  {i+1}. Value Range: {item.get('value_range')}, " +
                          f"Prediction: {item.get('prediction')}, Count: {item.get('count')}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error testing feature importance endpoint: {e}")

if __name__ == "__main__":
    print("Testing API endpoints...\n")
    
    test_time_series_endpoint()
    test_feature_importance_endpoint()
    
    print("\nTests completed!") 