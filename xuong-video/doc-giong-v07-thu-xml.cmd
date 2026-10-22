@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc giong Dom v07
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Doc giong Dom - v07 Chuyen doi hang loat XML sang Excel THU 6 CACH DOC XML (Vbee, khoang 300 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v07-zip-ra-bang-ke thu-xml.json
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
