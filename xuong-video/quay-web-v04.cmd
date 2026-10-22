@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Quay web v04
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
set PYTHONIOENCODING=utf-8
echo === Quay canh web v04 (chay web thu tren may, quay bang Chrome) ===
echo Dung dong cua so nay, may mat khoang 2-4 phut.
uv run --python 3.12 --with playwright --with imageio-ffmpeg python scripts\quay_web_v04.py
echo.
echo Neu thay HOAN TAT thi anh nhan em. Neu bao loi, anh chup man hinh gui em.
pause
