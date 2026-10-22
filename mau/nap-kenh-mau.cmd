@echo off
chcp 65001 >nul
rem NAP KENH MAU PHONG CHIEU: them thoi luong cho 4 video Better Version + kenh mau "Thu thach A-Z" (Le Na). Xoa mau: .\mau\xoa-mau.cmd
pushd "%~dp0.."
call npx wrangler d1 execute quantritute-db --remote --file=mau\nap-kenh-mau.sql --yes --config site/wrangler.jsonc
echo.
echo Xong. Mo /goc-ngam?phong=chieu de xem (nho bat Goc ngam trong quan tri).
popd
