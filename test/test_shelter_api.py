#!/usr/bin/env python
"""
Test the pet API to verify shelter information is returned correctly
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Pet
from apps.pet.serializers import PetListSerializer

def test_pet_api():
    """Test the pet serializer to see if shelter info is included"""
    
    # Get all pets
    pets = Pet.objects.all()
    
    if not pets.exists():
        print("❌ No pets found in database")
        return
    
    print(f"📦 Found {pets.count()} pets\n")
    
    # Serialize each pet
    for pet in pets:
        serializer = PetListSerializer(pet)
        data = serializer.data
        
        print(f"Pet: {data.get('name')}")
        print(f"  Species: {data.get('species')}")
        print(f"  Shelter: {data.get('shelter_name', 'N/A')}")
        print(f"  Shelter Address: {data.get('shelter_address', 'N/A')}")
        print(f"  Shelter Phone: {data.get('shelter_phone', 'N/A')}")
        print(f"  Shelter Website: {data.get('shelter_website', 'N/A')}")
        print()

if __name__ == '__main__':
    test_pet_api()
