#!/usr/bin/env python
"""Simple test to verify API is working"""
import requests
import time

BASE_URL = 'http://localhost:8000'

# Wait for server to be ready
time.sleep(3)

print("Testing API connectivity...")
try:
    # Test basic endpoint
    response = requests.get(f'{BASE_URL}/pet/', timeout=5)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"API responding correctly")
        print(f"Results: {len(data.get('results', []))} pets")
    else:
        print(f"Error response: {response.text[:200]}")
        
except requests.exceptions.Timeout:
    print("ERROR: API request timed out")
except requests.exceptions.ConnectionError:
    print("ERROR: Cannot connect to API")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
