@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Phien am video v01
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Phien am video anh quay ===
uv run --python 3.12 --with "faster-whisper>=1.1" --with numpy python scripts\phien_am.py
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
