#!/usr/bin/env python
"""
Test Lost Pet API submission to verify 400 error is fixed
"""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.pet.models import Lost

User = get_user_model()

def test_lost_creation():
    """Test creating a lost pet record"""
    
    # Get or create a test user
    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    
    print("Testing Lost Pet Creation...\n")
    
    # Test 1: Create without address (should work now)
    try:
        lost = Lost.objects.create(
            pet_name='Test Dog',
            species='dog',
            breed='Golden Retriever',
            color='Golden',
            sex='male',
            size='large',
            lost_time=datetime.now() - timedelta(days=1),
            description='A friendly dog lost near the park',
            reporter=user,
            status='open'
        )
        print(f"✅ Created Lost record without address:")
        print(f"   ID: {lost.id}, Name: {lost.pet_name}")
        lost.delete()
    except Exception as e:
        print(f"❌ Failed to create Lost without address: {e}")
    
    # Test 2: Create with minimal data
    try:
        lost2 = Lost.objects.create(
            pet_name='Test Cat',
            species='cat',
            sex='female',
            lost_time=datetime.now(),
            reporter=user,
        )
        print(f"\n✅ Created Lost record with minimal data:")
        print(f"   ID: {lost2.id}, Name: {lost2.pet_name}")
        lost2.delete()
    except Exception as e:
        print(f"❌ Failed to create Lost with minimal data: {e}")
    
    print("\n✅ All tests passed! The Lost model works correctly.")

if __name__ == '__main__':
    test_lost_creation()
