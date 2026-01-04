#!/usr/bin/env python
"""
Add sample pet data for testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.pet.models import Pet, Donation, Shelter, Address, City, Region, Country

User = get_user_model()

def add_sample_pets():
    """Add sample pets to the database"""
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✓ Created test user: {user.username}")
    else:
        print(f"✓ Test user already exists: {user.username}")
    
    # Get shelters
    shelters = list(Shelter.objects.all())
    if not shelters:
        print("❌ No shelters found. Please run add_shelters.py first.")
        return
    
    print(f"✓ Found {len(shelters)} shelters")
    
    # Sample pet data
    pets_data = [
        {
            "name": "Max",
            "species": "dog",
            "breed": "Golden Retriever",
            "sex": "M",
            "age_years": 2,
            "age_months": 6,
            "description": "Friendly and energetic dog, loves to play fetch and swim.",
            "status": "AVAILABLE",
        },
        {
            "name": "Luna",
            "species": "cat",
            "breed": "Persian",
            "sex": "F",
            "age_years": 1,
            "age_months": 3,
            "description": "Gentle and affectionate cat, enjoys being petted and indoor play.",
            "status": "AVAILABLE",
        },
        {
            "name": "Rocky",
            "species": "dog",
            "breed": "Boxer",
            "sex": "M",
            "age_years": 3,
            "age_months": 0,
            "description": "Strong and protective dog, good with families. Needs experienced owner.",
            "status": "AVAILABLE",
        },
        {
            "name": "Whiskers",
            "species": "cat",
            "breed": "Siamese",
            "sex": "M",
            "age_years": 2,
            "age_months": 8,
            "description": "Vocal and intelligent cat, loves interactive toys.",
            "status": "AVAILABLE",
        },
        {
            "name": "Bella",
            "species": "dog",
            "breed": "Labrador",
            "sex": "F",
            "age_years": 1,
            "age_months": 6,
            "description": "Sweet and playful puppy, perfect for active families.",
            "status": "AVAILABLE",
        },
        {
            "name": "Oliver",
            "species": "cat",
            "breed": "Tabby Mix",
            "sex": "M",
            "age_years": 4,
            "age_months": 2,
            "description": "Calm and independent cat, good for quiet homes.",
            "status": "AVAILABLE",
        },
    ]
    
    # Create pets
    created_count = 0
    for idx, pet_data in enumerate(pets_data):
        # Add created_by to pet_data
        pet_data_with_user = {**pet_data, 'created_by': user}
        
        # Create or get the pet
        pet, created = Pet.objects.get_or_create(
            name=pet_data['name'],
            defaults=pet_data_with_user
        )
        
        if created:
            print(f"  ✓ Created pet: {pet.name} ({pet.species})")
        else:
            print(f"  ✓ Pet already exists: {pet.name}")
            continue
        
        # Create donation for this pet, linked to a shelter
        shelter = shelters[idx % len(shelters)]
        donation, donation_created = Donation.objects.get_or_create(
            created_pet=pet,
            defaults={
                'donor': user,
                'shelter': shelter,
                'status': 'approved',
                'name': pet.name,
                'species': pet.species,
                'breed': pet.breed,
                'sex': pet.sex,
                'age_years': pet.age_years,
                'age_months': pet.age_months,
                'description': pet.description,
            }
        )
        
        if donation_created:
            print(f"    → Associated with shelter: {shelter.name}")
            created_count += 1
    
    print(f"\n✅ Successfully added {created_count} pets!")

if __name__ == '__main__':
    add_sample_pets()
