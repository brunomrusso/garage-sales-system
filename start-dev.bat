@echo off
REM Script para iniciar o projeto completo (Backend + Frontend)
REM Uso: start-dev.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GarageSales - Iniciando Desenvolvimento
echo ========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Erro: Python nao encontrado. Instale Python 3.9+
    pause
    exit /b 1
)

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Erro: Node.js nao encontrado. Instale Node.js
    pause
    exit /b 1
)

echo Verificando dependencias... OK
echo.

REM Iniciar Backend
echo Iniciando Backend (Python + FastAPI)...
start "GarageSales Backend" cmd /k "cd backend && if not exist venv python -m venv venv && venv\Scripts\activate.bat && pip install -q -r requirements.txt && python main.py"

timeout /t 3 /nobreak

REM Iniciar Frontend
echo Iniciando Frontend (React + Vite)...
start "GarageSales Frontend" cmd /k "cd frontend && npm install -q && npm run dev"

echo.
echo ========================================
echo   Servidores iniciando...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo Docs:     http://localhost:5000/docs
echo.
echo Pressione Ctrl+C em qualquer janela para parar
echo.

pause
