#!/usr/bin/env python3
"""
Test script for the new replies API endpoint
"""
import sys
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, '/app')
django.setup()

from django.contrib.auth import get_user_model
from apps.comment.models import Comment
from apps.blog.models import Article

User = get_user_model()

# Get or create a test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com'}
)
print(f"User: {user.username} (ID: {user.id}) - Created: {created}")

# Check if there are any comments
comments = Comment.objects.filter(owner=user)
print(f"\nComments by {user.username}: {comments.count()}")

for comment in comments[:3]:
    print(f"  - Comment #{comment.id}: {comment.content[:50]}...")
    if hasattr(comment, 'content_object') and comment.content_object:
        if isinstance(comment.content_object, Article):
            print(f"    Article: {comment.content_object.title}")

print("\nAPI endpoint for getting user comments:")
print("GET /blog/article/my_comments/")
print("\nTest with curl:")
print('curl -X GET http://localhost:8000/blog/article/my_comments/ -H "Authorization: Bearer <your_token>"')
