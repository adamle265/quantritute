@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  XUAT BAN PHIEN BAN CONG KHAI - Phan mem quan ly nhan su
rem  1) Tao lai cac ban trong nguon\phien-ban.json vao site\public\quan-ly-nhan-su\<so ban viet lien>\
rem  2) Dua web len Cloudflare (npm run deploy:site)
rem  Xem: https://quantritute.com/quan-ly-nhan-su  (lich su)  -  /quan-ly-nhan-su/011, /012 ...
rem ============================================================
cd /d "%~dp0nguon"
node xuat-ban.js
if errorlevel 1 ( echo [Loi] Xuat ban that bai. & pause & exit /b 1 )
cd /d "%~dp0..\.."
call npm run deploy:site
if errorlevel 1 ( echo [Loi] Dua web len that bai. & pause & exit /b 1 )
echo.
echo Xong. Mo https://quantritute.com/quan-ly-nhan-su  (nhan Ctrl+F5)
pause
