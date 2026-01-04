#!/usr/bin/env python
"""
Test Lost Pet API submission via DRF Serializer
"""
import os
import django
import json
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.pet.serializers import LostSerializer
from apps.pet.models import Lost

User = get_user_model()

def test_lost_serializer():
    """Test the Lost serializer with various data"""
    
    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    print("Testing LostSerializer...\n")
    
    # Test 1: Minimal data without address
    print("Test 1: Minimal data (no address)")
    data1 = {
        'pet_name': 'Fluffy',
        'species': 'cat',
        'sex': 'female',
        'lost_time': datetime.now().isoformat(),
        'color': 'white',
        'breed': 'Persian'
    }
    
    serializer1 = LostSerializer(data=data1, context={'request': None})
    if serializer1.is_valid():
        # Override reporter since we don't have a request context
        instance = serializer1.save(reporter=user)
        print(f"  ✅ Serializer is valid")
        print(f"  Created: Lost ID={instance.id}, name={instance.pet_name}")
        instance.delete()
    else:
        print(f"  ❌ Validation errors: {serializer1.errors}")
    
    # Test 2: Data with address_data
    print("\nTest 2: With address_data")
    data2 = {
        'pet_name': 'Buddy',
        'species': 'dog',
        'breed': 'Labrador',
        'sex': 'male',
        'lost_time': datetime.now().isoformat(),
        'description': 'Lost near the park',
        'address_data': {
            'country': 'United States',
            'region': 'California',
            'city': 'San Francisco'
        }
    }
    
    serializer2 = LostSerializer(data=data2, context={'request': None})
    if serializer2.is_valid():
        instance2 = serializer2.save(reporter=user)
        print(f"  ✅ Serializer is valid with address_data")
        print(f"  Created: Lost ID={instance2.id}, name={instance2.pet_name}")
        instance2.delete()
    else:
        print(f"  ❌ Validation errors: {serializer2.errors}")
    
    # Test 3: Data with empty address_data (common issue)
    print("\nTest 3: With empty address_data (all nulls)")
    data3 = {
        'pet_name': 'Max',
        'species': 'dog',
        'sex': 'male',
        'lost_time': datetime.now().isoformat(),
        'address_data': {
            'country': None,
            'region': None,
            'city': None,
            'street': None,
            'postal_code': None
        }
    }
    
    serializer3 = LostSerializer(data=data3, context={'request': None})
    if serializer3.is_valid():
        instance3 = serializer3.save(reporter=user)
        print(f"  ✅ Serializer is valid with empty address_data")
        print(f"  Created: Lost ID={instance3.id}, name={instance3.pet_name}")
        instance3.delete()
    else:
        print(f"  ❌ Validation errors: {serializer3.errors}")
    
    print("\n✅ All serializer tests completed!")

if __name__ == '__main__':
    test_lost_serializer()
