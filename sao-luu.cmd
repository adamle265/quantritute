@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  SAO LUU HANG TUAN: database (Cloudflare D1) + code (GitHub)
rem  - Database: luu vao thu muc sao-luu\db-YYYYMMDD.sql (KHONG dua len GitHub vi co email, SDT nguoi dung)
rem  - Neu co file sao-luu-drive.txt (1 dong = duong dan thu muc Google Drive tren may, VD: G:\My Drive\quantritute-sao-luu)
rem    thi chep them ban sao database vao do.
rem  - Code: commit + push len GitHub (neu da chay cai-dat-github.cmd)
rem  Cach dung: mo PowerShell tai thu muc quantritute, go:  .\sao-luu.cmd
rem ============================================================
pushd "%~dp0"
for /f %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "D=%%D"
if not exist "sao-luu" mkdir "sao-luu"

echo === 1/3 Sao luu database ===
call npx wrangler d1 export quantritute-db --remote --config site\wrangler.jsonc --output "sao-luu\db-%D%.sql" || goto :err
echo Da luu: sao-luu\db-%D%.sql

echo.
echo === 2/3 Chep sang Google Drive ===
if exist "sao-luu-drive.txt" (
  set /p DRIVE=<sao-luu-drive.txt
  call robocopy "sao-luu" "%%DRIVE%%" "db-%D%.sql" /NFL /NDL /NJH /NJS /NP >nul
  call echo Da chep sang: %%DRIVE%%
) else (
  echo Bo qua ^(chua co file sao-luu-drive.txt^). Anh tu chep file .sql len Google Drive.
)

echo.
echo === 3/3 Sao luu code len GitHub ===
where git >nul 2>nul || (echo Bo qua: chua cai Git. & goto :done)
if not exist ".git" (echo Bo qua: chua chay cai-dat-github.cmd. & goto :done)
git add -A
git commit -m "Sao luu %D%" || echo ^(Code khong doi tu lan truoc^)
git push || goto :err

:done
echo.
echo XONG sao luu ngay %D%.
popd
exit /b 0
:err
echo [Loi] Sao luu that bai. Chup man hinh gui BuBu.
popd
exit /b 1
