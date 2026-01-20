#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

print("Testing imports...")
try:
    from apps.pet.models import Pet
    print("[OK] Pet model imported")
    
    from apps.pet.serializers import PetListSerializer
    print("[OK] PetListSerializer imported")
    
    # Test instantiation
    pet_count = Pet.objects.count()
    print(f"[OK] Pet count: {pet_count}")
    
    # Test available pets
    available_pets = Pet.objects.filter(status__in=['available', 'pending'])
    print(f"[OK] Available/Pending pets: {available_pets.count()}")
    
    # Test serialization
    if available_pets.exists():
        pet = available_pets.first()
        serializer = PetListSerializer(pet)
        data = serializer.data
        print(f"[OK] Serialization works for pet {pet.id}")
        print(f"  - name: {data.get('name')}")
        print(f"  - shelter_name: {data.get('shelter_name')}")
    else:
        print("[WARN] No available/pending pets to test")
        
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
