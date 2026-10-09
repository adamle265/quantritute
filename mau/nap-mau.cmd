@echo off
chcp 65001 >nul
rem NAP NOI DUNG MAU (5 bai Blog + 4 video Goc ngam). Chay SAU khi da deploy ban 1.9 va mo web 1 lan.
pushd "%~dp0.."
call npx wrangler d1 execute quantritute-db --remote --file=mau\nap-mau.sql --yes --config site/wrangler.jsonc
echo.
echo Xong. Mo /blog va /goc-ngam?phong=chieu de xem. Xoa mau bang: .\mau\xoa-mau.cmd
popd
