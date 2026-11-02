@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Dua KHO RIENG (Kho nghien cuu + So tay, co mat khau) len Cloudflare.
rem  Du an Pages rieng: quantritute-kho  ->  gan ten mien phu (vd kho.quantritute.com) trong Cloudflare.
rem  Lan dau: tao du an + hoi mat khau (toi thieu 10 ky tu). Cac lan sau: chi dua ban moi len.
rem  Doi mat khau: .\trien-khai-kho.cmd doi-mat-khau
rem  Cach dung: mo PowerShell tai thu muc quantritute, go:  .\trien-khai-kho.cmd
rem ============================================================
pushd "%~dp0"
if not exist "kho\public\index.html" (
  echo [Loi] Chua co file kho\public\index.html. Bao Claude dung lai file kho.
  goto :err
)

echo === 1/3 Tao du an Cloudflare Pages "quantritute-kho" (bo qua neu da co) ===
call npx wrangler pages project create quantritute-kho --production-branch main >nul 2>&1
echo OK

echo.
echo === 2/3 Mat khau dang nhap ===
set "NEEDPW=1"
call npx wrangler pages secret list --project-name quantritute-kho 2>nul | findstr /C:"KHO_PASSWORD" >nul && set "NEEDPW=0"
if /I "%~1"=="doi-mat-khau" set "NEEDPW=1"
if "%NEEDPW%"=="1" (
  echo Nhap mat khau cho kho ^(toi thieu 10 ky tu, ghi lai o noi an toan^), roi Enter:
  call npx wrangler pages secret put KHO_PASSWORD --project-name quantritute-kho || goto :err
) else (
  echo Da co mat khau. Muon doi: .\trien-khai-kho.cmd doi-mat-khau
)

echo.
echo === 3/3 Dua kho len Cloudflare ===
pushd kho
call npx wrangler pages deploy --project-name quantritute-kho --branch main --commit-dirty=true || (popd & goto :err)
popd

echo.
echo XONG. Mo https://quantritute-kho.pages.dev (hoac ten mien phu da gan) va dang nhap.
popd
pause
exit /b 0
:err
echo [Loi] Trien khai dung giua chung. Chup man hinh gui Claude.
popd
pause
exit /b 1
