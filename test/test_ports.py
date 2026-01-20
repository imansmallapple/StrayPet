#!/usr/bin/env python
import requests
import time

time.sleep(2)

for port in [8000, 9000]:
    print(f"Testing port {port}...")
    try:
        response = requests.get(f'http://127.0.0.1:{port}/pet/', timeout=3)
        print(f"  Status: {response.status_code}")
        data = response.json()
        print(f"  Results: {len(data.get('results', []))} pets")
        break
    except requests.exceptions.Timeout:
        print(f"  Timeout")
    except requests.exceptions.ConnectionError as e:
        print(f"  Connection error: {e}")
    except Exception as e:
        print(f"  Error: {type(e).__name__}: {str(e)[:100]}")
