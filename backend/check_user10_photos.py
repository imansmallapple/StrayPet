#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.holiday_family.models import HolidayFamilyApplication, HolidayFamilyPhoto
from django.contrib.auth import get_user_model

User = get_user_model()

# 获取用户10的approved应用
user = User.objects.get(id=10)
app = HolidayFamilyApplication.objects.filter(user=user, status='approved').first()

if app:
    print(f"Application ID: {app.id}")
    print(f"User: {app.user}")
    print(f"Status: {app.status}")
    
    photos = HolidayFamilyPhoto.objects.filter(application=app)
    print(f"\nTotal photos: {photos.count()}")
    
    for photo in photos:
        print(f"  Photo ID: {photo.id}")
        print(f"  Photo path: {photo.photo}")
        print(f"  Photo URL: /media/{photo.photo}")
        print()
else:
    print("No approved application found for user 10")
