#!/usr/bin/env python
"""Direct test to check if serializer methods are working"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")

# Force reload of modules
import importlib
import sys

# Remove any cached modules related to serializers
for mod_name in list(sys.modules.keys()):
    if 'serializer' in mod_name.lower() or 'pet' in mod_name.lower():
        try:
            del sys.modules[mod_name]
        except:
            pass

django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

pet = Pet.objects.select_related('shelter', 'shelter__address').get(id=16)
print(f"\n=== Direct Database Query ===")
print(f"Pet ID: {pet.id}")
print(f"Pet shelter_id: {pet.shelter_id}")
print(f"Pet shelter object: {pet.shelter}")

print(f"\n=== Serializer Test ===")
serializer = PetListSerializer(pet, context={'request': None})
data = serializer.data

print(f"shelter_name from serializer: '{data.get('shelter_name')}'")
print(f"shelter_address from serializer: '{data.get('shelter_address')}'")
print(f"shelter_phone from serializer: '{data.get('shelter_phone')}'")
print(f"shelter_website from serializer: '{data.get('shelter_website')}'")
