@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  XUAT BAN TANGRAM VIET 0.5 (da gan menu Goc giai tri)
rem  1) Chep index.html, du-lieu.json, nhac-nen.mp3, anh-chia-se-v05.jpg vao site\public\tro-choi\tangram-viet\
rem  2) Dua web len Cloudflare (npm run deploy:site)
rem  Sua src\ hoac admin\ thi chay them: npm run deploy:admin
rem  Link: https://quantritute.com/tro-choi/tangram-viet/
rem ============================================================
set "SRC=%~dp0"
set "DST=%~dp0..\..\site\public\tro-choi\tangram-viet"
if not exist "%DST%" mkdir "%DST%"
copy /Y "%SRC%index.html" "%DST%\index.html" >nul || goto :err
copy /Y "%SRC%du-lieu.json" "%DST%\du-lieu.json" >nul || goto :err
copy /Y "%SRC%nhac-nen.mp3" "%DST%\nhac-nen.mp3" >nul || goto :err
copy /Y "%SRC%anh-chia-se-v05.jpg" "%DST%\anh-chia-se-v05.jpg" >nul || goto :err
echo Da chep file vao site\public\tro-choi\tangram-viet
cd /d "%~dp0..\.."
call npm run deploy:site
if errorlevel 1 goto :err
echo.
echo Xong. Mo https://quantritute.com/goc-giai-tri  (nhan Ctrl+F5)
pause
exit /b 0
:err
echo [Loi] Xuat ban that bai. Chup man hinh loi gui Claude.
pause
exit /b 1
