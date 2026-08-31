@echo off
echo ================================================
echo  CIVIS Lite - Starting Demo Environment
echo ================================================

:: Set Node.js path
set NODE_PATH=C:\Users\arush\.gemini\antigravity\scratch\nodejs
set PATH=%NODE_PATH%;%PATH%

:: Start backend in a new window
echo Starting backend (FastAPI on port 8000)...
start "CIVIS Backend" cmd /k "cd /d C:\Users\arush\.gemini\antigravity\scratch\civis-lite\backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait 3 seconds
timeout /t 3 /nobreak

:: Start frontend in a new window
echo Starting frontend (Next.js on port 3000)...
start "CIVIS Frontend" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d C:\Users\arush\.gemini\antigravity\scratch\civis-lite\frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo.
echo  Backend API:  http://localhost:8000
echo  API Docs:     http://localhost:8000/docs
echo  Frontend:     http://localhost:3000
echo.
echo  Login as Admin to see the full dashboard.
echo  Go to Centre TC-MH-007 for the CRITICAL risk showcase.
pause
