@echo off
REM ============================================================
REM  Instalador do Plugin Teams Controls para Ulanzi Studio
REM  Execute este script como Administrador
REM ============================================================

echo.
echo ============================================
echo   Microsoft Teams Controls - Ulanzi Plugin
echo   Instalador automatico
echo ============================================
echo.

SET PLUGIN_NAME=com.ulanzi.teams.ulanziPlugin
SET ULANZI_PLUGINS=%APPDATA%\UlanziStudio\plugins

REM Verifica se o Ulanzi Studio está instalado
if not exist "%ULANZI_PLUGINS%" (
    echo [ERRO] Pasta de plugins do Ulanzi Studio nao encontrada:
    echo        %ULANZI_PLUGINS%
    echo.
    echo Instale o Ulanzi Studio primeiro: https://www.ulanzi.com/pages/ulanzi-app
    pause
    exit /b 1
)

echo [1/3] Copiando plugin para Ulanzi Studio...
xcopy /E /I /Y "%~dp0" "%ULANZI_PLUGINS%\%PLUGIN_NAME%" >nul 2>&1
echo       OK: %ULANZI_PLUGINS%\%PLUGIN_NAME%

REM Verifica se o SDK já foi clonado
if exist "%~dp0..\UlanziDeckPlugin-SDK\common-html\libs" (
    echo [2/3] Copiando bibliotecas do SDK...
    xcopy /E /I /Y "%~dp0..\UlanziDeckPlugin-SDK\common-html\libs" "%ULANZI_PLUGINS%\%PLUGIN_NAME%\libs" >nul 2>&1
    echo       OK: libs copiadas
) else (
    echo [2/3] ATENCAO: Bibliotecas do SDK nao encontradas!
    echo.
    echo       Voce precisa copiar manualmente a pasta "libs" do SDK:
    echo       https://github.com/UlanziTechnology/UlanziDeckPlugin-SDK
    echo.
    echo       Caminho esperado: ..\UlanziDeckPlugin-SDK\common-html\libs
)

echo [3/3] Instalacao concluida!
echo.
echo ============================================
echo   PROXIMO PASSO:
echo   Reinicie o Ulanzi Studio para carregar
echo   o plugin Microsoft Teams Controls.
echo ============================================
echo.
pause
