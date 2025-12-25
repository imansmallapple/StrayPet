#!/usr/bin/env python
"""
Test blog API with author information
"""
import os
import sys
import django
import json
import requests

# Setup Django
sys.path.insert(0, str(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

API_BASE = 'http://localhost:8000'

def test_blog_author_info():
    """Test blog API to verify author information is included"""
    
    print(f"\n{'='*70}")
    print("Testing Blog API - Author Information Display")
    print(f"{'='*70}\n")
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='blog_author',
        defaults={
            'email': 'author@test.com',
            'first_name': 'Blog',
            'last_name': 'Author'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✓ Created test user: {user.username}")
    else:
        print(f"✓ Using existing user: {user.username}")
    
    # Get JWT token
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create a test article if none exists
    from apps.blog.models import Article, Category
    
    category, _ = Category.objects.get_or_create(
        name='Test Category',
        defaults={'name': 'Test Category'}
    )
    
    article, created = Article.objects.get_or_create(
        title='Test Article with Author Avatar',
        defaults={
            'description': 'Testing author information display',
            'content': '<h1>Test Article</h1><p>This is a test article to verify author info.</p>',
            'category': category,
            'author': user
        }
    )
    
    if created:
        print(f"✓ Created test article: {article.title}")
    else:
        print(f"✓ Using existing article: {article.title}")
    
    print(f"✓ Article author: {article.author.username}\n")
    
    # Test 1: Get article list
    print("1. Testing GET /blog/article/ (List view)")
    print("-" * 70)
    resp = requests.get(f'{API_BASE}/blog/article/?page=1', headers=headers)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        results = data.get('results', [])
        if results:
            first_article = results[0]
            print(f"First article: {first_article.get('title')}")
            print(f"Author data: {first_article.get('author')}")
            print(f"Author username (old): {first_article.get('author_username')}")
            
            if first_article.get('author'):
                author = first_article.get('author')
                print(f"\n✓ Author information found:")
                print(f"  - ID: {author.get('id')}")
                print(f"  - Username: {author.get('username')}")
                print(f"  - Avatar: {author.get('avatar')}")
            else:
                print("\n✗ No author information in response")
        else:
            print("No articles found")
    else:
        print(f"Error: {resp.text}")
    
    # Test 2: Get article detail
    print(f"\n2. Testing GET /blog/article/{article.id}/ (Detail view)")
    print("-" * 70)
    resp = requests.get(f'{API_BASE}/blog/article/{article.id}/', headers=headers)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"Article: {data.get('title')}")
        print(f"Author data: {data.get('author')}")
        print(f"Author username (old): {data.get('author_username')}")
        
        if data.get('author'):
            author = data.get('author')
            print(f"\n✓ Author information found:")
            print(f"  - ID: {author.get('id')}")
            print(f"  - Username: {author.get('username')}")
            print(f"  - Avatar URL: {author.get('avatar')}")
        else:
            print("\n✗ No author information in response")
    else:
        print(f"Error: {resp.text}")
    
    print(f"\n{'='*70}")
    print("✓ Blog API author information test completed!")
    print(f"{'='*70}\n")

if __name__ == '__main__':
    try:
        test_blog_author_info()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
