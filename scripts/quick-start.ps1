param(
    [int]$BackendPort = 8400,
    [int]$FrontendPort = 3000,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$pythonExe = Join-Path $repoRoot ".venv\Scripts\python.exe"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "         Open Market Intelligence (OMI) - 快速啟動程式            " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path -LiteralPath $pythonExe)) {
    Write-Host "[錯誤] 找不到 Python 虛擬環境: $pythonExe" -ForegroundColor Red
    Write-Host "請先在專案根目錄建立虛擬環境並安裝相依套件。" -ForegroundColor Yellow
    exit 1
}

$npm = Get-Command "npm.cmd", "npm" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $npm) {
    Write-Host "[錯誤] 系統 PATH 中找不到 npm！請先安裝 Node.js。" -ForegroundColor Red
    exit 1
}

$env:PYTHONPATH = $backendDir
$env:APP_PORT = [string]$BackendPort
$env:OMI_BACKEND_PORT = [string]$BackendPort
$env:OMI_FRONTEND_PORT = [string]$FrontendPort

Write-Host "[1/4] 啟動後端 FastAPI 服務 (Port: $BackendPort)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath $pythonExe `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$BackendPort", "--app-dir", "backend", "--reload") `
    -WorkingDirectory $repoRoot `
    -PassThru

Write-Host "[2/4] 啟動前端 Next.js 介面 (Port: $FrontendPort)..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath $npm `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $frontendDir `
    -PassThru

Write-Host "[3/4] 等待後端與資料庫就緒..." -ForegroundColor Green
$healthUrl = "http://127.0.0.1:$BackendPort/api/system/health"
$frontendUrl = "http://localhost:$FrontendPort"

$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($response -ne $null) {
            $backendReady = $true
            break
        }
    }
    catch {
        Start-Sleep -Milliseconds 600
    }
}

if ($backendReady) {
    Write-Host "      後端服務已就緒！" -ForegroundColor Green
} else {
    Write-Host "      [提示] 後端仍在初始化中..." -ForegroundColor Yellow
}

if (-not $NoBrowser.IsPresent) {
    Write-Host "[4/4] 自動開啟瀏覽器前往 $frontendUrl..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    Start-Process $frontendUrl
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  OMI 已順利運行中！" -ForegroundColor Green
Write-Host "  - 前端儀表板: $frontendUrl" -ForegroundColor White
Write-Host "  - 後端 API 文件: http://127.0.0.1:$BackendPort/docs" -ForegroundColor White
Write-Host "  - 系統健康狀態: $healthUrl" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  [提示] 按 Enter 鍵或關閉視窗可結束所有服務..." -ForegroundColor Yellow
Write-Host ""

try {
    $null = Read-Host
}
finally {
    Write-Host "正在關閉所有 OMI 服務..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        $taskkill = Join-Path $env:SystemRoot "System32\taskkill.exe"
        if (Test-Path -LiteralPath $taskkill) {
            & $taskkill /PID $frontendProcess.Id /T /F | Out-Null
        } else {
            Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "OMI 服務已安全結束。" -ForegroundColor Green
}
