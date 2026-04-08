@echo off
REM Script para configurar PostgreSQL e criar usuario
REM Uso: setup-postgres.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Configurando PostgreSQL
echo ========================================
echo.

REM Verificar se PostgreSQL esta instalado
psql --version >nul 2>&1
if errorlevel 1 (
    echo Erro: PostgreSQL nao encontrado!
    echo Instale PostgreSQL em: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL encontrado!
echo.

REM Criar usuario e banco de dados
echo Criando usuario 'garage_user' e banco de dados 'garage_sales'...
echo.

REM Conectar como postgres (usuario padrao) e criar novo usuario e banco
psql -U postgres -c "CREATE USER garage_user WITH PASSWORD 'garage123';" 2>nul
psql -U postgres -c "ALTER USER garage_user CREATEDB;" 2>nul
psql -U postgres -c "CREATE DATABASE garage_sales OWNER garage_user;" 2>nul

echo Concedendo permissoes...
psql -U postgres -d garage_sales -c "GRANT ALL PRIVILEGES ON SCHEMA public TO garage_user;" 2>nul

echo Executando migrations...
psql -U garage_user -d garage_sales -f backend\app\db\init.sql

if errorlevel 1 (
    echo.
    echo AVISO: Erro ao executar migrations
    echo Tente manualmente:
    echo   psql -U garage_user -d garage_sales -f backend\app\db\init.sql
) else (
    echo.
    echo ========================================
    echo   PostgreSQL configurado com sucesso!
    echo ========================================
    echo.
    echo Usuario: garage_user
    echo Senha: garage123
    echo Banco: garage_sales
    echo.
)

pause
