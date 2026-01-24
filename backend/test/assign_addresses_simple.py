import os
import sys
import django

# 设置 Django 环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

# 添加 backend 目录到 Python 路径
sys.path.insert(0, 'C:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')

django.setup()

from apps.pet.models import Pet, Shelter

# 获取所有有地址的收容所
shelters_with_address = Shelter.objects.filter(address__isnull=False)
print(f"📍 找到 {shelters_with_address.count()} 个有地址的收容所")

# 获取所有没有地址的宠物
pets_without_address = Pet.objects.filter(address__isnull=True)
print(f"🐾 找到 {pets_without_address.count()} 个没有地址的宠物")

if not shelters_with_address.exists():
    print("❌ 没有找到有地址的收容所")
else:
    updated_count = 0
    
    # 为每个没有地址的宠物分配地址
    for pet in pets_without_address:
        if pet.shelter and pet.shelter.address:
            pet.address = pet.shelter.address
            pet.save(update_fields=['address'])
            updated_count += 1
            print(f"✅ {pet.name}: 已分配地址")
    
    print(f"\n✅ 成功为 {updated_count} 个宠物分配了地址！")
    
    # 验证
    pets_with_address = Pet.objects.filter(address__isnull=False)
    print(f"📍 现在有 {pets_with_address.count()} 个宠物有地址")
