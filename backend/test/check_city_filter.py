#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet
from apps.pet.filters import PetFilter

print("=" * 80)
print("🔍 检查城市过滤")
print("=" * 80)

# 查找 Wroclaw 的宠物
print("\n搜索关键词 'wr':")
pets = Pet.objects.filter(address__city__name__icontains='wr')
print(f"找到 {pets.count()} 只宠物")
for pet in pets:
    city = pet.address.city.name if pet.address and pet.address.city else 'None'
    print(f"  - {pet.name} (城市: {city})")

print("\n搜索关键词 'Wroclaw':")
pets = Pet.objects.filter(address__city__name__icontains='Wroclaw')
print(f"找到 {pets.count()} 只宠物")
for pet in pets:
    city = pet.address.city.name if pet.address and pet.address.city else 'None'
    print(f"  - {pet.name} (城市: {city})")

# 使用过滤器测试
print("\n通过 PetFilter 测试 city='wr':")
qs = Pet.objects.all().filter(status__in=['available', 'pending'])
filtered = PetFilter(data={'city': 'wr'}, queryset=qs)
print(f"找到 {filtered.qs.count()} 只宠物")
for pet in filtered.qs:
    city = pet.address.city.name if pet.address and pet.address.city else 'None'
    print(f"  - {pet.name} (城市: {city})")

print("\n所有宠物的城市信息:")
for pet in Pet.objects.all()[:10]:
    city = pet.address.city.name if pet.address and pet.address.city else 'None'
    print(f"  - {pet.name} (城市: {city})")

print("\n" + "=" * 80)
