#!/usr/bin/env python
import os
import sys
import django

# Add app to path
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost

pet = Lost.objects.get(id=18)
print(f'Pet: {pet.pet_name}')
print(f'Street (DB): {pet.address.street}')
print(f'City (DB): {pet.address.city}')
print(f'Latitude: {pet.address.latitude}')
print(f'Longitude: {pet.address.longitude}')
