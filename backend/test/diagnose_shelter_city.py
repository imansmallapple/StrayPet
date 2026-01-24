#!/usr/bin/env python
"""
诊断收容所和地址的关联情况
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter, Address, City
from apps.pet.serializers import PetListSerializer

print("=" * 80)
print("🔍 诊断收容所地址和城市关联")
print("=" * 80)

# 检查收容所
print("\n[1] 检查收容所...")
shelters = Shelter.objects.all()
print(f"总收容所数: {shelters.count()}")

for shelter in shelters[:3]:
    print(f"\n  📦 {shelter.name}")
    print(f"     - ID: {shelter.id}")
    print(f"     - address_id: {shelter.address_id}")
    
    if shelter.address:
        addr = shelter.address
        print(f"     - Address: {addr.street} {addr.building_number}")
        print(f"     - city_id: {addr.city_id}")
        print(f"     - city: {addr.city}")
        if addr.city:
            print(f"     - city.name: {addr.city.name}")
    else:
        print(f"     - ❌ 没有地址")

# 检查宠物
print("\n\n[2] 检查宠物及其序列化...")
pets = Pet.objects.all()[:3]

for pet in pets:
    print(f"\n  🐾 {pet.name}")
    print(f"     - ID: {pet.id}")
    print(f"     - shelter_id: {pet.shelter_id}")
    
    if pet.shelter:
        print(f"     - shelter: {pet.shelter.name}")
        if pet.shelter.address:
            print(f"       - address_id: {pet.shelter.address_id}")
            if pet.shelter.address.city:
                print(f"       - city: {pet.shelter.address.city.name}")
            else:
                print(f"       - ❌ address 没有 city")
        else:
            print(f"       - ❌ shelter 没有 address")
    else:
        print(f"     - ❌ 没有 shelter")
    
    # 序列化测试
    serializer = PetListSerializer(pet)
    city_value = serializer.data.get('city', 'MISSING')
    print(f"     - 序列化 city: '{city_value}'")

print("\n" + "=" * 80)
