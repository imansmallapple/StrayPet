@echo off
cd /d "c:\Users\alf13\Documents\pyrepos\strayPet\frontend"
call npm run build:pro
cd /d "c:\Users\alf13\Documents\pyrepos\strayPet\backend"
docker-compose restart web
