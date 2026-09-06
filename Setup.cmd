@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "PS_SCRIPT=%ROOT%scripts\setup.ps1"

if not exist "%PS_SCRIPT%" (
    echo [錯誤] 找不到安裝腳本: %PS_SCRIPT%
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

pause
endlocal
exit /b %ERRORLEVEL%
