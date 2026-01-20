#!/usr/bin/env python
"""
Verify that address data is being saved correctly for Lost pets
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost, Address

# Get the latest Lost record
latest = Lost.objects.all().order_by('-created_at').first()

if not latest:
    print("❌ No Lost records found in database")
    exit(1)

print(f"Latest Lost record: {latest.pet_name} (ID: {latest.id})")
print(f"Address ID: {latest.address_id}")

if not latest.address:
    print("❌ No address linked to this Lost record")
    exit(1)

addr = latest.address
print(f"\n✅ Address Details:")
print(f"  ID: {addr.id}")
print(f"  Street: {addr.street}")
print(f"  Building: {addr.building_number}")
print(f"  Postal Code: {addr.postal_code}")
print(f"  Country: {addr.country.name if addr.country else 'N/A'}")
print(f"  Region: {addr.region.name if addr.region else 'N/A'}")
print(f"  City: {addr.city.name if addr.city else 'N/A'}")

print("\n✅ Full Address: {}, {}, {}, {}, {}".format(
    addr.street,
    addr.postal_code,
    addr.city.name if addr.city else '',
    addr.region.name if addr.region else '',
    addr.country.name if addr.country else ''
))
