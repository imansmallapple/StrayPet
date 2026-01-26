#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.holiday_family.models import HolidayFamilyApplication
from apps.holiday_family.serializers import HolidayFamilyApplicationSerializer

try:
    app = HolidayFamilyApplication.objects.get(user_id=10, status='approved')
    serializer = HolidayFamilyApplicationSerializer(app)
    data = serializer.data
    
    print("=== SERIALIZER TEST ===")
    print(f"Has family_photos: {'family_photos' in data}")
    if 'family_photos' in data:
        photos = data['family_photos']
        print(f"Photos count: {len(photos)}")
        if photos:
            print(f"First photo: {photos[0]}")
except Exception as e:
    print(f"Error: {e}")
