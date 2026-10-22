@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
rem Sua lan sao luu GitHub bi tu choi vi file qua nang (chay 1 lan, 22/10/2026)
rem Khong xoa file nao tren may: chi bo file nang (video, nhac, goi nen) khoi danh sach dua len GitHub
for /f %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set "D=%%D"
echo === 1/4 Huy lan commit chua day len duoc (giu nguyen file tren may) ===
git reset --soft origin/main || goto :err
echo === 2/4 Bo file nang khoi danh sach theo doi (.gitignore) ===
git rm -r --cached -q . || goto :err
git add -A || goto :err
echo === 3/4 Commit lai ===
git commit -q -m "Sao luu %D% (bo file nang)" || goto :err
echo === 4/4 Day len GitHub ===
git push || goto :err
echo.
echo XONG. Tu nay chay .\sao-luu.cmd nhu binh thuong.
popd
exit /b 0
:err
echo [Loi] Chua sua duoc. Chup man hinh gui BuBu.
popd
exit /b 1
