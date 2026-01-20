#!/usr/bin/env python
"""Simple API test for friendship list endpoint"""

import requests
import json

# Test the API endpoint directly
BASE_URL = "http://localhost:8000"

# You need to replace these with actual test user tokens
HEADERS = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE",  # Replace with actual token
    "Content-Type": "application/json"
}

def test_friendship_list():
    """Test the list_friends endpoint"""
    url = f"{BASE_URL}/user/friendships/list_friends/"
    
    print(f"Testing: {url}")
    print(f"Headers: {HEADERS}")
    
    response = requests.get(url, headers=HEADERS)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    # Check if friendship_id is in response
    data = response.json()
    if isinstance(data, dict) and 'results' in data:
        results = data['results']
        if results and isinstance(results, list):
            first_friend = results[0]
            if 'friendship_id' in first_friend:
                print("\n✅ SUCCESS: friendship_id is present in response!")
                return True
            else:
                print("\n❌ ERROR: friendship_id is missing from response!")
                print(f"Friend object keys: {list(first_friend.keys())}")
                return False
    else:
        print("\n⚠️  Could not parse response structure")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Friendship List API Test")
    print("=" * 60)
    print("\nNOTE: Replace YOUR_ACCESS_TOKEN_HERE with an actual token first!")
    test_friendship_list()
