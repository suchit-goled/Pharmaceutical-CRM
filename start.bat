@echo off
echo ===================================================
echo Starting MedIntel Pharmaceutical CRM System
echo ===================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Pharma CRM Backend" cmd /k "cd /d %~dp0backend && (if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload) else (python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload))"

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "Pharma CRM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo Backend:  http://127.0.0.1:8000 (API & Swagger docs at /docs)
echo Frontend: http://localhost:5173
echo.
pause

