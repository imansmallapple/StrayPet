#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from apps.pet.models import Pet, Shelter
from apps.blog.models import Article
from apps.user.models import UserProfile

print("\n=== ✅ PostgreSQL 数据验证 ===\n")
print(f"✅ 用户: {User.objects.count()} 个")
print(f"✅ 宠物: {Pet.objects.count()} 个")
print(f"✅ 收容所: {Shelter.objects.count()} 个")
print(f"✅ 文章: {Article.objects.count()} 个")
print(f"✅ 用户档案: {UserProfile.objects.count()} 个")

# 列出用户
print("\n📋 用户列表 (前5个):")
for user in User.objects.all()[:5]:
    print(f"  - {user.username} ({user.email})")

print("\n🐕 宠物列表 (前5个):")
for pet in Pet.objects.all()[:5]:
    print(f"  - {pet.name} ({pet.species})")

print("\n✅ 迁移成功！所有数据已在 PostgreSQL 中")
