#!/usr/bin/env python
"""Test pet creation with minimal data to see what errors we get"""
import requests
import json

BASE_URL = 'http://localhost:8000'

# Minimal test data
test_data = {
    'name': 'Test Dog',
    'species': 'dog',
    'sex': 'male',
    'breed': 'Mix',
}

print("Testing pet creation with minimal data...")
print(f"Data: {test_data}")

try:
    # Using JSON for simplicity
    response = requests.post(
        f'{BASE_URL}/pet/',
        json=test_data,
        headers={'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3MzA5Njk3LCJpYXQiOjE3MzcyMjMyOTcsImp0aSI6ImMxZjg1ZmQ0YWE0YzQxMDdhMDg3NWQyMTk1YzM5ZjBkIiwidXNlcl9pZCI6MX0.HjU7V8QHTZ2UWPFM3Jk0vdlaqe4rU9IEJl6f6tYPf94'},  # Dummy token
        timeout=5
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
