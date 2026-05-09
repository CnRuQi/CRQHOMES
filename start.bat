@echo off
chcp 65001 >nul 2>nul
title Blog System

echo ========================================
echo   Blog System Starting...
echo ========================================
echo.

echo [1/2] Starting backend...
start "Backend" cmd /k "cd /d %~dp0server && node app.js"

echo [2/2] Starting frontend...
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo   Services starting, please wait...
echo ========================================
echo.
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo   Admin: http://localhost:5173/admin/login
echo   Username: CnRuQi
echo   Password: crq123456
echo.
echo ========================================
echo   Press any key to close this window
echo   (Backend and Frontend will keep running)
echo ========================================
pause >nul
