@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  Trien khai tinh nang "Theo doi van ban phap luat moi" (ban 1.3)
rem  1) Chep Cam nang (co khoi Cap nhat phap ly) + dua trang khach len
rem  2) Dua trang quan tri len (muc Van ban phap luat moi, nut Quet ngay)
rem  3) Dua Worker tu quet 3 ngay/lan (quantritute-watch) len
rem  Cach dung: mo PowerShell tai thu muc quantritute, go:  .\trien-khai-theo-doi-van-ban.cmd
rem ============================================================
pushd "%~dp0"
call "cong-cu\cam-nang-thue-2026\cap-nhat.cmd" || goto :err
echo.
echo Dua trang quan tri len Cloudflare...
call npm run deploy:admin || goto :err
echo.
echo Dua Worker tu quet van ban (quantritute-watch) len Cloudflare...
call npm run deploy:watch || goto :err
echo.
echo XONG. Vao trang quan tri ^> "Van ban phap luat moi" ^> bam "Quet ngay" de chay lan dau.
popd
exit /b 0
:err
echo [Loi] Trien khai dung giua chung. Chup man hinh gui BuBu.
popd
exit /b 1
