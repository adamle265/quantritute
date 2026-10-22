@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Chuan bi video v01 - Tro lai cung Dom
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === BUOC 1/2: Phien am video anh quay ===
uv run --python 3.12 --with "faster-whisper>=1.1" python scripts\phien_am.py "..\..\Video xây kênh\Source gốc" tap\v01-tro-lai-cung-dom\phien-am
echo.
echo === BUOC 2/2: Doc giong Dom (Vbee PhuocPro) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v01-tro-lai-cung-dom kich-ban-v3.json
echo.
echo Xong ca 2 buoc. Anh nhan em "Hoan tat" nhe.
pause
