#!/usr/bin/env python
import sqlite3
import sys

try:
    conn = sqlite3.connect(r'c:\Users\alf13\Documents\pyrepos\strayPet\backend\db.sqlite3')
    cursor = conn.cursor()
    
    # Check applied migrations
    cursor.execute("SELECT app, name FROM django_migrations ORDER BY app, applied DESC LIMIT 20")
    migrations = cursor.fetchall()
    
    print("Recent migrations:")
    for app, name in migrations:
        print(f"  {app}: {name}")
    
    # Check pet count
    cursor.execute("SELECT COUNT(*) FROM pet_pet")
    count = cursor.fetchone()[0]
    print(f"\nTotal pets in DB: {count}")
    
    # Check AVAILABLE/PENDING pets
    cursor.execute("SELECT COUNT(*) FROM pet_pet WHERE status IN ('available', 'pending')")
    count_avail = cursor.fetchone()[0]
    print(f"AVAILABLE/PENDING pets: {count_avail}")
    
    # List some pets
    cursor.execute("SELECT id, name, status FROM pet_pet LIMIT 10")
    pets = cursor.fetchall()
    print("\nFirst 10 pets:")
    for pet_id, name, status in pets:
        print(f"  {pet_id}: {name} ({status})")
    
    conn.close()
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
