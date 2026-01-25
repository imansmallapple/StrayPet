#!/usr/bin/env python
"""
Script to add coordinates to Warsaw addresses
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Address
from decimal import Decimal

# Warsaw addresses with approximate coordinates
WARSAW_COORDS = {
    "Marszałkowska, 42": {"lat": Decimal("52.2297"), "lng": Decimal("21.0122")},
    "Krakowskie Przedmieście, 13": {"lat": Decimal("52.2408"), "lng": Decimal("21.0167")},
    "Nowy Świat, 67": {"lat": Decimal("52.2355"), "lng": Decimal("21.0235")},
    "Piotrkowska, 89": {"lat": Decimal("52.2292"), "lng": Decimal("21.0112")},
    "Aleja Jerozolimskie, 25": {"lat": Decimal("52.2306"), "lng": Decimal("21.0138")},
    "Chmielna, 5": {"lat": Decimal("52.2281"), "lng": Decimal("21.0177")},
    "Copernicus Street, 34": {"lat": Decimal("52.2356"), "lng": Decimal("21.0149")},
    "Świętokrzyska, 18": {"lat": Decimal("52.2294"), "lng": Decimal("21.0218")},
    "Bracka, 54": {"lat": Decimal("52.2314"), "lng": Decimal("21.0227")},
    "Emilii Plater, 45": {"lat": Decimal("52.2273"), "lng": Decimal("21.0205")},
    "Koszykowa, 46": {"lat": Decimal("52.2189"), "lng": Decimal("21.0475")},
}

def main():
    print("🔍 Finding Warsaw addresses...")
    
    # Get all addresses in Warsaw
    addresses = Address.objects.filter(city__name__iexact='Warsaw')
    count = addresses.count()
    
    if count == 0:
        print("❌ No Warsaw addresses found")
        return
    
    print(f"✅ Found {count} Warsaw address(es)")
    
    for addr in addresses:
        key = f"{addr.street}, {addr.building_number}"
        
        if key in WARSAW_COORDS:
            coords = WARSAW_COORDS[key]
            addr.latitude = coords["lat"]
            addr.longitude = coords["lng"]
            addr.save()
            print(f"✅ {key}: {coords['lat']}, {coords['lng']}")
        else:
            print(f"⚠️  No coordinates found for: {key}")
    
    print("\n✨ Done!")

if __name__ == '__main__':
    main()
