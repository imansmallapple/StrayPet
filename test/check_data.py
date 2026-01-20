#!/usr/bin/env python3
import os
import sys
import django

# Add backend to path
sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Adoption, Lost

print("=" * 60)
print("BACKEND DATA CHECK")
print("=" * 60)

# Check Pet data (for adoption)
pet_count = Pet.objects.count()
print(f"\n📦 Pets (for adoption): {pet_count}")
if pet_count > 0:
    pets = Pet.objects.all()[:3]
    for p in pets:
        print(f"   - {p.name} ({p.species}) - Status: {p.status}")

# Check Adoption data
adoption_count = Adoption.objects.count()
print(f"\n💝 Adoptions: {adoption_count}")
if adoption_count > 0:
    adoptions = Adoption.objects.all()[:3]
    for a in adoptions:
        print(f"   - Pet: {a.pet.name} - Applicant: {a.applicant.username} - Status: {a.status}")

# Check Lost pets
lost_count = Lost.objects.count()
print(f"\n🔍 Lost Pets: {lost_count}")
if lost_count > 0:
    lost_pets = Lost.objects.all()[:3]
    for lp in lost_pets:
        print(f"   - {lp.pet_name} - Status: {lp.status}")
else:
    print("   ❌ No lost pets in database")

print("\n" + "=" * 60)
