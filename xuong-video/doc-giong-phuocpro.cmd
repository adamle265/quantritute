@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Doc kich ban - giong PhuocPro (Vbee)
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
uv run --python 3.12 python scripts\thu_giong_v2.py day-du vbee:n_laocai_male_phuocpro_children_vc
echo.
pause
