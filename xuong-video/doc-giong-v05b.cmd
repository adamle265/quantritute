@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v05 ban 2
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v05 ban 2 (Vbee, 20 doan ngan, khoang 1900 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v05-gioi-thieu-hoa-don-thue kich-ban-v2-moi.json
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
