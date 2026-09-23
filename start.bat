@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo =================================================
echo    🤖 Zalo Personal AI Agent v0.1.0 (Beta)             
echo =================================================

:: 1. Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai Node.js! Vui long cai Node.js v20+ tai https://nodejs.org
    pause
    exit /b 1
)

:: 2. Tu dong cai dat thu vien neu chua co
if not exist node_modules (
    echo [INFO] Lan dau chay: Dang tu dong cai thu vien phu thuoc...
    call npm install --quiet
)

:: 3. Khoi chay Bot
echo [INFO] Dang khoi dong Zalo AI Agent...
node daemon.js
pause
