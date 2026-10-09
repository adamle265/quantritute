@echo off
chcp 65001 >nul
rem NAP 10 SACH MAU cho Tu sach (Goc ngam). Xoa bang .\mau\xoa-mau.cmd
pushd "%~dp0.."
call npx wrangler d1 execute quantritute-db --remote --file=mau\nap-sach-mau.sql --yes --config site/wrangler.jsonc
echo.
echo Xong. Mo /goc-ngam de xem Tu sach.
popd
