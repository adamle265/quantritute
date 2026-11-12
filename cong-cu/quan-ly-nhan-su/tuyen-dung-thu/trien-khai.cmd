@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Dua CONG TUYEN DUNG BAN THU NGHIEM len Cloudflare (11/11/2026)
rem  - Database RIENG: qtt-tuyen-dung-thu-db
rem  - Dia chi: https://recruit.quantritute.com
rem  Cach dung: mo PowerShell tai thu muc nay, go:  .\trien-khai.cmd
rem ============================================================
set "HERE=%~dp0"
set "ROOT=%~dp0..\..\.."
set "WR=%ROOT%\node_modules\.bin\wrangler.cmd"
if not exist "%WR%" (
  echo [Loi] Khong thay wrangler tai %WR%
  exit /b 1
)
echo.
echo 1/2  Chuan bi database...
node "%HERE%chuan-bi.mjs" "%WR%" || goto :err
echo.
echo 2/2  Dua Worker len Cloudflare...
pushd "%HERE%"
node "%HERE%deploy.mjs" "%WR%" || (popd & goto :err)
popd
echo.
echo XONG. Mo https://recruit.quantritute.com de kiem tra.
echo (Lan dau ten mien moi co the mat vai phut moi truy cap duoc.)
exit /b 0
:err
echo [Loi] Trien khai dung giua chung. Chup man hinh gui em.
exit /b 1
