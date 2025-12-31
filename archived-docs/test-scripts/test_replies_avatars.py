#!/usr/bin/env python
"""
Test script to verify that the my_comments endpoint returns user avatars
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.blog.models import Article, Comment

def get_test_user():
    """Get or create a test user"""
    try:
        user = User.objects.filter(username='testuser').first()
        if not user:
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
        return user
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def test_my_comments_endpoint():
    """Test the my_comments endpoint"""
    print("=" * 80)
    print("Testing my_comments endpoint with avatar data")
    print("=" * 80)
    
    # Get test user
    user = get_test_user()
    if not user:
        print("❌ Failed to get test user")
        return
    
    print(f"\n✅ Test User: {user.username}")
    print(f"   User ID: {user.id}")
    print(f"   Has Avatar: {bool(user.profile.avatar)}")
    if user.profile.avatar:
        print(f"   Avatar URL: {user.profile.avatar.url}")
    
    # Create a token for the user
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Make API request
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # GET /blog/my_comments/
    response = client.get('/blog/my_comments/')
    
    print(f"\n📡 Request: GET /blog/my_comments/")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Response Type: {type(data)}")
        
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
            print(f"   Total Comments: {data.get('count', 'N/A')}")
            print(f"   Returned: {len(results)}")
            
            if results:
                print(f"\n📝 Sample Comment:")
                comment = results[0]
                print(f"   ID: {comment.get('id')}")
                print(f"   Content: {comment.get('content', '')[:50]}...")
                
                if 'user' in comment:
                    user_info = comment['user']
                    print(f"\n👤 User Info:")
                    print(f"   ID: {user_info.get('id')}")
                    print(f"   Username: {user_info.get('username')}")
                    print(f"   Avatar: {user_info.get('avatar')}")
                    
                    if user_info.get('avatar'):
                        print(f"   ✅ Avatar URL present!")
                    else:
                        print(f"   ⚠️  No avatar URL in response")
                else:
                    print(f"   ⚠️  No user info in comment")
            else:
                print(f"\n⚠️  No comments found for this user")
        else:
            print(f"   Response data: {data}")
    else:
        print(f"   ❌ Error: {response.status_code}")
        print(f"   Response: {response.json()}")

if __name__ == '__main__':
    test_my_comments_endpoint()
    print("\n" + "=" * 80)
    print("✅ Test completed")
    print("=" * 80)
