#!/usr/bin/env python
"""
把现有的宠物分配到收容所
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter
import random

# 获取所有收容所
shelters = list(Shelter.objects.all())

if not shelters:
    print("❌ 没有找到收容所，请先创建")
    exit(1)

print(f"✅ 找到 {len(shelters)} 个收容所: {[s.name for s in shelters]}")

# 获取所有没有分配收容所的宠物
unassigned_pets = Pet.objects.filter(shelter__isnull=True)
assigned_count = 0

if unassigned_pets.exists():
    print(f"\n📍 准备分配 {unassigned_pets.count()} 个宠物到收容所...")
    
    for pet in unassigned_pets:
        # 随机分配到某个收容所
        shelter = random.choice(shelters)
        pet.shelter = shelter
        pet.save()
        assigned_count += 1
        print(f"  ✅ {pet.name} → {shelter.name}")
else:
    print("✅ 所有宠物都已分配到收容所")

# 显示汇总
print("\n📊 分配汇总:")
for shelter in shelters:
    count = Pet.objects.filter(shelter=shelter).count()
    print(f"  {shelter.name}: {count} 只宠物")

total_assigned = Pet.objects.filter(shelter__isnull=False).count()
total_pets = Pet.objects.count()
print(f"\n✅ 总共: {total_assigned}/{total_pets} 只宠物已分配到收容所")
