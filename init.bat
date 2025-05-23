@echo off

call npm install

if not exist "public\assets\posts" mkdir "public\assets\posts"

if not exist "public\assets\logo.png" (
    echo.
    echo couldn't find logo, make sure you add one to public/assets/logo.png
    echo.
)

(
echo CREATE TABLE IF NOT EXISTS posts(
echo     src TEXT UNIQUE NOT NULL,
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     uploader TEXT NOT NULL,
echo     date TIMESTAMP, 
echo     score INTEGER DEFAULT 0,
echo     voters TEXT,
echo     rating VARCHAR(20)
echo         CHECK (rating IN ('general', 'sensitive', 'questionable', 'explicit')),
echo     tags VARCHAR
echo );
echo 
echo CREATE TABLE IF NOT EXISTS users (
echo     id INTEGER PRIMARY KEY AUTOINCREMENT,
echo     username TEXT UNIQUE NOT NULL,
echo     password TEXT NOT NULL,
echo     user_groups TEXT,
echo     deleted BOOL
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