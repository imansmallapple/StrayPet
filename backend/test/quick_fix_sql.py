#!/usr/bin/env python
"""
最简单的修复方式：直接 SQL 更新
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(__file__) + '/..')

django.setup()

from django.db import connection

# 使用原始 SQL 更新宠物地址
# 这会为没有地址的宠物分配他们所属收容所的地址

sql = """
UPDATE pet_pet
SET address_id = (
    SELECT address_id 
    FROM pet_shelter 
    WHERE pet_shelter.id = pet_pet.shelter_id 
    AND pet_shelter.address_id IS NOT NULL
    LIMIT 1
)
WHERE pet_pet.address_id IS NULL 
AND pet_pet.shelter_id IS NOT NULL;
"""

try:
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows_updated = cursor.rowcount
        print(f"✅ 已更新 {rows_updated} 个宠物的地址")
except Exception as e:
    print(f"❌ 更新失败: {str(e)}")
    sys.exit(1)

# 验证
from apps.pet.models import Pet

pets_with_address = Pet.objects.filter(address__isnull=False).count()
pets_total = Pet.objects.count()
print(f"📊 验证: {pets_with_address}/{pets_total} 宠物有地址")

# 显示示例
print("\n📋 示例数据:")
for pet in Pet.objects.filter(address__isnull=False)[:5]:
    city = pet.address.city.name if pet.address and pet.address.city else 'N/A'
    print(f"  {pet.name}: {city}")
