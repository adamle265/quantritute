@echo off
chcp 65001 >nul
rem XOA TOAN BO NOI DUNG MAU (duong dan bat dau bang mau-). Khong dung den bai/video that.
pushd "%~dp0.."
call npx wrangler d1 execute quantritute-db --remote --file=mau\xoa-mau.sql --yes --config site/wrangler.jsonc
echo Da xoa noi dung mau.
popd
