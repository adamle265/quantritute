@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v04
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v04 (Vbee, 2 doan ngan, khoang 100 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v04-chon-dung-cong-cu kich-ban-v1.json
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
