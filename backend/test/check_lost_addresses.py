#!/usr/bin/env python
"""
检查每个Lost Pet关联的地址信息
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost

lost_pets = Lost.objects.select_related('pet', 'address', 'address__city').all()

print("="*100)
print(f"{'ID':>3} {'宠物名':15} {'城市':15} {'地址ID':>8} {'纬度':>12} {'经度':>12} {'Location':20}")
print("="*100)

for lost in lost_pets[:15]:
    pet_name = lost.pet.name if lost.pet else "Unknown"
    city = lost.address.city.name if lost.address and lost.address.city else "Unknown"
    addr_id = lost.address.id if lost.address else "None"
    lat = f"{lost.address.latitude:.6f}" if lost.address and lost.address.latitude else "None"
    lng = f"{lost.address.longitude:.6f}" if lost.address and lost.address.longitude else "None"
    location = str(lost.address.location) if lost.address and lost.address.location else "None"
    
    print(f"{lost.id:3d} {pet_name:15} {city:15} {str(addr_id):>8} {lat:>12} {lng:>12} {location:20}")

print("="*100)
