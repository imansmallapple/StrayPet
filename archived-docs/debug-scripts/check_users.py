#!/usr/bin/env python
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User

# 查看 testuser
try:
    user = User.objects.get(username='testuser')
    print(f"✅ 找到 testuser")
    print(f"   ID: {user.id}")
    print(f"   Username: {user.username}")
except User.DoesNotExist:
    print(f"❌ testuser 不存在")

# 查看所有用户
print(f"\n所有用户:")
for u in User.objects.all():
    print(f"  - {u.id}: {u.username}")

# 尝试查找 ID=12 的用户
print(f"\n查找 ID=12 的用户:")
try:
    user = User.objects.get(id=12)
    print(f"✅ 找到: {user.username}")
except User.DoesNotExist:
    print(f"❌ ID=12 不存在")
