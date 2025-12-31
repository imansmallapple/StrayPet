#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User

# 从 token 字符串创建认证实例
token_str = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3MTIyMzkyLCJpYXQiOjE3NjcxMjIwOTIsImp0aSI6IjM0YWRjN2NhMGExMjRiMGZhZmFjODI4ZmNjMGYzZjcwIiwidXNlcl9pZCI6IjEyIn0.uPUAgK6_hpeON-ATdznQ7vzF4SeJorboxrtrEsYY5OU'

auth = JWTAuthentication()

try:
    from rest_framework_simplejwt.tokens import AccessToken
    validated_token = AccessToken(token_str)
    print(f"Token validated successfully")
    print(f"user_id in token: {repr(validated_token.get('user_id'))} (type: {type(validated_token.get('user_id')).__name__})")
    
    # 尝试获取用户
    user_id = validated_token.get('user_id')
    print(f"\nTrying to get user with id={repr(user_id)}")
    user = User.objects.get(id=user_id)
    print(f"✅ User found: {user.username}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
