#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 60)
print("ALL PETS IN DATABASE")
print("=" * 60)

pets = Pet.objects.all()
for pet in pets:
    print(f"\nID: {pet.id}")
    print(f"  Name: {pet.name}")
    print(f"  Species: {pet.species}")
    print(f"  Status: {pet.status}")
    print(f"  Created by: {pet.created_by}")

print("\n" + "=" * 60)
print("FILTERING BY STATUS")
print("=" * 60)

statuses = Pet.objects.values_list('status', flat=True).distinct()
for status in statuses:
    count = Pet.objects.filter(status=status).count()
    print(f"{status}: {count} pets")
