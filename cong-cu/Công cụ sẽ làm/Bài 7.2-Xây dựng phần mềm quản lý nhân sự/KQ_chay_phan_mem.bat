@echo off
chcp 65001 >nul
setlocal EnableExtensions
title He thong nhan su Tan Phat
cd /d "%~dp0"

echo ==================================================
echo    HỆ THỐNG NHÂN SỰ TÂN PHÁT
echo ==================================================
echo Đang tìm Python trên máy...

set "PYCMD="

rem --- Cách 1: lệnh py của Windows ---
py -3 -c "import sys; sys.exit(0 if sys.version_info>=(3,8) else 1)" >nul 2>&1
if not errorlevel 1 set "PYCMD=py -3"
if defined PYCMD goto CO_PYTHON

rem --- Cách 2: lệnh python ---
python -c "import sys; sys.exit(0 if sys.version_info>=(3,8) else 1)" >nul 2>&1
if not errorlevel 1 set "PYCMD=python"
if defined PYCMD goto CO_PYTHON

rem --- Cách 3: các thư mục cài đặt thường gặp ---
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*" "%ProgramFiles%\Python3*") do if exist "%%~fD\python.exe" set "PYCMD="%%~fD\python.exe""
if not defined PYCMD goto KHONG_CO_PYTHON
%PYCMD% -c "import sys; sys.exit(0 if sys.version_info>=(3,8) else 1)" >nul 2>&1
if errorlevel 1 goto KHONG_CO_PYTHON

:CO_PYTHON
echo Dùng Python: %PYCMD%
echo Đang mở phần mềm. Lần đầu có thể mất 1-2 phút để tự cài thư viện...
echo.
%PYCMD% "%~dp0he_thong_nhan_su.py"
if errorlevel 1 goto CO_LOI
goto HET

:CO_LOI
echo.
echo Phần mềm đã dừng vì có lỗi. Xem thông báo phía trên.
echo Nếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ. File nằm ở:
echo "%~dp0nhat-ky.txt"
echo.
pause
goto HET

:KHONG_CO_PYTHON
powershell -NoProfile -Command "Add-Content -Encoding UTF8 -Path (Join-Path '%~dp0' 'nhat-ky.txt') -Value ('[' + (Get-Date -Format 'dd/MM/yyyy HH:mm:ss') + '] chay_phan_mem.bat: khong tim thay Python 3.8 tro len (da thu: py -3, python, thu muc LocalAppData va Program Files)')" >nul 2>&1
echo.
echo --------------------------------------------------
echo  CHƯA TÌM THẤY PYTHON TRÊN MÁY
echo --------------------------------------------------
echo  Phần mềm cần Python để chạy. Cách cài:
echo   1. Trang tải Python sẽ tự mở ngay sau đây.
echo   2. Bấm nút "Download Python" màu vàng, chạy file vừa tải.
echo   3. Ở cửa sổ đầu tiên, TÍCH VÀO ô "Add python.exe to PATH".
echo   4. Bấm "Install Now", chờ cài xong.
echo   5. Bấm đúp lại file chay_phan_mem.bat này.
echo.
echo  Nếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ. File nằm ở:
echo  "%~dp0nhat-ky.txt"
echo.
start "" "https://www.python.org/downloads/windows/"
pause

:HET
endlocal
