@echo off
REM Script de setup completo do projeto GarageSales
REM Uso: setup.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GarageSales - Setup Completo
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

REM Verificar PostgreSQL
psql --version >nul 2>&1
if errorlevel 1 (
    echo Erro: PostgreSQL nao encontrado. Instale PostgreSQL
    pause
    exit /b 1
)

echo [1/5] Verificando dependencias... OK
echo.

REM Setup Backend
echo [2/5] Configurando Backend...
cd backend

if not exist venv (
    echo   - Criando ambiente virtual...
    python -m venv venv
)

echo   - Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo   - Instalando dependencias Python...
pip install -q -r requirements.txt

if not exist .env (
    echo   - Criando arquivo .env...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/garage_sales
        echo SECRET_KEY=chave_secreta_desenvolvimento_123456789
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=1440
    ) > .env
    echo   - Arquivo .env criado com valores padrao
)

cd ..
echo   - Backend configurado!
echo.

REM Setup Frontend
echo [3/5] Configurando Frontend...
cd frontend

echo   - Instalando dependencias Node.js...
call npm install -q

if not exist .env (
    echo   - Criando arquivo .env...
    (
        echo VITE_API_URL=http://localhost:5000/api
    ) > .env
    echo   - Arquivo .env criado
)

cd ..
echo   - Frontend configurado!
echo.

REM Setup Database
echo [4/5] Configurando Banco de Dados...
echo   - Criando banco de dados garage_sales...

REM Tentar criar banco com usuario garage_user
psql -U garage_user -c "CREATE DATABASE garage_sales;" 2>nul
psql -U garage_user -d garage_sales -f backend\app\db\init.sql >nul 2>&1

if errorlevel 1 (
    echo   - AVISO: Erro ao executar migrations
    echo   - Execute primeiro: setup-postgres.bat
) else (
    echo   - Banco de dados criado com sucesso!
)
echo.

echo [5/5] Setup concluido!
echo.
echo ========================================
echo   Proximos passos:
echo ========================================
echo.
echo 1. Se for primeira vez, execute: setup-postgres.bat
echo 2. Depois execute: start-dev.bat
echo 3. Abra http://localhost:3000 no navegador
echo 4. Crie uma conta ou faca login
echo.
echo Documentacao da API: http://localhost:5000/docs
echo.
echo Credenciais do banco (se criado):
echo   Usuario: garage_user
echo   Senha: garage123
echo   Banco: garage_sales
echo.

pause
