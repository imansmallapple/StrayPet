#!/usr/bin/env python
"""Test FormData submission like the frontend does"""
import requests
import json

BASE_URL = 'http://localhost:8000'

# Create FormData like the frontend
files = {
    'name': (None, 'Test Pet'),
    'species': (None, 'dog'),
    'sex': (None, 'male'),
    'breed': (None, 'Mix'),
    'age_years': (None, '1'),
    'age_months': (None, '0'),
    'description': (None, 'A test pet'),
    'city': (None, 'Warsaw'),
    'contact_phone': (None, '+48123456789'),
    'address_data': (None, json.dumps({'city': 'Warsaw', 'country': 'Poland'})),
    # Boolean fields
    'vaccinated': (None, 'false'),
    'sterilized': (None, 'false'),
    'dewormed': (None, 'false'),
    'microchipped': (None, 'false'),
    'child_friendly': (None, 'false'),
    'trained': (None, 'false'),
    'loves_play': (None, 'false'),
    'loves_walks': (None, 'false'),
    'good_with_dogs': (None, 'false'),
    'good_with_cats': (None, 'false'),
    'affectionate': (None, 'false'),
    'needs_attention': (None, 'false'),
}

print("Sending FormData to POST /pet/...")
try:
    response = requests.post(
        f'{BASE_URL}/pet/',
        files=files,
        headers={'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM3MzA5Njk3LCJpYXQiOjE3MzcyMjMyOTcsImp0aSI6ImMxZjg1ZmQ0YWE0YzQxMDdhMDg3NWQyMTk1YzM5ZjBkIiwidXNlcl9pZCI6MX0.HjU7V8QHTZ2UWPFM3Jk0vdlaqe4rU9IEJl6f6tYPf94'},
        timeout=5
    )
    
    print(f"\nStatus Code: {response.status_code}")
    try:
        resp_json = response.json()
        print(f"Response:\n{json.dumps(resp_json, indent=2, ensure_ascii=False)}")
    except:
        print(f"Response text:\n{response.text[:500]}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
