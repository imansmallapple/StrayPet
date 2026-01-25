#!/usr/bin/env python
"""
修改同城市lost pet的地址坐标，使它们不重叠
为了测试地图上的分城市分组功能
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from apps.pet.models import Lost, Address, City
from django.db.models import Count
from decimal import Decimal
import random

# Wroclaw and nearby cities/areas with slight coordinate variations
WROCLAW_AREAS = [
    # Central Wroclaw
    {"lat": Decimal("51.1079"), "lng": Decimal("17.0385"), "street": "Stary Rynek"},
    # North Wroclaw
    {"lat": Decimal("51.1500"), "lng": Decimal("17.0450"), "street": "Al. Niepodległości"},
    # South Wroclaw
    {"lat": Decimal("51.0800"), "lng": Decimal("17.0250"), "street": "ul. Karłowicza"},
    # East Wroclaw
    {"lat": Decimal("51.1100"), "lng": Decimal("17.1000"), "street": "ul. Twardowskiego"},
    # West Wroclaw
    {"lat": Decimal("51.1100"), "lng": Decimal("16.9700"), "street": "ul. Generała Dąbrowskiego"},
    # Southeast
    {"lat": Decimal("51.0900"), "lng": Decimal("17.0700"), "street": "Plac Grunwaldzki"},
    # Northwest
    {"lat": Decimal("51.1300"), "lng": Decimal("16.9800"), "street": "ul. Bolesława Śmiałego"},
    # Southwest
    {"lat": Decimal("51.0950"), "lng": Decimal("16.9600"), "street": "ul. Jana Długosza"},
]

GDANSK_AREAS = [
    # Central Gdansk
    {"lat": Decimal("54.3520"), "lng": Decimal("18.6466"), "street": "Długi Targ"},
    # North Gdansk
    {"lat": Decimal("54.4000"), "lng": Decimal("18.6500"), "street": "ul. Kartuska"},
    # South Gdansk
    {"lat": Decimal("54.3200"), "lng": Decimal("18.6400"), "street": "ul. Piastowska"},
    # East Gdansk
    {"lat": Decimal("54.3500"), "lng": Decimal("18.7000"), "street": "ul. Energetyków"},
    # West Gdansk
    {"lat": Decimal("54.3500"), "lng": Decimal("18.5900"), "street": "ul. Derdowskiego"},
]

WARSAW_AREAS = [
    # Central Warsaw
    {"lat": Decimal("52.2297"), "lng": Decimal("21.0122"), "street": "Plac Zamkowy"},
    # North Warsaw
    {"lat": Decimal("52.2500"), "lng": Decimal("21.0200"), "street": "ul. Puławska"},
    # South Warsaw
    {"lat": Decimal("52.2000"), "lng": Decimal("21.0100"), "street": "Al. Ujazdowskie"},
    # East Warsaw
    {"lat": Decimal("52.2300"), "lng": Decimal("21.0800"), "street": "ul. Wiatraczna"},
    # West Warsaw
    {"lat": Decimal("52.2300"), "lng": Decimal("20.9700"), "street": "ul. Słodowca"},
]

CITY_AREAS = {
    "Wrocław": WROCLAW_AREAS,
    "Gdańsk": GDANSK_AREAS,
    "Warszawa": WARSAW_AREAS,
}

def diversify_lost_pet_coordinates():
    """Group lost pets by city and assign different coordinates"""
    
    print("🗺️ Diversifying lost pet coordinates by city...\n")
    
    # Get all lost pets grouped by city
    lost_pets = Lost.objects.all().select_related('address', 'address__city')
    
    if not lost_pets.exists():
        print("❌ No lost pets found!")
        return
    
    # Group by city
    by_city = {}
    for lost in lost_pets:
        city = lost.address.city.name if lost.address and lost.address.city else "Unknown"
        if city not in by_city:
            by_city[city] = []
        by_city[city].append(lost)
    
    total_updated = 0
    
    for city_name, lost_list in by_city.items():
        print(f"📍 Processing city: {city_name} ({len(lost_list)} pets)")
        
        # Get the areas for this city (or use random variations)
        areas = CITY_AREAS.get(city_name, None)
        
        if not areas and len(lost_list) > 1:
            # If no predefined areas, create variations from first pet's coordinates
            first_lost = lost_list[0]
            if first_lost.address and first_lost.address.latitude and first_lost.address.longitude:
                base_lat = float(first_lost.address.latitude)
                base_lng = float(first_lost.address.longitude)
                areas = []
                for i in range(len(lost_list)):
                    # Add small random variations (±0.01 degrees ≈ 1km)
                    lat = Decimal(str(base_lat + random.uniform(-0.01, 0.01)))
                    lng = Decimal(str(base_lng + random.uniform(-0.01, 0.01)))
                    areas.append({"lat": lat, "lng": lng, "street": f"Location {i+1}"})
            else:
                print(f"   ⚠️ First pet has no coordinates, skipping")
                continue
        
        if not areas:
            print(f"   ⚠️ No predefined areas for {city_name}, skipping")
            continue
        
        # Assign different coordinates to each pet in this city
        for idx, lost in enumerate(lost_list):
            area_idx = idx % len(areas)
            area = areas[area_idx]
            
            if not lost.address:
                print(f"   ⚠️ {lost.pet_name} has no address, creating one")
                # Create address if needed
                lost.address = Address.objects.create(
                    city_id=lost_list[0].address.city_id if lost_list[0].address else None,
                    latitude=area["lat"],
                    longitude=area["lng"],
                    street=area["street"]
                )
            else:
                # Update existing address
                lost.address.latitude = area["lat"]
                lost.address.longitude = area["lng"]
                lost.address.street = area["street"]
                lost.address.save()
            
            lost.save()
            total_updated += 1
            
            print(f"   ✅ {lost.pet_name}: [{area['lat']}, {area['lng']}] {area['street']}")
    
    print(f"\n✨ Updated {total_updated} lost pets total")
    print("✅ Done!")

if __name__ == "__main__":
    diversify_lost_pet_coordinates()
