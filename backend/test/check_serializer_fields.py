#!/usr/bin/env python
"""直接检查和修复 address_data 的序列化问题"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from rest_framework import serializers
from apps.pet.models import Lost
import json

# 检查 LostSerializer 的字段
print("Checking LostSerializer fields...")
print()

# 显示所有字段
from apps.pet.serializers import LostSerializer
serializer_instance = LostSerializer()

print("Serializer fields:")
for field_name, field in serializer_instance.fields.items():
    read_only = getattr(field, 'read_only', False)
    write_only = getattr(field, 'write_only', False)
    required = getattr(field, 'required', None)
    print(f"  {field_name}: {field.__class__.__name__} (read_only={read_only}, write_only={write_only}, required={required})")

print("\n" + "="*100)
print("\nChecking if 'address_data' field is properly configured...")

address_data_field = serializer_instance.fields.get('address_data')
if address_data_field:
    print(f"✓ 'address_data' field found")
    print(f"  Type: {address_data_field.__class__.__name__}")
    print(f"  write_only: {address_data_field.write_only}")
    print(f"  required: {address_data_field.required}")
else:
    print(f"✗ 'address_data' field NOT found in serializer fields!")
    print(f"\nAvailable fields: {list(serializer_instance.fields.keys())}")
