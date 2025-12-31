#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

user = User.objects.get(username='testuser')
token = AccessToken.for_user(user)

print(f"生成的 token: {str(token)}")
print(f"Token 内容: {token}")

# 现在验证 token
try:
    validated_token = AccessToken(str(token))
    print(f"Token 验证成功")
    print(f"User ID: {validated_token.get('user_id')}")
except Exception as e:
    print(f"Token 验证失败: {e}")
    import traceback
    traceback.print_exc()
