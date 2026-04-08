@echo off
REM Script para instalar PostgreSQL automaticamente
REM Uso: install-postgresql.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Instalando PostgreSQL
echo ========================================
echo.

REM Verificar se ja esta instalado
psql --version >nul 2>&1
if errorlevel 0 (
    echo PostgreSQL ja esta instalado!
    pause
    exit /b 0
)

REM Baixar instalador
echo Baixando PostgreSQL...
cd %TEMP%

REM URL do PostgreSQL 15 (versao estavel)
set POSTGRES_URL=https://sbp.enterprisedb.com/getfile.jsp?fileid=1258044
set POSTGRES_FILE=postgresql-15.5-1-windows-x64.exe

echo Baixando %POSTGRES_FILE%...
powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; (New-Object System.Net.WebClient).DownloadFile('%POSTGRES_URL%', '%POSTGRES_FILE%')"

if not exist %POSTGRES_FILE% (
    echo.
    echo Erro ao baixar PostgreSQL
    echo Baixe manualmente em: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo.
echo Instalando PostgreSQL...
echo Por favor, configure durante a instalacao:
echo   - Senha do usuario 'postgres': postgres
echo   - Porta: 5432
echo   - Locale: Portuguese, Brazil
echo.

REM Executar instalador
%POSTGRES_FILE% --unattendedmodeui minimal --mode unattended --superpassword postgres

if errorlevel 1 (
    echo.
    echo Erro na instalacao
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PostgreSQL instalado com sucesso!
echo ========================================
echo.

REM Limpar arquivo baixado
del %POSTGRES_FILE%

pause
