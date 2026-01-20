#!/usr/bin/env python3
"""Test the friends list API endpoint"""

import requests
import json

# Use a test token - you should have one from your previous tests
# Let's get one first by logging in
LOGIN_URL = "http://localhost:8000/user/login/"
API_URL = "http://localhost:8000/user/friendships/list_friends/"

# Test credentials
username = "user1"
password = "admin"

# Step 1: Login and get token
print(f"[1] Logging in as {username}...")
login_response = requests.post(LOGIN_URL, json={
    "username": username,
    "password": password
})

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()['access']
print(f"✅ Got token: {token[:20]}...")

# Step 2: Call the friends list API
print(f"\n[2] Calling {API_URL}...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

friends_response = requests.get(API_URL, headers=headers)
print(f"Status: {friends_response.status_code}")
print("Response:")
print(json.dumps(friends_response.json(), indent=2, ensure_ascii=False))
