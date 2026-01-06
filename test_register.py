#!/usr/bin/env python3
import requests
import json

print("=" * 60)
print("TESTING REGISTRATION API")
print("=" * 60)

# Step 1: Send email code
email = f"testuser_reg_{int(1000*__import__('time').time()%10000)}@example.com"
print(f"\n1. Requesting email verification code...")
print(f"   Email: {email}")

r1 = requests.post('http://localhost:8000/user/send_email_code/', 
                   json={'email': email})
print(f"   Status: {r1.status_code}")
if r1.status_code != 200:
    print(f"   Error: {r1.text}")
else:
    print(f"   ✓ Code sent")

# Step 2: Get the code from cache (via Django shell)
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.core.cache import cache
code = cache.get(email)
print(f"\n2. Retrieved code from cache: {code}")

# Step 3: Register with the code
print(f"\n3. Registering new user...")
username = f"testuser_reg_{int(1000*__import__('time').time()%10000)}"
password = "TestPass123456"

register_data = {
    'username': username,
    'email': email,
    'password': password,
    'password1': password,
    'code': code
}

r2 = requests.post('http://localhost:8000/user/register/', json=register_data)
print(f"   Status: {r2.status_code}")

if r2.status_code == 201:
    result = r2.json()
    print(f"   ✓ Registration successful")
    print(f"   Response keys: {list(result.keys())}")
    if 'tokens' in result:
        print(f"   ✓ Tokens present:")
        print(f"     - access: {result['tokens']['access'][:50]}...")
        print(f"     - refresh: {result['tokens']['refresh'][:50]}...")
    else:
        print(f"   ✗ No tokens in response")
        print(f"   Full response: {json.dumps(result, indent=2)}")
else:
    print(f"   ✗ Registration failed")
    print(f"   Response: {r2.text}")

print("\n" + "=" * 60)
