@echo off
echo Starting Blog Server...
start "Backend" cmd /k "cd /d F:\project\opencode\HTMLsite\server && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd /d F:\project\opencode\HTMLsite\client && npm run dev"
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause