@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v03 ban 5
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v03 ban 5 (Vbee, 3 doan moi, khoang 620 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v03-cam-nang-thue kich-ban-v5-moi.json
echo.
echo Neu thay HOAN TAT thi anh nhan em.
pause
