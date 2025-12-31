#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

# Create test image
img = Image.new('RGB', (100, 100), color='green')
img_io = io.BytesIO()
img.save(img_io, format='JPEG')
img_io.seek(0)

# Create test client
client = Client()

# Get user
user = User.objects.get(username='user1')
print(f"Testing avatar upload for user: {user.username}")

# Create JWT token
from rest_framework_simplejwt.tokens import RefreshToken
token = str(RefreshToken.for_user(user).access_token)

# Create uploaded file
avatar_file = SimpleUploadedFile(
    "test_avatar.jpg",
    img_io.getvalue(),
    content_type="image/jpeg"
)

# Test upload
print("\nTesting POST /user/avatars/upload/...")
response = client.post(
    '/user/avatars/upload/',
    {'avatar': avatar_file},
    HTTP_AUTHORIZATION=f'Bearer {token}'
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print("\nTest completed!")
