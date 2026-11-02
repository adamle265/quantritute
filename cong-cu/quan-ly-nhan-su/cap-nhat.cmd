@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Cap nhat 1 cong cu len web Quan tri tu te
rem  - Chep app\  ->  site\public\tools\<slug>\   (slug = ten thu muc nay)
rem  - Chay npm run deploy:site o thu muc goc quantritute
rem  Cach dung: mo PowerShell tai thu muc cong cu, go:  .\cap-nhat.cmd
rem ============================================================
for %%I in ("%~dp0.") do set "SLUG=%%~nxI"
set "SRC=%~dp0app"
set "ROOT=%~dp0..\.."
set "DEST=%ROOT%\site\public\tools\%SLUG%"

if /I "%SLUG%"=="_mau" (
  echo [Dung] Day la thu muc mau. Hay chep _mau thanh thu muc moi, dat ten = slug cong cu.
  exit /b 1
)
if not exist "%SRC%\index.html" (
  echo [Loi] Khong thay app\index.html trong %SLUG%.
  exit /b 1
)

echo.
echo === Cong cu: %SLUG% ===
echo Chep app\  ^>  site\public\tools\%SLUG%\
robocopy "%SRC%" "%DEST%" /MIR /NFL /NDL /NJH /NJS /NP >nul
if %ERRORLEVEL% GEQ 8 (
  echo [Loi] Chep file that bai. Ma loi robocopy: %ERRORLEVEL%
  exit /b 1
)
echo Chep xong.

echo.
echo Dua trang khach len Cloudflare...
pushd "%ROOT%"
call npm run deploy:site
set "RC=%ERRORLEVEL%"
popd
if not "%RC%"=="0" (
  echo [Loi] Deploy that bai. Chup man hinh gui BuBu.
  exit /b %RC%
)
echo.
echo Xong. Link cong cu tren web: /tools/%SLUG%/
endlocal
