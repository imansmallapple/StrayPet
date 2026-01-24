#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("📊 宠物年龄数据分析")
print("=" * 80)

# 获取所有宠物
pets = Pet.objects.all()
print(f"\n总宠物数: {pets.count()}\n")

# 统计各个年龄段的宠物
age_distribution = {}
for pet in pets:
    age_years = pet.age_years or 0
    if age_years not in age_distribution:
        age_distribution[age_years] = []
    age_distribution[age_years].append(pet.name)

print("当前年龄分布:")
for age in sorted(age_distribution.keys()):
    count = len(age_distribution[age])
    print(f"  age_years={age}: {count} 个宠物 - {', '.join(age_distribution[age][:5])}")

print("\n" + "=" * 80)
print("新的年龄逻辑应该是:")
print("  0: Under 1 year old")
print("  1-7: 1-7 years old")
print("  8+: 7+ years old")
print("=" * 80)
