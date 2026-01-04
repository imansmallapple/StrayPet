#!/usr/bin/env python
"""
Associate existing pet donations with shelters.
This script randomly assigns shelters to pets that don't yet have a shelter.
"""

import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Donation, Shelter

def associate_pets_with_shelters():
    """Associate existing pets without shelters with random shelters."""
    
    # Get all shelters
    shelters = list(Shelter.objects.all())
    
    if not shelters:
        print("❌ No shelters found in database. Please run add_shelters.py first.")
        return
    
    # Get all donations without shelters
    donations_without_shelter = Donation.objects.filter(shelter__isnull=True)
    
    if not donations_without_shelter.exists():
        print("✅ All donations already have shelters associated!")
        return
    
    print(f"📦 Found {donations_without_shelter.count()} donations without shelters")
    print(f"🏛️  Available shelters: {len(shelters)}")
    print("\nAssociating donations with shelters...")
    
    for donation in donations_without_shelter:
        # Randomly select a shelter
        shelter = random.choice(shelters)
        donation.shelter = shelter
        donation.save()
        print(f"  ✓ Donation '{donation.pet.name}' → {shelter.name}")
    
    print(f"\n✅ Successfully associated {donations_without_shelter.count()} donations with shelters!")
    
    # Display summary
    print("\n📊 Shelter distribution:")
    for shelter in shelters:
        pet_count = shelter.donations.count()
        print(f"  - {shelter.name}: {pet_count} pets")

if __name__ == '__main__':
    associate_pets_with_shelters()
