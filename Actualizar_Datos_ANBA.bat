@echo off
cd /d "%~dp0"
echo Sincronizando datos en vivo de la temporada 2026-27 y 2025-26 (anba2k.es + NBA API)...
C:\Users\luisr\anaconda3\python.exe scripts/generate_dataset.py
echo Proceso completado.
pause
