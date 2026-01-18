#!/usr/bin/env python
"""
Ensure shelter is set for Pet 16
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Shelter, Address, City, Region, Country

# First, ensure we have a Shelter in the database
print("[1] Checking shelters...")
shelters = Shelter.objects.all()
print(f"Total shelters in DB: {shelters.count()}")

if not shelters.exists():
    print("[2] No shelters found. Creating one...")
    
    # Get or create locations
    country, _ = Country.objects.get_or_create(code='CN', defaults={'name': 'China'})
    region, _ = Region.objects.get_or_create(country=country, code='SH', defaults={'name': 'Shanghai'})
    city, _ = City.objects.get_or_create(region=region, code='SH', defaults={'name': 'Shanghai'})
    
    # Create address
    address = Address.objects.create(
        street='Nanjing Road',
        building_number='1000',
        city=city,
        region=region,
        country=country,
        postal_code='200000'
    )
    
    # Create shelter
    shelter = Shelter.objects.create(
        name='上海宠物之家',
        phone='+86 21-8888-8888',
        website='https://shanghai-pet-home.com',
        address=address,
        description='上海宠物领养中心',
        email='contact@shanghai-pet-home.com',
        is_active=True,
        is_verified=True
    )
    print(f"[3] Created shelter: {shelter.name} (ID={shelter.id})")
else:
    shelter = shelters.first()
    print(f"[2] Using existing shelter: {shelter.name} (ID={shelter.id})")

# Now ensure Pet 16 has this shelter
print(f"\n[4] Checking Pet 16...")
try:
    pet = Pet.objects.get(id=16)
    print(f"Pet 16 found: {pet.name}")
    print(f"Current shelter_id: {pet.shelter_id}")
    
    if pet.shelter_id != shelter.id:
        print(f"[5] Updating Pet 16 shelter to {shelter.name}...")
        pet.shelter = shelter
        pet.save()
        print(f"[6] Pet 16 shelter updated to: {pet.shelter.name} (ID={pet.shelter_id})")
    else:
        print(f"[5] Pet 16 already has correct shelter")
        
except Pet.DoesNotExist:
    print("Pet 16 does not exist!")

print("\nDone!")
