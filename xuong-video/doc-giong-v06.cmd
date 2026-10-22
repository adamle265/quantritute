@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v06
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v06 Tai hang loat hoa don bang 1 nut (Vbee, 16 doan, khoang 1700 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v06-tai-ca-quy-hoa-don kich-ban-v1.json
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
