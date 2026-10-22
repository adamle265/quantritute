@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Ban chinh thuc v01
where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
echo === BUOC 1/2: Phien am video moi cua anh ===
uv run --python 3.12 --with "faster-whisper>=1.1" --with numpy python scripts\phien_am.py
echo.
echo === BUOC 2/2: Doc lai cau ket cua Dom - 2 phuong an (Vbee, khoang 125 diem) ===
uv run --python 3.12 python scripts\tao_giong_vbee.py tap\v01-tro-lai-cung-dom kich-ban-v5-doc-lai.json
echo.
echo Xong. Neu thay HOAN TAT o ca 2 buoc thi anh nhan em.
pause
