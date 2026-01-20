from apps.pet.models import Shelter

# Polish shelter data
shelters = [
    {"name": "Warsaw Animal Care Center", "description": "Dedicated to rescuing and protecting stray animals in Warsaw", "email": "info@warsaw-animal-rescue.pl", "phone": "+48 22-1234-5678", "website": "https://warsaw-animal-rescue.pl", "capacity": 150, "current_animals": 85, "founded_year": 2010, "is_active": True, "is_verified": True, "facebook_url": "https://facebook.com/warsawrescue", "instagram_url": "https://instagram.com/warsawrescue"},
    {"name": "Krakow Pet Haven", "description": "Krakow's largest animal rescue and adoption platform", "email": "contact@krakow-pet-haven.com", "phone": "+48 12-8888-8888", "website": "https://krakow-pet-haven.com", "capacity": 200, "current_animals": 120, "founded_year": 2012, "is_active": True, "is_verified": True, "facebook_url": "https://facebook.com/krakowPetHaven", "instagram_url": "https://instagram.com/krakowPetHaven"},
    {"name": "Gdansk Animal Rescue Station", "description": "Providing medical rescue and temporary shelter for stray animals in Gdansk", "email": "help@gdansk-pet-rescue.pl", "phone": "+48 58-3333-3333", "website": "https://gdansk-pet-rescue.pl", "capacity": 120, "current_animals": 65, "founded_year": 2015, "is_active": True, "is_verified": False, "facebook_url": "", "instagram_url": "https://instagram.com/gdanskPetRescue"},
    {"name": "Wroclaw Warm Hearts Shelter", "description": "Wroclaw's most professional animal rescue facility", "email": "admin@wroclaw-warmhearts.org", "phone": "+48 71-9999-8888", "website": "https://wroclaw-warmhearts.org", "capacity": 180, "current_animals": 95, "founded_year": 2013, "is_active": True, "is_verified": True, "facebook_url": "https://facebook.com/wroclawwarmhearts", "instagram_url": "https://instagram.com/wroclawwarmhearts", "twitter_url": "https://twitter.com/wroclawwarmhearts"},
    {"name": "Poznan Animal Care Association", "description": "Professional animal protection and rescue organization in Poznan", "email": "contact@poznan-animal-care.org", "phone": "+48 61-6666-6666", "website": "https://poznan-animal-care.org", "capacity": 100, "current_animals": 45, "founded_year": 2014, "is_active": True, "is_verified": True, "facebook_url": "", "instagram_url": "https://instagram.com/poznanAnimalCare"},
    {"name": "Lodz Friendly Pets Rescue Center", "description": "Leading animal rescue center in Lodz", "email": "info@lodz-pet-care.com", "phone": "+48 42-5555-5555", "website": "https://lodz-pet-care.com", "capacity": 150, "current_animals": 78, "founded_year": 2011, "is_active": True, "is_verified": True, "facebook_url": "https://facebook.com/lodzPetCare", "instagram_url": "https://instagram.com/lodzPetCare"},
]

for data in shelters:
    Shelter.objects.create(**data)
    print(f"Created: {data['name']}")
print(f"Total created: {len(shelters)} Polish shelters")
