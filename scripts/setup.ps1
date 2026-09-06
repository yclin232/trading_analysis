param(
    [switch]$ForceReinstall
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$venvDir = Join-Path $repoRoot ".venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "         trading_analysis (OMI) - 一鍵環境安裝與設定程式           " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查 Python
Write-Host "[1/6] 檢查系統 Python 環境..." -ForegroundColor Green
$sysPython = Get-Command "python.exe", "py.exe", "python3.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $sysPython) {
    Write-Host "[錯誤] 系統未安裝 Python！請先安裝 Python 3.10+ 並加入 PATH。" -ForegroundColor Red
    Write-Host "下載網址: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
Write-Host "      找到 Python: $sysPython" -ForegroundColor Gray

# 2. 檢查 Node.js & npm
Write-Host "[2/6] 檢查系統 Node.js / npm 環境..." -ForegroundColor Green
$npm = Get-Command "npm.cmd", "npm" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $npm) {
    Write-Host "[錯誤] 系統未安裝 Node.js！請先安裝 Node.js 18+ (LTS)。" -ForegroundColor Red
    Write-Host "下載網址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "      找到 npm: $npm" -ForegroundColor Gray

# 3. 建立或檢查 Python 虛擬環境
Write-Host "[3/6] 設定 Python 虛擬環境 (.venv)..." -ForegroundColor Green
if (-not (Test-Path -LiteralPath $pythonExe) -or $ForceReinstall.IsPresent) {
    Write-Host "      正在建立虛擬環境 (.venv)..." -ForegroundColor Gray
    & $sysPython -m venv $venvDir
}

# 4. 安裝後端依賴套件
Write-Host "[4/6] 安裝後端相依套件 (requirements.txt)..." -ForegroundColor Green
& $pythonExe -m pip install --upgrade pip --quiet
$reqFile = Join-Path $backendDir "requirements.txt"
if (Test-Path -LiteralPath $reqFile) {
    & $pythonExe -m pip install -r $reqFile
}

# 5. 設定環境變數檔與資料庫
Write-Host "[5/6] 初始化環境設定檔與資料庫目錄..." -ForegroundColor Green
$envFile = Join-Path $repoRoot ".env"
$envExample = Join-Path $repoRoot ".env.example"
if (-not (Test-Path -LiteralPath $envFile) -and (Test-Path -LiteralPath $envExample)) {
    Copy-Item $envExample $envFile
    Write-Host "      已從 .env.example 建立 .env 設定檔" -ForegroundColor Gray
}

# 確保必要資料夾存在
foreach ($dir in @("data", "logs", "reports")) {
    $targetDir = Join-Path $repoRoot $dir
    if (-not (Test-Path -LiteralPath $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
    }
}

# 執行 Alembic 資料庫結構遷移
Write-Host "      執行資料庫初始化遷移 (Alembic)..." -ForegroundColor Gray
$env:PYTHONPATH = $backendDir
try {
    & $pythonExe -m alembic upgrade head
} catch {
    Write-Host "      [提示] 資料庫遷移跳過或已是最新版" -ForegroundColor Yellow
}

# 6. 安裝前端依賴套件
Write-Host "[6/6] 安裝前端相依套件 (npm install)..." -ForegroundColor Green
Push-Location $frontendDir
try {
    & $npm install
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  恭喜！trading_analysis 環境安裝完成！" -ForegroundColor Green
Write-Host "  您可以直接雙擊專案目錄下的 [QuickStart.cmd] 啟動系統！" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
