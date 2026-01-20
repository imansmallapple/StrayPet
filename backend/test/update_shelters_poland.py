#!/usr/bin/env python
"""
Script to update shelter data to Polish shelters
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter

# Polish shelter data
shelters_data = [
    {
        "name": "Warsaw Animal Care Center",
        "description": "Dedicated to rescuing and protecting stray animals, providing medical care, housing and adoption services in Warsaw",
        "email": "info@warsaw-animal-rescue.pl",
        "phone": "+48 22-1234-5678",
        "website": "https://warsaw-animal-rescue.pl",
        "capacity": 150,
        "current_animals": 85,
        "founded_year": 2010,
        "is_active": True,
        "is_verified": True,
        "facebook_url": "https://facebook.com/warsawrescue",
        "instagram_url": "https://instagram.com/warsawrescue",
    },
    {
        "name": "Krakow Pet Haven",
        "description": "Krakow's largest animal rescue and adoption platform, focusing on stray cats and dogs rescue operations",
        "email": "contact@krakow-pet-haven.com",
        "phone": "+48 12-8888-8888",
        "website": "https://krakow-pet-haven.com",
        "capacity": 200,
        "current_animals": 120,
        "founded_year": 2012,
        "is_active": True,
        "is_verified": True,
        "facebook_url": "https://facebook.com/krakowPetHaven",
        "instagram_url": "https://instagram.com/krakowPetHaven",
    },
    {
        "name": "Gdansk Animal Rescue Station",
        "description": "Providing medical rescue and temporary shelter for stray animals in Gdansk and surrounding areas",
        "email": "help@gdansk-pet-rescue.pl",
        "phone": "+48 58-3333-3333",
        "website": "https://gdansk-pet-rescue.pl",
        "capacity": 120,
        "current_animals": 65,
        "founded_year": 2015,
        "is_active": True,
        "is_verified": False,
        "facebook_url": "",
        "instagram_url": "https://instagram.com/gdanskPetRescue",
    },
    {
        "name": "Wroclaw Warm Hearts Shelter",
        "description": "Wroclaw's most professional animal rescue facility with complete medical and rehabilitation infrastructure",
        "email": "admin@wroclaw-warmhearts.org",
        "phone": "+48 71-9999-8888",
        "website": "https://wroclaw-warmhearts.org",
        "capacity": 180,
        "current_animals": 95,
        "founded_year": 2013,
        "is_active": True,
        "is_verified": True,
        "facebook_url": "https://facebook.com/wroclawwarmhearts",
        "instagram_url": "https://instagram.com/wroclawwarmhearts",
        "twitter_url": "https://twitter.com/wroclawwarmhearts",
    },
    {
        "name": "Poznan Animal Care Association",
        "description": "Professional animal protection and rescue organization serving Poznan region",
        "email": "contact@poznan-animal-care.org",
        "phone": "+48 61-6666-6666",
        "website": "https://poznan-animal-care.org",
        "capacity": 100,
        "current_animals": 45,
        "founded_year": 2014,
        "is_active": True,
        "is_verified": True,
        "facebook_url": "",
        "instagram_url": "https://instagram.com/poznanAnimalCare",
    },
    {
        "name": "Lodz Friendly Pets Rescue Center",
        "description": "Leading animal rescue center in Lodz, committed to finding new homes for stray animals",
        "email": "info@lodz-pet-care.com",
        "phone": "+48 42-5555-5555",
        "website": "https://lodz-pet-care.com",
        "capacity": 150,
        "current_animals": 78,
        "founded_year": 2011,
        "is_active": True,
        "is_verified": True,
        "facebook_url": "https://facebook.com/lodzPetCare",
        "instagram_url": "https://instagram.com/lodzPetCare",
    },
]

created_count = 0

for shelter_data in shelters_data:
    try:
        shelter = Shelter.objects.create(
            name=shelter_data["name"],
            description=shelter_data["description"],
            email=shelter_data["email"],
            phone=shelter_data["phone"],
            website=shelter_data["website"],
            capacity=shelter_data["capacity"],
            current_animals=shelter_data["current_animals"],
            founded_year=shelter_data["founded_year"],
            is_active=shelter_data["is_active"],
            is_verified=shelter_data["is_verified"],
            facebook_url=shelter_data["facebook_url"],
            instagram_url=shelter_data["instagram_url"],
            twitter_url=shelter_data.get("twitter_url", ""),
        )
        print(f"✓ Successfully created shelter: '{shelter.name}' (ID: {shelter.id})")
        created_count += 1
    except Exception as e:
        print(f"✗ Failed to create shelter '{shelter_data['name']}': {str(e)}")

print(f"\nSummary: Successfully added {created_count} Polish shelters")
