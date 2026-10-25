@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"
echo Iniciando ANBA Stats Lab en http://localhost:3000 ...
start http://localhost:3000
npm run dev
pause
