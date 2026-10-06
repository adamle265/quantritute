@echo off
setlocal
chcp 65001 >nul
rem ============================================================
rem  CAI DAT SAO LUU CODE LEN GITHUB (chay 1 lan)
rem  Can: 1) Da cai Git for Windows (git-scm.com)
rem       2) Da tao kho RIENG TU (Private) trong tren github.com, VD: quantritute
rem  Cach dung: mo PowerShell tai thu muc quantritute, go:  .\cai-dat-github.cmd
rem ============================================================
pushd "%~dp0"
where git >nul 2>nul || (echo [Loi] Chua cai Git. Tai tai https://git-scm.com/download/win , cai xong mo lai PowerShell roi chay lai. & popd & exit /b 1)

if not exist ".git" (
  git init -b main || goto :err
)
for /f "delims=" %%A in ('git config user.name') do set "GN=%%A"
if not defined GN (
  set /p GN=Ten hien thi tren GitHub ^(VD: Minh Tuan^): 
  call git config user.name "%%GN%%"
)
for /f "delims=" %%A in ('git config user.email') do set "GE=%%A"
if not defined GE (
  set /p GE=Email dang ky GitHub: 
  call git config user.email "%%GE%%"
)
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  set /p URL=Dan link kho GitHub ^(VD: https://github.com/ten-anh/quantritute.git^): 
  call git remote add origin "%%URL%%" || goto :err
)
git add -A || goto :err
git commit -m "Ban dau: website Quan tri tu te + Cam nang thue" || echo (Khong co thay doi moi de luu)
echo.
echo Dang day len GitHub... ^(lan dau se mo trinh duyet de anh dang nhap GitHub^)
git push -u origin main || goto :err
echo.
echo XONG. Tu nay moi tuan chay .\sao-luu.cmd de sao luu ca code va database.
popd
exit /b 0
:err
echo [Loi] Cai dat dung giua chung. Chup man hinh gui BuBu.
popd
exit /b 1
