#!/usr/bin/env python
import os
import sys
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.blog.models import Article
from apps.comment.models import Comment

User = get_user_model()

# Get test data
try:
    article = Article.objects.filter(public=True).first()
    user = User.objects.first()
    
    if not article or not user:
        print("Need articles and users in the database")
        sys.exit(1)
    
    print(f"Article: {article.id} - {article.title}")
    print(f"User: {user.id} - {user.username}")
    
    # Get token (if you have one stored)
    # For now, test with direct database write to verify model works
    comment = Comment.objects.create(
        owner=user,
        content="Test comment from script",
        content_type_id=article.get_content_type().id,
        object_id=article.id
    )
    print(f"\nComment created successfully: {comment.id}")
    print(f"Comment content: {comment.content}")
    print(f"Comment owner: {comment.owner.username}")
    
    # Now test the serializer
    from apps.blog.serializers import BlogCommentSerializer
    serializer = BlogCommentSerializer(comment)
    print(f"\nSerialized: {serializer.data}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
