@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "PS_SCRIPT=%ROOT%scripts\quick-start.ps1"

if not exist "%PS_SCRIPT%" (
    echo [錯誤] 找不到啟動腳本: %PS_SCRIPT%
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

endlocal
exit /b %ERRORLEVEL%
