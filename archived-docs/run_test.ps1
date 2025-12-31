cd c:\Users\alf13\Documents\pyrepos\strayPet\backend
$content = Get-Content test_friend_request.py -Raw
python manage.py shell -c "$content"
