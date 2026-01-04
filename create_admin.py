#!/usr/bin/env python3
import os
import sys
import django

sys.path.insert(0, 'c:\\Users\\alf13\\Documents\\pyrepos\\strayPet\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User

# Set password for admin user
admin = User.objects.get(username='admin')
admin.set_password('admin123456')
admin.save()

print("=" * 60)
print("✓ Django Admin Account Created")
print("=" * 60)
print(f"\n🔐 Admin Credentials:")
print(f"   Username: admin")
print(f"   Password: admin123456")
print(f"\n🌐 Access at: http://localhost:8000/admin/")
print("\n" + "=" * 60)
