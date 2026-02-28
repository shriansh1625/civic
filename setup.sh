#!/usr/bin/env bash
# CivicLens AI — Setup Script (Linux/macOS)
set -e

echo "========================================"
echo "  CivicLens AI — Setup"
echo "========================================"

# Backend setup
echo ""
echo "[1/4] Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  ✓ Virtual environment created"
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
echo "  ✓ Python dependencies installed"

# Seed database
echo ""
echo "[2/4] Seeding demo database..."
python seed_db.py
echo "  ✓ Database seeded with demo data"

cd ..

# Frontend setup
echo ""
echo "[3/4] Setting up React frontend..."
cd frontend
npm install --silent
echo "  ✓ npm dependencies installed"
cd ..

# Done
echo ""
echo "[4/4] Setup complete!"
echo ""
echo "========================================"
echo "  To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && source venv/bin/activate"
echo "    uvicorn main:app --reload --port 8000"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo "========================================"
