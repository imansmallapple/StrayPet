#!/usr/bin/env python
"""
Test script for avatar API functionality
"""
import os
import sys
import django
import json
import requests
from pathlib import Path

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# API Base URL
API_BASE = 'http://localhost:8000'

def get_jwt_token(username='testuser', password='testpass'):
    """Get JWT token for testing"""
    # First, create test user if it doesn't exist
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': f'{username}@test.com', 'first_name': 'Test', 'last_name': 'User'}
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"Created test user: {username}")
    
    # Get tokens
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), user

def test_avatar_endpoints(token, user):
    """Test avatar API endpoints"""
    headers = {'Authorization': f'Bearer {token}'}
    
    print(f"\n{'='*60}")
    print(f"Testing Avatar API Endpoints for user: {user.username}")
    print(f"{'='*60}\n")
    
    # Test 1: Get current user with avatar
    print("1. Getting current user profile...")
    resp = requests.get(f'{API_BASE}/user/me/', headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        user_data = resp.json()
        print(f"   User: {user_data.get('username')}")
        print(f"   Avatar: {user_data.get('avatar')}")
    else:
        print(f"   Error: {resp.text}")
    
    # Test 2: Upload avatar
    print("\n2. Uploading avatar...")
    # Create a simple test image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    files = {'avatar': ('test_avatar.png', img_bytes, 'image/png')}
    resp = requests.post(f'{API_BASE}/user/avatars/upload/', files=files, headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        user_data = resp.json()
        print(f"   Avatar URL: {user_data.get('avatar')}")
        print(f"   Upload successful!")
    else:
        print(f"   Error: {resp.text}")
    
    # Test 3: Reset to default avatar
    print("\n3. Resetting to default avatar...")
    resp = requests.get(f'{API_BASE}/user/avatars/reset/', headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        user_data = resp.json()
        print(f"   Avatar: {user_data.get('avatar')}")
        print(f"   Reset successful!")
    else:
        print(f"   Error: {resp.text}")
    
    # Test 4: Delete avatar
    print("\n4. Deleting avatar...")
    resp = requests.post(f'{API_BASE}/user/avatars/delete/', headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        result = resp.json()
        print(f"   Message: {result.get('message')}")
        print(f"   Delete successful!")
    else:
        print(f"   Error: {resp.text}")
    
    print(f"\n{'='*60}")
    print("All tests completed!")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    try:
        token, user = get_jwt_token()
        test_avatar_endpoints(token, user)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
