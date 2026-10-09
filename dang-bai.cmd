@echo off
chcp 65001 >nul
rem Dua 1 bai viet tu thu muc len trang quan tri (trang thai Cho duyet). Cach dung:  .\dang-bai.cmd blog\2026-10-07-ten-bai
pushd "%~dp0"
node scripts\dang-bai.mjs %*
popd
