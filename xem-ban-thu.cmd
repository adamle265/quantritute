@echo off
chcp 65001 >nul
rem Dua ban thu (thu muc site-ban-thu) len dia chi xem truoc rieng: https://ban-thu.quantritute.pages.dev
rem KHONG anh huong web chinh. Web chinh van deploy bang: npm run deploy:site
pushd "%~dp0site-ban-thu"
call npx wrangler pages deploy --project-name quantritute --branch ban-thu --commit-dirty=true
popd
