import sqlite3

conn = sqlite3.connect(r'c:\Users\alf13\Documents\pyrepos\strayPet\backend\db.sqlite3')
cursor = conn.cursor()

# Check Pet 16
cursor.execute('SELECT id, name, shelter_id FROM pet_pet WHERE id=16')
pet_row = cursor.fetchone()

if pet_row:
    pet_id, name, shelter_id = pet_row
    print(f"Pet 16: id={pet_id}, name={name}, shelter_id={shelter_id}")
    
    if shelter_id:
        # Check Shelter
        cursor.execute('SELECT id, name, phone, website FROM pet_shelter WHERE id=?', (shelter_id,))
        shelter_row = cursor.fetchone()
        if shelter_row:
            s_id, s_name, s_phone, s_website = shelter_row
            print(f"Shelter {shelter_id}: name={s_name}, phone={s_phone}, website={s_website}")
        else:
            print(f"Shelter {shelter_id} not found!")
else:
    print("Pet 16 not found!")

conn.close()
