#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 80)
print("📊 宠物数据统计")
print("=" * 80)

total = Pet.objects.count()
with_size = Pet.objects.exclude(size='').count()
without_size = Pet.objects.filter(size='').count()

print(f"\n总宠物数: {total}")
print(f"已有 size 的宠物: {with_size}")
print(f"未有 size 的宠物: {without_size}")

print("\nSize 值分布：")
from django.db.models import Count
size_dist = Pet.objects.values('size').annotate(count=Count('id')).order_by('-count')
for item in size_dist:
    print(f"  {item['size'] or '(empty)'}: {item['count']} 个")

print("\n性别值分布：")
sex_dist = Pet.objects.values('sex').annotate(count=Count('id')).order_by('-count')
for item in sex_dist:
    print(f"  {item['sex']}: {item['count']} 个")

print("=" * 80)
