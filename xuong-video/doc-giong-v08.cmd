@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v08
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v08 Tao to khai 01/GTGT tu dong (Vbee, 17 doan, khoang 2500 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v08-to-khai-01gtgt kich-ban-v1.json
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
