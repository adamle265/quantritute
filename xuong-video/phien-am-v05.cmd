@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Phien am video v05
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === Phien am video v05 - doan anh noi ===
uv run --python 3.12 --with "faster-whisper>=1.1" --with numpy python scripts\phien_am.py "%~dp0tap\v05-gioi-thieu-hoa-don-thue\phien-am\am-thanh" "%~dp0tap\v05-gioi-thieu-hoa-don-thue\phien-am"
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
