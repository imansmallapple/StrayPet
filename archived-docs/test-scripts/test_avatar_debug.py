#!/usr/bin/env python
import os
import sys
import django
from io import BytesIO
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.user.serializer import UserMeSerializer

# Get or create test user
user = User.objects.filter(username='testuser999').first()
if not user:
    user = User.objects.create_user(
        username='testuser999',
        email='test999@example.com',
        password='testpass123'
    )
    print(f"Created user: {user.username}")
else:
    print(f"Using existing user: {user.username}")

# Create a test image
img = Image.new('RGB', (100, 100), color='red')
img_bytes = BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# Simulate upload
uploaded_file = SimpleUploadedFile(
    'test_avatar_1.png',
    img_bytes.getvalue(),
    content_type='image/png'
)

print(f"\n--- Before Upload ---")
print(f"Avatar field: {user.profile.avatar}")

# Save avatar
user.profile.avatar = uploaded_file
user.profile.save()

print(f"\n--- After Upload ---")
print(f"Avatar field: {user.profile.avatar}")
print(f"Avatar URL: {user.profile.avatar.url if user.profile.avatar else 'None'}")

# Serialize and check
serializer = UserMeSerializer(user)
data = serializer.data
print(f"\n--- Serialized Data ---")
print(f"Avatar from serializer: {data.get('avatar')}")

# Upload second avatar to test name handling
print(f"\n--- Second Upload ---")
img2 = Image.new('RGB', (100, 100), color='blue')
img_bytes2 = BytesIO()
img2.save(img_bytes2, format='PNG')
img_bytes2.seek(0)

uploaded_file2 = SimpleUploadedFile(
    'test_avatar_2.png',
    img_bytes2.getvalue(),
    content_type='image/png'
)

user.profile.avatar = uploaded_file2
user.profile.save()

print(f"Avatar field after 2nd upload: {user.profile.avatar}")
print(f"Avatar URL after 2nd upload: {user.profile.avatar.url if user.profile.avatar else 'None'}")

serializer2 = UserMeSerializer(user)
data2 = serializer2.data
print(f"Avatar from serializer after 2nd upload: {data2.get('avatar')}")
