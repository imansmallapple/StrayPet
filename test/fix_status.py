#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet

print("=" * 60)
print("FIXING PET STATUS VALUES")
print("=" * 60)

# Update all pets with AVAILABLE (uppercase) to available (lowercase)
pets_to_fix = Pet.objects.filter(status='AVAILABLE')
count = pets_to_fix.update(status='available')
print(f"\n✓ Fixed {count} pets from 'AVAILABLE' to 'available'")

# Verify
available = Pet.objects.filter(status='available').count()
print(f"✓ Now have {available} pets with 'available' status")

print("\n" + "=" * 60)
