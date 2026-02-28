# CivicLens AI — Setup Script (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CivicLens AI - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend setup
Write-Host ""
Write-Host "[1/4] Setting up Python backend..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "  + Virtual environment created" -ForegroundColor Green
}

& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
Write-Host "  + Python dependencies installed" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "[2/4] Seeding demo database..." -ForegroundColor Yellow
python seed_db.py
Write-Host "  + Database seeded with demo data" -ForegroundColor Green

Pop-Location

# Frontend setup
Write-Host ""
Write-Host "[3/4] Setting up React frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install --silent
Write-Host "  + npm dependencies installed" -ForegroundColor Green
Pop-Location

# Done
Write-Host ""
Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  To start the application:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor White
Write-Host "    cd backend; .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "    uvicorn main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "    cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then open: http://localhost:5173" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
