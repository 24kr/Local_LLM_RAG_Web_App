@echo off
echo Starting Local LLM Application...

start cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
timeout /t 3
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================