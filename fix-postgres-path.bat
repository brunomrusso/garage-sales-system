@echo off
REM Script para adicionar PostgreSQL ao PATH do Windows
REM Uso: fix-postgres-path.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Configurando PATH do PostgreSQL
echo ========================================
echo.

REM Procurar PostgreSQL em locais comuns
set POSTGRES_PATH=
set POSTGRES_BIN=

if exist "C:\Program Files\PostgreSQL\15\bin" (
    set POSTGRES_PATH=C:\Program Files\PostgreSQL\15\bin
    set POSTGRES_BIN=C:\Program Files\PostgreSQL\15\bin\psql.exe
)

if exist "C:\Program Files\PostgreSQL\14\bin" (
    set POSTGRES_PATH=C:\Program Files\PostgreSQL\14\bin
    set POSTGRES_BIN=C:\Program Files\PostgreSQL\14\bin\psql.exe
)

if exist "C:\Program Files\PostgreSQL\13\bin" (
    set POSTGRES_PATH=C:\Program Files\PostgreSQL\13\bin
    set POSTGRES_BIN=C:\Program Files\PostgreSQL\13\bin\psql.exe
)

if exist "C:\Program Files (x86)\PostgreSQL\15\bin" (
    set POSTGRES_PATH=C:\Program Files (x86)\PostgreSQL\15\bin
    set POSTGRES_BIN=C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe
)

if "!POSTGRES_PATH!"=="" (
    echo Erro: PostgreSQL nao encontrado em locais padrao
    echo Procure manualmente onde PostgreSQL foi instalado
    echo Exemplo: C:\Program Files\PostgreSQL\15\bin
    pause
    exit /b 1
)

echo Encontrado PostgreSQL em: !POSTGRES_PATH!
echo.

REM Adicionar ao PATH permanentemente
echo Adicionando ao PATH do Windows...
setx PATH "!POSTGRES_PATH!;%PATH%"

if errorlevel 1 (
    echo Erro ao adicionar ao PATH
    echo Tente rodar como Administrador
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PATH configurado com sucesso!
echo ========================================
echo.
echo Feche todas as janelas de CMD/PowerShell abertas
echo e abra uma nova janela para aplicar as mudancas
echo.

pause
