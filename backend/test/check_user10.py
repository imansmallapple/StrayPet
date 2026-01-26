#!/usr/bin/env python
import os
import sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.user.serializer import UserInfoSerializer

# 获取用户 10
user = User.objects.get(id=10)
print(f"User 10: {user.username}")
print(f"is_holiday_family_certified: {user.profile.is_holiday_family_certified}")

# 序列化该用户
serializer = UserInfoSerializer(user)
print(f"\nSerialized data:")
print(serializer.data)
