#!/usr/bin/env python
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost
from apps.pet.serializers import LostSerializer

# 获取前 5 条
lost_pets = Lost.objects.all()[:5]

for lost in lost_pets:
    serializer = LostSerializer(lost)
    data = serializer.data
    print(f"ID: {data['id']}, Name: {data['pet_name']}, City: {data['city']}")
    print(f"  Lat: {data['latitude']}, Lng: {data['longitude']}")
    print(f"  Raw address latitude: {lost.address.latitude if lost.address else None}")
    print(f"  Raw address longitude: {lost.address.longitude if lost.address else None}")
    print()
