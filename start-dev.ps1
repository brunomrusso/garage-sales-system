# Script para iniciar o projeto completo (Backend + Frontend)
# Uso: .\start-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GarageSales - Iniciando Desenvolvimento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
Write-Host "Verificando Python..." -ForegroundColor Yellow
python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Python não encontrado. Instale Python 3.9+" -ForegroundColor Red
    exit 1
}

# Verificar se Node.js está instalado
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Node.js não encontrado. Instale Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Dependências encontradas" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "Iniciando Backend (Python + FastAPI)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; if (-not (Test-Path 'venv')) { python -m venv venv }; .\venv\Scripts\Activate.ps1; pip install -q -r requirements.txt 2>$null; python main.py"

Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "Iniciando Frontend (React + Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install -q 2>$null; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servidores iniciando..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Docs:     http://localhost:5000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C em qualquer janela para parar" -ForegroundColor Gray
