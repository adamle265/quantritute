@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v02
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v02 Tao van ban hang loat (Vbee, khoang 1300 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v02-tao-van-ban-hang-loat kich-ban-v1.json
echo.
echo Neu thay HOAN TAT thi anh nhan em.
pause
