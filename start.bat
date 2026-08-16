@echo off
rem Pi Hua Mu Xue - one-click dev launcher (backend + frontend)
rem Uses %~dp0 to locate itself, so it works from any directory (including paths with spaces)

set "ROOT=%~dp0"

echo.
echo ==========================================
echo   Starting Blog Server (dev mode)...
echo ==========================================
echo.

rem Check dependencies before launching
if not exist "%ROOT%server\node_modules" (
    echo [WARN] server\node_modules not found. Run first: cd server ^&^& npm install
)
if not exist "%ROOT%client\node_modules" (
    echo [WARN] client\node_modules not found. Run first: cd client ^&^& npm install
)

echo Starting backend...
start "Backend" /D "%ROOT%server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "Frontend" /D "%ROOT%client" cmd /k "npm run dev"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Dev servers run in their own windows; close them to stop.
pause
