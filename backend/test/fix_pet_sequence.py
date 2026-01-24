#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.db import connection
from django.db.models import Max
from apps.pet.models import Pet

# Get the max ID from the database
max_id = Pet.objects.all().aggregate(Max('id'))['id__max']
print(f"Max Pet ID: {max_id}")

# Reset the sequence
with connection.cursor() as cursor:
    cursor.execute(f"SELECT setval(pg_get_serial_sequence('pet_pet', 'id'), {max_id + 1});")
    print(f"Pet sequence reset to {max_id + 1}")
