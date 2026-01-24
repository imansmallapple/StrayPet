#!/usr/bin/env python
"""
诊断宠物和地址关联情况
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter, Address, City

# 统计信息
print("=== 数据库统计 ===")
print(f"总宠物数: {Pet.objects.count()}")
print(f"有地址的宠物: {Pet.objects.filter(address__isnull=False).count()}")
print(f"无地址的宠物: {Pet.objects.filter(address__isnull=True).count()}")
print(f"总收容所数: {Shelter.objects.count()}")
print(f"有地址的收容所: {Shelter.objects.filter(address__isnull=False).count()}")
print(f"总城市数: {City.objects.count()}")

print("\n=== 检查前5个宠物 ===")
for pet in Pet.objects.all()[:5]:
    print(f"\n{pet.name} (ID: {pet.id})")
    print(f"  - 宠物地址: {pet.address_id}")
    print(f"  - 宠物收容所: {pet.shelter_id}")
    
    if pet.address:
        print(f"  - 城市 ID: {pet.address.city_id}")
        print(f"  - 城市对象: {pet.address.city}")
        print(f"  - 城市名: {pet.address.city.name if pet.address.city else 'None'}")
    else:
        print(f"  - ❌ 没有地址")

print("\n=== 查看收容所地址 ===")
for shelter in Shelter.objects.filter(address__isnull=False)[:3]:
    print(f"\n{shelter.name}")
    print(f"  - 地址: {shelter.address}")
    if shelter.address and shelter.address.city:
        print(f"  - 城市: {shelter.address.city.name}")
    else:
        print(f"  - ❌ 没有城市")
