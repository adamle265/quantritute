@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc kich ban v3 - Vbee PhuocPro
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\cn01-cam-nang-thue kich-ban-v3.json
echo.
pause
