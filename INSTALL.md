# trading_analysis 安裝與多電腦部署指南 (Installation Guide)

本指南說明如何在全新電腦上下載、安裝並快速啟動 `trading_analysis` 專案。

---

## 快速上手 (推薦：一鍵安裝)

### 步驟 1：事前準備
在目標電腦上，請先確認已安裝下列基礎環境：
1. **Git**：[下載 Git for Windows](https://git-scm.com/download/win)
2. **Python (3.10 或以上版本)**：[下載 Python](https://www.python.org/downloads/)（⚠️ 安裝時請務必勾選 **"Add python.exe to PATH"**）
3. **Node.js (18+ 或 20+ LTS)**：[下載 Node.js](https://nodejs.org/)

---

### 步驟 2：下載 (Clone) 專案
開啟 PowerShell 或 Terminal 終端機，執行：
```bash
git clone https://github.com/lulu930128/trading_analysis.git
cd trading_analysis
```

---

### 步驟 3：一鍵安裝環境
在專案根目錄下，直接雙擊執行：
👉 **`Setup.cmd`**（或在 PowerShell 中執行 `.\Setup.cmd`）

> **自動完成項目**：
> - 自動檢查系統 Python 與 Node.js
> - 自動建立專用虛擬環境 `.venv`
> - 自動安裝後端 Python 依賴庫（FastAPI, SQLAlchemy, pandas 等）
> - 自動建立 `.env` 設定檔（自 `.env.example` 複製）
> - 自動建立資料庫目錄並執行資料庫初始化結構（Alembic）
> - 自動安裝前端依賴庫（`npm install`）

---

### 步驟 4：一鍵啟動系統
安裝完成後，直接雙擊執行：
👉 **`QuickStart.cmd`**

> - 系統會自動啟動後端 FastAPI 伺服器 (Port: 8400)
> - 自動啟動前端 Next.js 儀表板 (Port: 3000)
> - 自動在預設瀏覽器中開啟 `http://localhost:3000`
> - 關閉時只要在黑視窗按下 `Enter` 鍵或關閉視窗，便會自動清理關閉所有程序。

---

## 手動安裝流程 (手動愛好者)

若您偏好手動執行命令列安裝：

### 1. 後端設定
```powershell
# 建立虛擬環境
python -m venv .venv

# 啟用虛擬環境
.\.venv\Scripts\Activate.ps1

# 升級 pip 並安裝後端套件
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# 複製環境設定
copy .env.example .env

# 資料庫初始化遷移
$env:PYTHONPATH = "backend"
alembic upgrade head
```

### 2. 前端設定
```powershell
cd frontend
npm install
cd ..
```

### 3. 分別啟動服務
- **後端**：
  ```powershell
  .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8400 --app-dir backend --reload
  ```
- **前端**：
  ```powershell
  cd frontend
  npm run dev
  ```
- **訪問**：開啟瀏覽器前往 `http://localhost:3000`

---

## 系統服務端點一覽

| 服務 | 網址 |
| :--- | :--- |
| **前端儀表板 (Next.js)** | [http://localhost:3000](http://localhost:3000) |
| **後端 API 文件 (Swagger)** | [http://127.0.0.1:8400/docs](http://127.0.0.1:8400/docs) |
| **健康檢查 (Health Check)** | [http://127.0.0.1:8400/api/system/health](http://127.0.0.1:8400/api/system/health) |

---

## 常見問題與除錯 (FAQ)

1. **PowerShell 顯示腳本執行權限受限**：
   - 以管理員身分開啟 PowerShell，執行：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
2. **Port 8400 或 3000 被佔用**：
   - 可在 `QuickStart.cmd` / `scripts/quick-start.ps1` 中自訂端口，例如：
     `powershell -File scripts/quick-start.ps1 -BackendPort 8401 -FrontendPort 3001`
3. **金鑰與額外資料來源**：
   - 編輯專案根目錄下的 `.env` 檔案，填入您的專屬 API Key（例如 Fugle、FinMind、Polygon 等）以啟用即時串流與擴充資料來源。
