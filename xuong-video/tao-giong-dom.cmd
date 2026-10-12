@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Tao giong Dom - VieNeu-TTS
echo === Xuong video Quan tri tu te: tao giong Dom ===
where uv >nul 2>nul
if errorlevel 1 (
  echo Dang cai uv - trinh quan ly Python, chi lam 1 lan...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
  set "PATH=%USERPROFILE%\.local\bin;%PATH%"
)
uv run --python 3.12 --with vieneu --with soundfile python scripts\tao_giong.py %*
echo.
pause
