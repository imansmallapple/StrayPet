#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("🔍 检查所有宠物的年龄值")
print("=" * 80)

pets = Pet.objects.all()
unknown_age_pets = []

for pet in pets:
    age_years = pet.age_years if pet.age_years is not None else "None"
    age_months = pet.age_months if pet.age_months is not None else "None"
    
    if not pet.age_years and not pet.age_months:
        unknown_age_pets.append(pet)
    
    print(f"{pet.name:20s} - age_years: {str(age_years):5s}, age_months: {str(age_months):5s}")

print("\n" + "=" * 80)
print(f"总共有 {len(unknown_age_pets)} 个宠物的年龄为空")
print("=" * 80)

if unknown_age_pets:
    print("\n❌ 年龄为空的宠物:")
    for pet in unknown_age_pets:
        print(f"  - {pet.name} (ID: {pet.id})")
