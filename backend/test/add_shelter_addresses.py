import sys
sys.path.insert(0, '.')
import django
django.setup()

from apps.pet.models import Shelter, Address, Country, Region, City

# Ensure Poland country exists
poland, _ = Country.objects.get_or_create(
    code="PL",
    defaults={"name": "Poland"}
)

# Polish regions/voivodeships with their cities and shelter info
regions_cities = {
    "Masovian": {  # Warsaw region
        "cities": {
            "Warsaw": {
                "shelters": [
                    {
                        "name": "Warsaw Animal Care Center",
                        "street": "Ul. Zwirki i Wigury",
                        "building_number": "49",
                        "postal_code": "02-092",
                        "latitude": "52.1849",
                        "longitude": "21.0465"
                    }
                ]
            }
        }
    },
    "Lesser Poland": {  # Krakow region
        "cities": {
            "Krakow": {
                "shelters": [
                    {
                        "name": "Krakow Pet Haven",
                        "street": "Ul. Mogilska",
                        "building_number": "123",
                        "postal_code": "31-545",
                        "latitude": "50.0647",
                        "longitude": "19.9450"
                    }
                ]
            }
        }
    },
    "Pomeranian": {  # Gdansk region
        "cities": {
            "Gdansk": {
                "shelters": [
                    {
                        "name": "Gdansk Animal Rescue Station",
                        "street": "Ul. Targowa",
                        "building_number": "45",
                        "postal_code": "80-001",
                        "latitude": "54.3733",
                        "longitude": "18.6481"
                    }
                ]
            }
        }
    },
    "Lower Silesian": {  # Wroclaw region
        "cities": {
            "Wroclaw": {
                "shelters": [
                    {
                        "name": "Wroclaw Warm Hearts Shelter",
                        "street": "Ul. Gajowa",
                        "building_number": "32",
                        "postal_code": "50-519",
                        "latitude": "51.1079",
                        "longitude": "17.0385"
                    }
                ]
            }
        }
    },
    "Greater Poland": {  # Poznan region
        "cities": {
            "Poznan": {
                "shelters": [
                    {
                        "name": "Poznan Animal Care Association",
                        "street": "Ul. Umultowska",
                        "building_number": "87",
                        "postal_code": "61-614",
                        "latitude": "52.0045",
                        "longitude": "16.8494"
                    }
                ]
            }
        }
    },
    "Lodz": {  # Lodz region
        "cities": {
            "Lodz": {
                "shelters": [
                    {
                        "name": "Lodz Friendly Pets Rescue Center",
                        "street": "Ul. Zachodnia",
                        "building_number": "78",
                        "postal_code": "90-549",
                        "latitude": "51.7592",
                        "longitude": "19.4559"
                    }
                ]
            }
        }
    }
}

updated_count = 0

for region_name, region_data in regions_cities.items():
    # Create or get region
    region, _ = Region.objects.get_or_create(
        country=poland,
        name=region_name
    )
    
    for city_name, city_data in region_data["cities"].items():
        # Create or get city
        city, _ = City.objects.get_or_create(
            region=region,
            name=city_name
        )
        
        # Create or update shelters with addresses
        for shelter_info in city_data["shelters"]:
            try:
                shelter = Shelter.objects.get(name=shelter_info["name"])
                
                # Create address if not already set
                if not shelter.address:
                    address = Address.objects.create(
                        country=poland,
                        region=region,
                        city=city,
                        street=shelter_info["street"],
                        building_number=shelter_info["building_number"],
                        postal_code=shelter_info["postal_code"],
                        latitude=shelter_info["latitude"],
                        longitude=shelter_info["longitude"]
                    )
                    shelter.address = address
                    shelter.save()
                    print(f"✓ Added address for: {shelter.name}")
                    updated_count += 1
                else:
                    print(f"✓ Already has address: {shelter.name}")
                    
            except Shelter.DoesNotExist:
                print(f"✗ Shelter not found: {shelter_info['name']}")

print(f"\nSummary: Updated {updated_count} shelters with addresses")
