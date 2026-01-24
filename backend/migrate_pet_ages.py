#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("🔄 更新宠物年龄数据以符合新的年龄逻辑")
print("=" * 80)

# 新的年龄映射逻辑：
# - age_years >= 8 表示 "7+ years old"
# - 其他值保持不变

updated_count = 0
pets = Pet.objects.all()

for pet in pets:
    age_years = pet.age_years or 0
    original_age = age_years
    
    # 如果年龄 >= 8，保持为 8（代表 7+ years old）
    # 如果年龄 0-7，保持不变
    if age_years >= 8:
        pet.age_years = 8
        pet.save(update_fields=['age_years'])
        updated_count += 1
        print(f"✅ {pet.name}: {original_age} → 8 (7+ years old)")

print(f"\n✅ 总共更新了 {updated_count} 个宠物")
print("\n年龄映射规则:")
print("  age_years = 0: Under 1 year old")
print("  age_years = 1-7: 1-7 years old")
print("  age_years = 8: 7+ years old")
print("=" * 80)
