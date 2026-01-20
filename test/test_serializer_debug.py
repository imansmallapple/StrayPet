#!/usr/bin/env python
"""Test serializer output with debug info"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server.settings")
django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

# Get Pet 16
pet = Pet.objects.select_related('shelter', 'shelter__address').get(id=16)
print(f"Pet 16 from DB: shelter={pet.shelter}, shelter_id={pet.shelter_id}")

# Create serializer instance
serializer = PetListSerializer(pet)

# Check what the serializer returns
data = serializer.data
print(f"\nSerialized data (all shelter fields):")
print(f"shelter_name: {data.get('shelter_name')}")
print(f"shelter_address: {data.get('shelter_address')}")
print(f"shelter_phone: {data.get('shelter_phone')}")
print(f"shelter_website: {data.get('shelter_website')}")

# Test the methods directly
print(f"\nDirect method calls:")
print(f"get_shelter_name: {serializer.get_shelter_name(pet)}")
print(f"get_shelter_address: {serializer.get_shelter_address(pet)}")
print(f"get_shelter_phone: {serializer.get_shelter_phone(pet)}")
print(f"get_shelter_website: {serializer.get_shelter_website(pet)}")
