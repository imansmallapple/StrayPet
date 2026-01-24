#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("🔧 转换宠物性别值")
print("=" * 80)

# 统计现有的值
print("\n转换前的性别值分布：")
for sex_val in Pet.objects.values_list('sex', flat=True).distinct():
    count = Pet.objects.filter(sex=sex_val).count()
    print(f"  {sex_val}: {count} 个")

# 执行转换
conversion_map = {
    'M': 'male',
    'F': 'female',
    'm': 'male',
    'f': 'female',
    'Male': 'male',
    'Female': 'female',
}

total_updated = 0
for old_val, new_val in conversion_map.items():
    count = Pet.objects.filter(sex=old_val).count()
    if count > 0:
        Pet.objects.filter(sex=old_val).update(sex=new_val)
        print(f"\n✅ {old_val} → {new_val}: {count} 个宠物")
        total_updated += count

print(f"\n✅ 成功转换 {total_updated} 个宠物的性别值")

print("\n转换后的性别值分布：")
for sex_val in Pet.objects.values_list('sex', flat=True).distinct():
    count = Pet.objects.filter(sex=sex_val).count()
    print(f"  {sex_val}: {count} 个")

print("=" * 80)
