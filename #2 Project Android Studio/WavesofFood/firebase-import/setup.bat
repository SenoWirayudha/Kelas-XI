@echo off
echo ========================================
echo Firebase Data Import Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing npm dependencies...
npm install

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Download service-account-key.json from Firebase Console
echo 2. Place it in this directory (firebase-import/)
echo 3. Run: npm start
echo.
echo For more information, see README.md
echo.
pause
