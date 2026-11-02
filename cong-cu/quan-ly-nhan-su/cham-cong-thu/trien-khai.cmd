@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Dua BAN THU NGHIEM "Cham cong Wi-Fi" len Cloudflare
rem  - Dung wrangler cua du an quantritute (da dang nhap san)
rem  - Database RIENG: qtt-cham-cong-thu-db (khong dung den quantritute-db)
rem  - Dia chi: https://chamcong-thu.quantritute.com
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
call "%WR%" deploy --config wrangler.jsonc || (popd & goto :err)
popd
echo.
echo XONG. Mo https://chamcong-thu.quantritute.com/quan-ly de cai dat lan dau.
echo (Lan dau ten mien moi co the mat vai phut moi truy cap duoc.)
exit /b 0
:err
echo [Loi] Trien khai dung giua chung. Chup man hinh gui BuBu.
exit /b 1
