@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Thu giong vong 2 - Vbee + Gemini
if not exist ".env" (
  echo Chua co file .env - em mo file mau, anh dien khoa roi luu lai, sau do chay lai nhe.
  copy ".env.mau" ".env" >nul
  notepad ".env"
  pause
  exit /b
)
where uv >nul 2>nul
if errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
  set "PATH=%USERPROFILE%\.local\bin;%PATH%"
)
uv run --python 3.12 python scripts\thu_giong_v2.py %*
echo.
pause
