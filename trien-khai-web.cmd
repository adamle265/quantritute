@echo off
chcp 65001 >nul
rem Dua WEB CHINH (site) len Cloudflare: npm run deploy:site. Cach dung: nhap dup file nay hoac go .\trien-khai-web.cmd
pushd "%~dp0"
call npm run deploy:site
echo.
echo === Xong. Bam phim bat ky de dong ===
pause >nul
popd
