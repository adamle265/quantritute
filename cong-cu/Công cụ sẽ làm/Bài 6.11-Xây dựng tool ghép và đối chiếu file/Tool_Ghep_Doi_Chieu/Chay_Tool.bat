@echo off
chcp 65001 >nul
title Tool Ghep va Doi Chieu Excel
cd /d "%~dp0"

echo ============================================================
echo   TOOL GHEP ^& DOI CHIEU 2 FILE EXCEL
echo ============================================================
echo.

set PYCMD=

where py >nul 2>nul
if %errorlevel%==0 (
    set PYCMD=py
    goto :found_python
)

where python >nul 2>nul
if %errorlevel%==0 (
    set PYCMD=python
    goto :found_python
)

echo [!] Khong tim thay Python trong may tinh nay.
echo.
echo     Vui long cai dat Python truoc khi chay tool:
echo     1. Mo trinh duyet, vao trang: https://www.python.org/downloads/
echo     2. Tai ban Python moi nhat (Windows installer) va cai dat.
echo     3. QUAN TRONG: khi cai dat, nho tich chon o
echo        "Add Python to PATH" o man hinh dau tien.
echo     4. Cai xong, mo lai file Chay_Tool.bat nay.
echo.
echo     (Xem chi tiet co hinh anh trong file HUONG_DAN.md)
echo.
pause
exit /b 1

:found_python
echo [OK] Da tim thay Python. Dang kiem tra cac thu vien can thiet...
echo      (Lan dau chay se mat vai phut de cai dat, cac lan sau se nhanh hon)
echo.

%PYCMD% -m pip install --disable-pip-version-check -q -r requirements.txt
if not %errorlevel%==0 (
    echo.
    echo [!] Cai dat thu vien bi loi. Dang thu lai voi quyen nguoi dung...
    %PYCMD% -m pip install --disable-pip-version-check -q --user -r requirements.txt
)
if not %errorlevel%==0 (
    echo.
    echo [!] Van khong cai dat duoc thu vien can thiet.
    echo     Vui long kiem tra ket noi Internet roi thu lai.
    echo     Neu van loi, hay xem huong dan xu ly trong file HUONG_DAN.md.
    echo.
    pause
    exit /b 1
)

echo [OK] Da san sang. Dang khoi dong tool...
echo.

%PYCMD% app.py

echo.
echo ============================================================
echo   Tool da dung. Ban co the dong cua so nay lai.
echo ============================================================
pause
