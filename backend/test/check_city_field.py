#!/usr/bin/env python
"""
检查 API 序列化器是否正确返回 city 字段
"""
import os
import sys
import json
import django

# 设置 Django 环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(__file__) + '/..')

django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

# 获取第一个宠物
pets = Pet.objects.all()[:5]

if not pets:
    print("❌ 数据库中没有宠物")
    sys.exit(1)

print(f"✅ 找到 {pets.count()} 个宠物，开始序列化检查...\n")

for pet in pets:
    print(f"📌 宠物: {pet.name} (ID: {pet.id})")
    print(f"   - Address: {pet.address}")
    print(f"   - Shelter: {pet.shelter}")
    
    # 序列化宠物
    serializer = PetListSerializer(pet, context={'request': None})
    data = serializer.data
    
    # 检查 city 字段
    if 'city' in data:
        print(f"   ✅ city 字段存在: '{data['city']}'")
    else:
        print(f"   ❌ city 字段不存在!")
    
    # 显示所有字段
    print(f"   Fields: {list(data.keys())}\n")
