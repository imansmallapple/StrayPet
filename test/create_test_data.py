#!/usr/bin/env python3
import os
import sys
import django
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet, Lost, Address, Country, Region, City
from django.contrib.auth.models import User

print("=" * 60)
print("CREATING TEST DATA")
print("=" * 60)

# Get or create a test user for adoption/lost pets
user, created = User.objects.get_or_create(
    username='shelter_admin',
    defaults={'email': 'shelter@test.com', 'is_active': True}
)
if created:
    user.set_password('shelterpass123')
    user.save()
    print(f"\n✓ Created shelter_admin user")
else:
    print(f"\n✓ Using existing shelter_admin user")

# Update existing pets to AVAILABLE status
available_pets = Pet.objects.filter(status='lost')[:3]
for pet in available_pets:
    pet.status = 'AVAILABLE'
    pet.save()
    print(f"✓ Changed {pet.name} to AVAILABLE")

# Get or create address components
country, _ = Country.objects.get_or_create(name='USA')
region, _ = Region.objects.get_or_create(name='New York', country=country)
city, _ = City.objects.get_or_create(name='New York City', region=region)

# Create Address for lost pet 1
addr1, _ = Address.objects.get_or_create(
    country=country,
    region=region,
    city=city,
    defaults={'street': '123 Main Street', 'postal_code': '10001'}
)

# Create new lost pet record
lost_pet = Lost.objects.create(
    pet_name="Fluffy",
    species="cat",
    breed="Persian",
    color="white",
    lost_time=datetime.now() - timedelta(days=3),
    address=addr1,
    description="White Persian cat with blue eyes, missing since last Monday. Please contact if seen.",
    photo=None,
    contact_phone="555-0100",
    contact_email="john@example.com",
    reporter=user,
    status="open"
)
print(f"✓ Created Lost pet: {lost_pet.pet_name}")

# Create Address for lost pet 2
addr2, _ = Address.objects.get_or_create(
    country=country,
    region=region,
    city=city,
    defaults={'street': '456 Park Street', 'postal_code': '10002'}
)

# Create another lost pet
lost_pet2 = Lost.objects.create(
    pet_name="Buddy",
    species="dog",
    breed="Golden Retriever",
    color="golden",
    lost_time=datetime.now() - timedelta(days=7),
    address=addr2,
    description="Medium-sized golden retriever, responds to 'Buddy'. Very friendly. Last seen near Central Park.",
    photo=None,
    contact_phone="555-0101",
    contact_email="jane@example.com",
    reporter=user,
    status="open"
)
print(f"✓ Created Lost pet: {lost_pet2.pet_name}")

# Check Pet data again
pet_count = Pet.objects.count()
available_count = Pet.objects.filter(status='AVAILABLE').count()
lost_count = Lost.objects.count()

print("\n" + "=" * 60)
print("DATA UPDATED")
print("=" * 60)
print(f"📦 Total Pets: {pet_count} (Available: {available_count})")
print(f"🔍 Lost Pets: {lost_count}")
print("=" * 60)
