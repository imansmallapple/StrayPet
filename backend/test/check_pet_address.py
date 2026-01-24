#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("🔍 检查宠物的地址信息")
print("=" * 80)

pets = Pet.objects.all()[:15]

for pet in pets:
    print(f"\n{pet.name}:")
    print(f"  - address_id: {pet.address_id}")
    print(f"  - shelter_id: {pet.shelter_id}")
    
    if pet.address:
        print(f"  - address: {pet.address.street}")
        print(f"  - city_id: {pet.address.city_id}")
        if pet.address.city:
            print(f"  - city_name: {pet.address.city.name}")
        else:
            print(f"  - city: None")
    
    if pet.shelter:
        print(f"  - shelter: {pet.shelter.name}")
        if pet.shelter.address:
            print(f"  - shelter address: {pet.shelter.address}")
            print(f"  - shelter city: {pet.shelter.address.city}")

print("\n" + "=" * 80)
