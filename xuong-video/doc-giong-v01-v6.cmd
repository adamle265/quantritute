@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v6
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - loi moi (Vbee, khoang 470 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v01-tro-lai-cung-dom kich-ban-v6.json
echo.
echo Neu thay HOAN TAT thi anh nhan em.
pause
