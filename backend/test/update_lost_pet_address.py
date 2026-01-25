#!/usr/bin/env python
"""
Script to update lost pet addresses to Warsaw locations
"""
import os
import sys
import django
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Lost, Address, City, Region, Country

# Warsaw address examples
WARSAW_ADDRESSES = [
    {"street": "Marszałkowska", "building_number": "42", "postal_code": "00-025"},
    {"street": "Krakowskie Przedmieście", "building_number": "13", "postal_code": "00-071"},
    {"street": "Nowy Świat", "building_number": "67", "postal_code": "00-372"},
    {"street": "Piotrkowska", "building_number": "89", "postal_code": "00-957"},
    {"street": "Aleja Jerozolimskie", "building_number": "25", "postal_code": "00-508"},
    {"street": "Chmielna", "building_number": "5", "postal_code": "00-021"},
    {"street": "Copernicus Street", "building_number": "34", "postal_code": "00-927"},
    {"street": "Koszykowa", "building_number": "46", "postal_code": "02-953"},
    {"street": "Świętokrzyska", "building_number": "18", "postal_code": "00-116"},
    {"street": "Bracka", "building_number": "54", "postal_code": "00-028"},
]

def get_or_create_warsaw_address():
    """Get or create a random Warsaw address"""
    try:
        # Get Poland country
        country = Country.objects.get(code='PL')
        
        # Get Masovian region (Masovia - Warsaw's region)
        region = Region.objects.filter(country=country, name__icontains='Masovian').first()
        
        if not region:
            print(f"❌ Region not found for Poland")
            return None
        
        # Get Warsaw city
        city = City.objects.filter(region=region, name__iexact='Warsaw').first()
        
        if not city:
            print(f"❌ City (Warsaw) not found for region: {region}")
            return None
            
        # Get random address info
        addr_info = random.choice(WARSAW_ADDRESSES)
        
        # Try to get or create address
        address, created = Address.objects.get_or_create(
            country=country,
            region=region,
            city=city,
            street=addr_info["street"],
            building_number=addr_info["building_number"],
            postal_code=addr_info["postal_code"],
            defaults={
                'latitude': None,
                'longitude': None,
            }
        )
        
        return address
    except Exception as e:
        print(f"Error creating address: {e}")
        return None

def main():
    print("🔍 Finding lost pets...")
    from apps.pet.models import Lost
    
    lost_items = Lost.objects.all()
    count = lost_items.count()
    
    if count == 0:
        print("❌ No lost items found in database")
        return
    
    print(f"✅ Found {count} lost item(s)")
    
    for lost in lost_items:
        print(f"\n📍 Updating: {lost.id} - {lost.pet_name}")
        
        # Get or create a random Warsaw address
        address = get_or_create_warsaw_address()
        
        if address:
            lost.address = address
            lost.save()
            print(f"   ✅ Address updated to: {address}")
        else:
            print(f"   ❌ Failed to create/get address for {lost.pet_name}")
    
    print("\n✨ Done!")

if __name__ == '__main__':
    main()
