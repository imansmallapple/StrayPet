#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

pet = Pet.objects.first()
if pet:
    print(f"Pet: {pet.name}, Size: '{pet.size}', Sex: {pet.sex}")
    print(f"Size is empty: {pet.size == ''}")
else:
    print("No pets found")
