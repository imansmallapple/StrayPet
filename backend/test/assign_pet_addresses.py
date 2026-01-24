#!/usr/bin/env python
"""
为宠物分配地址（从关联的收容所地址）- 通过管理命令
"""
import sys
import os
from django.contrib.auth import get_user_model
from apps.pet.models import Pet, Shelter

User = get_user_model()

# 获取所有有地址的收容所
shelters_with_address = Shelter.objects.filter(address__isnull=False)
print(f"📍 找到 {shelters_with_address.count()} 个有地址的收容所")

# 获取所有没有地址的宠物
pets_without_address = Pet.objects.filter(address__isnull=True)
print(f"🐾 找到 {pets_without_address.count()} 个没有地址的宠物")

if not shelters_with_address.exists():
    print("❌ 没有找到有地址的收容所，无法分配地址")
    sys.exit(1)

updated_count = 0

# 为每个没有地址的宠物分配地址（从它们关联的收容所）
for pet in pets_without_address:
    if pet.shelter and pet.shelter.address:
        # 使用宠物所属收容所的地址
        pet.address = pet.shelter.address
        pet.save(update_fields=['address'])
        updated_count += 1
        print(f"✅ {pet.name}: 已分配地址 ({pet.shelter.name})")
    elif shelters_with_address.exists():
        # 如果宠物没有关联的收容所，使用第一个有地址的收容所
        pet.address = shelters_with_address.first().address
        pet.shelter = shelters_with_address.first()
        pet.save(update_fields=['address', 'shelter'])
        updated_count += 1
        print(f"✅ {pet.name}: 已分配地址和收容所")

print(f"\n✅ 成功为 {updated_count} 个宠物分配了地址！")

# 验证结果
pets_with_address = Pet.objects.filter(address__isnull=False)
print(f"📍 现在有 {pets_with_address.count()} 个宠物有地址")

# 检查一个宠物的完整地址链
if pets_with_address.exists():
    pet = pets_with_address.first()
    print(f"\n📌 示例宠物: {pet.name}")
    print(f"   - Address ID: {pet.address_id}")
    if pet.address:
        print(f"   - City: {pet.address.city}")
        print(f"   - Region: {pet.address.region}")
        print(f"   - Country: {pet.address.country}")
