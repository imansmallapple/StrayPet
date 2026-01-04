#!/usr/bin/env python3
import requests

print("=" * 60)
print("TESTING BACKEND API")
print("=" * 60)

# Test 1: Get pets with AVAILABLE status
print("\n1. Testing /pet/ endpoint with AVAILABLE status...")
try:
    r = requests.get('http://localhost:8000/pet/?status=AVAILABLE&page=1&page_size=24')
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Count: {data.get('count')}")
        print(f"   Results: {len(data.get('results', []))} items")
        if data.get('results'):
            first = data['results'][0]
            print(f"   First pet: {first.get('name')} ({first.get('species')})")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

# Test 2: Get all pets
print("\n2. Testing /pet/ endpoint without filters...")
try:
    r = requests.get('http://localhost:8000/pet/?page=1&page_size=24')
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Total count: {data.get('count')}")
        print(f"   Results: {len(data.get('results', []))} items")
        if data.get('results'):
            statuses = {}
            for pet in data['results']:
                status = pet.get('status', 'unknown')
                statuses[status] = statuses.get(status, 0) + 1
            print(f"   Status breakdown: {statuses}")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

# Test 3: Get lost pets
print("\n3. Testing /pet/lost/ endpoint...")
try:
    r = requests.get('http://localhost:8000/pet/lost/?page=1&page_size=12&status=open')
    print(f"   Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Count: {data.get('count')}")
        print(f"   Results: {len(data.get('results', []))} items")
        if data.get('results'):
            first = data['results'][0]
            print(f"   First lost pet: {first.get('pet_name')} ({first.get('species')})")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

print("\n" + "=" * 60)
