@echo off

REM Create subdirectories
mkdir css
mkdir js
mkdir vendor
mkdir vendor\jquery
mkdir vendor\leaflet

REM Create main files
echo. > index.html
echo. > css\style.css
echo. > js\app.js
echo. > js\sensors.js
echo. > js\storage.js
echo. > manifest.json
echo. > service-worker.js

echo Project structure created in the current folder successfully!
pause