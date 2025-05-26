@echo off
SETLOCAL

call :log > "%cd%\init.bat.log" 2>&1
exit /b

:log

tasklist /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq server.js" | findstr /i "node.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo node is already running, exiting...
    exit /b 1
)

call npm install

if not exist "public\assets\posts" mkdir "public\assets\posts"

setlocal enabledelayedexpansion

set "assets[0]=public\assets\logo.png"
set "assets[1]=public\assets\404.png"
set "assets[2]=public\assets\posts\deleted.png"
set "assets[3]=public\assets\favicon.ico"

set "count=0"
:loop
if defined assets[%count%] (
    if not exist "!assets[%count%]!" (
        echo.
        echo couldn't find !assets[%count%]!, make sure you add it
    )
    set /a count+=1
    goto :loop
)

endlocal

(
echo CREATE TABLE IF NOT EXISTS "posts" (
echo    "src" TEXT NOT NULL UNIQUE,
echo    "id" INTEGER,
echo    "uploader" TEXT NOT NULL,
echo    "date" TIMESTAMP,
echo    "score" INTEGER DEFAULT 0,
echo    "voters" TEXT,
echo    "rating" VARCHAR(20) CHECK("rating" IN ('general', 'sensitive', 'questionable', 'explicit')),
echo    "tags" TEXT,
echo    "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0, 1)),
echo    PRIMARY KEY("id" AUTOINCREMENT)
echo );
echo CREATE TABLE IF NOT EXISTS users (
echo    "id" INTEGER,
echo    "username" TEXT UNIQUE NOT NULL,
echo    "password" TEXT NOT NULL,
echo    "user_groups" TEXT,
echo    "deleted" BOOL DEFAULT 0 CHECK("deleted" in (0, 1)),
echo    PRIMARY KEY("id" AUTOINCREMENT)
echo );
echo .quit
) | sqlite3 booru.db

if not exist ".env" (
    (
    echo SESSION_KEY=""
    echo HOSTNAME=""
    echo PORT=0
    ) > .env
    
    echo.
    echo .env created with default configuration
    echo.
    echo set values for:
    echo   SESSION_KEY
    echo   HOSTNAME
    echo   PORT
    echo.
    timeout /t 5
    exit /b 1
) else (
    echo.
    for /f "usebackq tokens=*" %%i in (".env") do (
        for /f "tokens=1,2 delims==" %%a in ("%%i") do (
            set "%%a=%%b"
        )
    )
    
    node server.js %HOSTNAME% %PORT%
)