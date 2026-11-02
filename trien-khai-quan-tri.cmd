@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Dua RIENG trang quan tri (admin.quantritute.com) len Cloudflare.
rem  Dung khi Claude da sua ma trang quan tri va bao anh "chay trien-khai-quan-tri".
rem  Cach dung: bam dup file nay, hoac mo PowerShell tai thu muc quantritute, go:  .\trien-khai-quan-tri.cmd
rem ============================================================
pushd "%~dp0"
echo Dua trang quan tri len Cloudflare...
call npm run deploy:admin || goto :err
echo.
echo XONG trien khai trang quan tri. Anh tai lai trang quan tri (Ctrl+F5) la dung ban moi.
popd
pause
exit /b 0
:err
echo [Loi] Trien khai dung giua chung. Chup man hinh gui Claude.
popd
pause
exit /b 1
