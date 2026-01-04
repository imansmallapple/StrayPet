#!/usr/bin/env python
"""
Test Lost Pet form submission without authentication
"""
import os
import django
import json
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.pet.models import Lost
from apps.pet.serializers import LostSerializer

User = get_user_model()

def test_lost_submission():
    """Test Lost Pet submission"""
    
    print("Testing Lost Pet Submission...\n")
    
    # Get or create anonymous user
    anonymous_user, created = User.objects.get_or_create(
        username='anonymous',
        defaults={'email': 'anonymous@straypet.local'}
    )
    
    if created:
        print(f"✓ Created anonymous user")
    else:
        print(f"✓ Anonymous user exists")
    
    # Test 1: Minimal submission (no address)
    print("\nTest 1: Minimal Lost Pet submission")
    test_data = {
        'pet_name': 'Test Dog',
        'species': 'dog',
        'breed': 'Golden Retriever',
        'color': 'Golden',
        'sex': 'male',
        'size': 'large',
        'lost_time': (datetime.now() - timedelta(days=1)).isoformat() + 'Z',
        'description': 'Test lost pet report'
    }
    
    serializer = LostSerializer(data=test_data, context={'request': None})
    if serializer.is_valid():
        print(f"  ✅ Data is valid")
        try:
            # Create with anonymous user
            lost = serializer.save(reporter=anonymous_user)
            print(f"  ✅ Created Lost ID: {lost.id}")
            lost.delete()
        except Exception as e:
            print(f"  ❌ Failed to save: {e}")
    else:
        print(f"  ❌ Validation errors: {serializer.errors}")
    
    # Test 2: With datetime from form (ISO without Z)
    print("\nTest 2: Lost Pet with form datetime format")
    form_datetime = datetime.now() - timedelta(days=1)
    # This is what datetime-local input gives us
    form_time_str = form_datetime.strftime('%Y-%m-%dT%H:%M')
    
    test_data2 = {
        'pet_name': 'Test Cat',
        'species': 'cat',
        'sex': 'female',
        'lost_time': f'{form_time_str}:00Z',  # With :00Z added
        'reward': '100'
    }
    
    serializer2 = LostSerializer(data=test_data2, context={'request': None})
    if serializer2.is_valid():
        print(f"  ✅ Data is valid")
        try:
            lost2 = serializer2.save(reporter=anonymous_user)
            print(f"  ✅ Created Lost ID: {lost2.id}")
            lost2.delete()
        except Exception as e:
            print(f"  ❌ Failed to save: {e}")
    else:
        print(f"  ❌ Validation errors: {serializer2.errors}")
    
    print("\n✅ All tests completed!")

if __name__ == '__main__':
    test_lost_submission()
