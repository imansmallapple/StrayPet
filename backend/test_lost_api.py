#!/usr/bin/env python
"""
Test Lost Pet API HTTP endpoint
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:8000'
API_URL = f'{BASE_URL}/api/pet/lost/'

def test_api():
    """Test the Lost API endpoint"""
    
    print("Testing Lost Pet API Endpoint...\n")
    
    # First, get authentication token (or create a test user)
    print("Step 1: Getting authentication token...")
    
    # Try to login with test user
    login_url = f'{BASE_URL}/api/token/'
    login_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    # Create user first if needed
    try:
        from django.contrib.auth import get_user_model
        import os
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
        django.setup()
        
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"  ✓ Created test user")
        else:
            print(f"  ✓ Test user exists")
    except Exception as e:
        print(f"  ✗ Failed to create user: {e}")
    
    # Get token
    try:
        token_response = requests.post(login_url, json=login_data)
        if token_response.status_code == 200:
            token = token_response.json().get('access')
            print(f"  ✓ Got authentication token")
        else:
            print(f"  ! Token endpoint returned {token_response.status_code}: {token_response.text}")
            token = None
    except Exception as e:
        print(f"  ! Failed to get token: {e}")
        token = None
    
    # Test Lost API
    print("\nStep 2: Testing Lost API with minimal data...")
    
    lost_data = {
        'pet_name': 'Test Dog',
        'species': 'dog',
        'breed': 'Golden Retriever',
        'color': 'Golden',
        'sex': 'male',
        'size': 'large',
        'lost_time': (datetime.now() - timedelta(days=1)).isoformat(),
        'description': 'Test lost pet report'
    }
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    headers['Content-Type'] = 'application/json'
    
    try:
        response = requests.post(API_URL, json=lost_data, headers=headers)
        print(f"  Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"  ✅ Success! Created Lost ID: {result.get('id')}")
        else:
            print(f"  ❌ Error: {response.text}")
            try:
                error_detail = response.json()
                print(f"  Details: {json.dumps(error_detail, indent=2)}")
            except:
                pass
    except Exception as e:
        print(f"  ❌ Request failed: {e}")
    
    # Test with FormData
    print("\nStep 3: Testing Lost API with FormData (multipart)...")
    
    files = {}
    formdata = {
        'pet_name': 'Test Cat',
        'species': 'cat',
        'sex': 'female',
        'lost_time': datetime.now().isoformat(),
        'address_data': json.dumps({
            'country': None,
            'region': None,
            'city': None
        })
    }
    
    headers_form = {}
    if token:
        headers_form['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.post(API_URL, data=formdata, files=files, headers=headers_form)
        print(f"  Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"  ✅ Success! Created Lost ID: {result.get('id')}")
        else:
            print(f"  ❌ Error: {response.text}")
            try:
                error_detail = response.json()
                print(f"  Details: {json.dumps(error_detail, indent=2)}")
            except:
                pass
    except Exception as e:
        print(f"  ❌ Request failed: {e}")

if __name__ == '__main__':
    test_api()
