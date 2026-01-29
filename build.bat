@echo off
setlocal enabledelayedexpansion

echo ################################################
echo #       NERON CENTRALITA - BUILD SYSTEM        #
echo ################################################
echo.

:: 1. Build Frontend
echo [1/4] CONSTRUYENDO EL FRONTEND (Vite)...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo buildear el frontend.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
:: 2. Build Executable
echo [2/4] CREANDO EL ARCHIVO EJECUTABLE (.EXE)...
cd server
:: Usamos npx para asegurar que pkg este disponible
call npx pkg . --targets node18-win-x64 --output ../NeronCentralita.exe
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo crear el ejecutable.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
:: 3. Prepare Package
echo [3/4] PREPARANDO CARPETA DE DISTRIBUCION...
if not exist PackNeronCentralita mkdir PackNeronCentralita

:: Copiar el ejecutable
copy /Y NeronCentralita.exe PackNeronCentralita\NeronCentralita.exe >nul

:: Copiar el motor de la base de datos (IMPORTANTE)
if exist server\node_modules\sqlite3\build\Release\node_sqlite3.node (
    copy /Y server\node_modules\sqlite3\build\Release\node_sqlite3.node PackNeronCentralita\node_sqlite3.node >nul
) else (
    echo [ALERTA] No se encontro el motor sqlite3 en Release, buscando en raiz...
    if exist node_sqlite3.node (
        copy /Y node_sqlite3.node PackNeronCentralita\node_sqlite3.node >nul
    ) else (
        echo [ERROR] No se encontro node_sqlite3.node. El programa no funcionara.
    )
)

echo.
:: 4. Done
echo [4/4] ¡CONSTRUCCION COMPLETADA CON EXITO!
echo ################################################
echo.
echo Los archivos listos para usar estan en:
echo --^> PackNeronCentralita \
echo.
echo NOTA: Recuerda copiar la carpeta "BaseCentralita" 
echo si quieres mantener tus datos actuales.
echo.
pause
