#!/usr/bin/env python
"""
更新 Gdansk Pet Rescue 的地址到正确的位置
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter, Address

# 找到 Gdansk Pet Rescue
try:
    shelter = Shelter.objects.get(name='Gdansk Pet Rescue')
    print(f"✅ 找到收容所: {shelter.name}")
    
    if shelter.address:
        print(f"📍 当前地址: {shelter.address}")
        print(f"   街道: {shelter.address.street}")
        print(f"   坐标: ({shelter.address.latitude}, {shelter.address.longitude})")
    
    # 更新地址坐标到正确的位置（格但斯克市中心附近的合理位置）
    # Gdańsk, Poland 的合理坐标范围：lat 54.35-54.45, lon 18.60-18.70
    if shelter.address:
        shelter.address.latitude = 54.3520  # 更北的位置，陆地上
        shelter.address.longitude = 18.6466  # 稍微调整经度
        shelter.address.save()
        print(f"\n✅ 已更新地址坐标:")
        print(f"   新坐标: ({shelter.address.latitude}, {shelter.address.longitude})")
    
except Shelter.DoesNotExist:
    print("❌ 找不到 Gdansk Pet Rescue")
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()
