#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer
import json

# Get pet 16
pet = Pet.objects.select_related('shelter', 'shelter__address', 'address').get(id=16)
serializer = PetListSerializer(pet)
data = serializer.data

print("Shelter-related fields:")
print(f"shelter_name: {data.get('shelter_name')}")
print(f"shelter_address: {data.get('shelter_address')}")
print(f"shelter_phone: {data.get('shelter_phone')}")
print(f"shelter_website: {data.get('shelter_website')}")
