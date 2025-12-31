#!/usr/bin/env python
"""
Test blog comments with author avatars
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.insert(0, str(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from apps.blog.models import Article, Category
from apps.comment.models import Comment
from django.contrib.contenttypes.models import ContentType

API_BASE = 'http://localhost:8000'

def test_blog_comments_with_avatars():
    """Test that comments include user avatar information"""
    
    print(f"\n{'='*70}")
    print("Testing Blog Comments - User Avatar Information")
    print(f"{'='*70}\n")
    
    # Get or create test user
    user, _ = User.objects.get_or_create(
        username='blog_author',
        defaults={'email': 'author@test.com'}
    )
    
    commenter, _ = User.objects.get_or_create(
        username='commenter',
        defaults={'email': 'commenter@test.com'}
    )
    if not commenter.password.startswith('pbkdf2'):
        commenter.set_password('testpass123')
        commenter.save()
    
    # Get JWT token
    refresh = RefreshToken.for_user(commenter)
    token = str(refresh.access_token)
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get or create article
    category, _ = Category.objects.get_or_create(
        name='Test',
        defaults={'name': 'Test'}
    )
    
    article, _ = Article.objects.get_or_create(
        title='Test Article',
        defaults={
            'description': 'Test',
            'content': 'Test content',
            'category': category,
            'author': user
        }
    )
    
    # Create a test comment
    content_type = ContentType.objects.get_for_model(Article)
    comment, created = Comment.objects.get_or_create(
        owner=commenter,
        content_type=content_type,
        object_id=article.id,
        defaults={'content': 'Great article!'}
    )
    
    if created:
        print(f"✓ Created test comment from {commenter.username}")
    else:
        print(f"✓ Using existing comment from {commenter.username}")
    
    # Test: Get article comments
    print(f"\n1. Testing GET /blog/article/{article.id}/comments/ (Comments list)")
    print("-" * 70)
    resp = requests.get(
        f'{API_BASE}/blog/article/{article.id}/comments/?page_size=10',
        headers=headers
    )
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        results = data.get('results', [])
        if results:
            first_comment = results[0]
            print(f"Comment: {first_comment.get('content')}")
            print(f"User data: {first_comment.get('user')}")
            
            user_info = first_comment.get('user')
            if user_info:
                print(f"\n✓ User information found:")
                print(f"  - ID: {user_info.get('id')}")
                print(f"  - Username: {user_info.get('username')}")
                print(f"  - Avatar: {user_info.get('avatar')}")
            else:
                print("\n✗ No user information in comment")
        else:
            print("No comments found")
    else:
        print(f"Error: {resp.text}")
    
    print(f"\n{'='*70}")
    print("✓ Blog comments with avatars test completed!")
    print(f"{'='*70}\n")

if __name__ == '__main__':
    try:
        test_blog_comments_with_avatars()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
