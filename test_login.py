#!/usr/bin/env python3
import requests
import json
import os
import sys

# Add backend to path
sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

import django
django.setup()

from django.core.cache import cache

# Get a CAPTCHA
resp = requests.get('http://localhost:8000/user/captcha/')
data = resp.json()
uid = data['uid']
print(f"CAPTCHA UID: {uid}")

# Get the code from cache
code = cache.get(uid)
print(f"CAPTCHA Code: {code}")

# Now test login with valid credentials
login_data = {
    "username": "testuser",
    "password": "testpass123",
    "captcha": code,
    "uid": uid
}

print(f"\nAttempting login with: {login_data}")
login_resp = requests.post('http://localhost:8000/user/token/', json=login_data)
print(f"Status: {login_resp.status_code}")
print(f"Response: {login_resp.text}")

if login_resp.status_code == 200:
    print("\n✓ Login successful!")
    tokens = login_resp.json()
    print(f"Access Token: {tokens['access'][:50]}...")
else:
    print("\n✗ Login failed!")
