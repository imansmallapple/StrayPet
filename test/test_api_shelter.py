import requests
import json

BASE_URL = 'http://localhost:8000'

# Test API
print('Testing API...')
try:
    response = requests.get(f'{BASE_URL}/pet/16/')
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"shelter_name: '{data.get('shelter_name')}'")
    print(f"shelter_address: '{data.get('shelter_address')}'")
    print(f"shelter_phone: '{data.get('shelter_phone')}'")
    print(f"shelter_website: '{data.get('shelter_website')}'")
    
    if not data.get('shelter_name'):
        print("\nWARNING: Shelter fields are empty!")
        print(f"Pet details: id={data.get('id')}, name={data.get('name')}")
except Exception as e:
    print(f"Error: {e}")
