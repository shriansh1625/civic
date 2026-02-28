# 🇮🇳 CivicLens AI — Autonomous Civic Intelligence Agent for India

> **Hackathon-Ready Production Prototype** — An AI-powered platform that autonomously crawls, parses, summarizes, and delivers Indian government schemes, policies, and civic services to citizens in a personalized, actionable format.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![React](https://img.shields.io/badge/react-18-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.110-green)
![AMD EPYC](https://img.shields.io/badge/AMD_EPYC-Optimized-red)

---

## 📌 Problem Statement

India has **2,000+ government schemes** across central and state levels, spread across dozens of portals (MyScheme.gov.in, India.gov.in, NSAP, NSP, etc.). Citizens — especially farmers, students, MSMEs, and startups — struggle to:
- **Discover** relevant schemes among thousands of options
- **Understand** complex government language and eligibility criteria
- **Track** policy updates, new launches, and approaching deadlines
- **Act** on opportunities before they expire

**CivicLens AI** solves this with an autonomous agent that continuously monitors government portals, intelligently summarizes content, and delivers personalized civic intelligence to every citizen.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CivicLens AI Architecture                │
├──────────────────┬──────────────────┬───────────────────────┤
│   Frontend SPA   │   FastAPI Backend│   Autonomous Agent    │
│   React + Vite   │   Python 3.10+  │   Crawler + AI Layer  │
│   TailwindCSS    │   SQLAlchemy 2.0 │   APScheduler         │
│   Recharts       │   JWT Auth       │   BeautifulSoup+httpx │
├──────────────────┴──────────────────┴───────────────────────┤
│                      Data Layer                             │
│   SQLite (prototype) → PostgreSQL (production)              │
│   Async Engine (aiosqlite)                                  │
├─────────────────────────────────────────────────────────────┤
│              AMD EPYC Optimization Layer                    │
│   Multi-threaded crawling · Concurrent parsing              │
│   NUMA-aware scheduling · 128-core scalability              │
└─────────────────────────────────────────────────────────────┘
```

### Component Flow

```
Gov.in Portals ──► Crawler Agent ──► Document Parser ──► AI Summarizer
                        │                   │                  │
                   (Scheduled)         (Category/State     (Extractive
                   (APScheduler)        Detection)          Summary)
                        │                   │                  │
                        ▼                   ▼                  ▼
                   ┌─────────────────────────────────────────────┐
                   │              Database (SQLite/PG)           │
                   │   Schemes · Updates · Users · Alerts        │
                   └──────────────────┬──────────────────────────┘
                                      │
                        ┌─────────────┼─────────────┐
                        ▼             ▼             ▼
                  Personalization  Notification   REST API
                     Engine        Service       (FastAPI)
                        │             │             │
                        └─────────────┼─────────────┘
                                      ▼
                              React Frontend
                         Dashboard · Explorer · Chat
```

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **🕷️ Autonomous Crawling** | Scheduled agent crawls 8+ Gov.in portals (MyScheme, NSAP, NSP, PM-KISAN, etc.) |
| **📄 Smart Parsing** | Extracts title, ministry, category, eligibility, benefits, budget, deadlines from unstructured HTML |
| **🤖 AI Summarization** | Extractive summarization engine generates concise scheme summaries |
| **💬 Civic Q&A Chatbot** | Natural language interface — ask questions like "What schemes exist for farmers in UP?" |
| **👤 Personalization** | Relevance-scored feed based on user type, state, categories, and keywords |
| **🔔 Smart Alerts** | Deadline reminders, new scheme notifications, policy update alerts |
| **📊 Rich Dashboard** | Budget charts, category breakdowns, trend feeds, stat cards |
| **🔐 JWT Authentication** | Secure registration/login with role-based access (admin/citizen) |
| **⚡ Change Detection** | SHA-256 content hashing to detect and log policy modifications |
| **🏛️ Admin Panel** | Manage crawl sources, toggle active/inactive, trigger manual crawls |

---

## 🖥️ AMD EPYC Server Optimization

CivicLens AI is designed to fully leverage **AMD EPYC** processors for production deployment:

### Why AMD EPYC?

| Capability | CivicLens Usage |
|------------|----------------|
| **128 cores / 256 threads** | Run 128+ concurrent crawler workers |
| **8-channel DDR5 memory** | Hold entire scheme database in-memory for instant search |
| **PCIe Gen5 I/O** | Fast NVMe storage for database + model inference |
| **NUMA architecture** | Pin crawl workers to specific NUMA nodes for cache locality |

### Implementation Details

```python
# backend/app/core/config.py
AMD_EPYC_OPTIMIZED: bool = True
WORKER_THREADS: int = 64  # Scale to 128+ on EPYC

# backend/app/agents/crawler.py
semaphore = asyncio.Semaphore(settings.WORKER_THREADS)  # Concurrent crawl limit
```

**Deployment on EPYC:**
```bash
# Run FastAPI with EPYC-optimized worker count
uvicorn backend.main:app --workers 32 --host 0.0.0.0 --port 8000

# For full 128-core utilization:
# - 32 uvicorn workers (1 per 4 cores)
# - 64 concurrent crawler threads via asyncio semaphore
# - NUMA-pinned with numactl for memory locality
numactl --cpunodebind=0 --membind=0 uvicorn backend.main:app --workers 16
numactl --cpunodebind=1 --membind=1 uvicorn backend.main:app --workers 16
```

**Scaling Characteristics:**
- Linear scaling up to 128 concurrent crawl sources
- In-memory SQLite handles 10K+ schemes; PostgreSQL for millions
- Extractive summarization is CPU-bound — benefits from EPYC's L3 cache (up to 768MB)
- Zero GPU dependency — runs entirely on CPU

---

## 📁 Project Structure

```
civiclensai/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── crawler.py          # Autonomous web crawler agent
│   │   │   └── scheduler.py        # APScheduler cron jobs
│   │   ├── api/
│   │   │   ├── admin.py            # Admin crawl management endpoints
│   │   │   ├── alerts.py           # Alert CRUD endpoints
│   │   │   ├── auth.py             # Auth (register/login/me)
│   │   │   ├── chat.py             # AI chat & summarization
│   │   │   └── schemes.py          # Scheme explorer & dashboard
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings (.env)
│   │   │   ├── database.py         # Async SQLAlchemy engine
│   │   │   └── security.py         # JWT & password hashing
│   │   ├── models/
│   │   │   ├── alert.py            # Alert ORM model
│   │   │   ├── scheme.py           # Scheme, Update, CrawlSource models
│   │   │   └── user.py             # User + UserPreference models
│   │   ├── schemas/
│   │   │   └── models.py           # Pydantic request/response schemas
│   │   └── services/
│   │       ├── ai_engine.py        # Summarization + Q&A engine
│   │       ├── notifications.py    # Email/push notification service
│   │       ├── parser.py           # Document parser (category/state detection)
│   │       └── personalization.py  # Relevance scoring engine
│   ├── main.py                     # FastAPI application entry point
│   ├── seed_db.py                  # Database seeder (demo data)
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # Environment variables
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # CivicLens logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── BudgetChart.jsx   # Budget allocation bar chart
│   │   │   │   └── CategoryChart.jsx # Category donut chart
│   │   │   └── layout/
│   │   │       └── Layout.jsx        # Sidebar layout shell
│   │   ├── hooks/
│   │   │   └── useAuth.jsx           # Auth context provider
│   │   ├── pages/
│   │   │   ├── AdminCrawl.jsx        # Admin crawl control panel
│   │   │   ├── AlertsCenter.jsx      # Alert notifications center
│   │   │   ├── ChatAssistant.jsx     # AI Q&A chat interface
│   │   │   ├── Dashboard.jsx         # Main analytics dashboard
│   │   │   ├── Landing.jsx           # Public landing page
│   │   │   ├── Login.jsx             # Login with demo accounts
│   │   │   ├── Register.jsx          # Registration with user types
│   │   │   └── SchemeExplorer.jsx    # Filterable scheme browser
│   │   ├── services/
│   │   │   └── api.js                # Axios API service layer
│   │   ├── App.jsx                   # React Router setup
│   │   ├── index.css                 # TailwindCSS + custom components
│   │   └── main.jsx                  # React entry point
│   ├── index.html                    # HTML template
│   ├── package.json                  # npm dependencies
│   ├── tailwind.config.js            # Custom CivicLens theme
│   ├── postcss.config.js
│   └── vite.config.js                # Vite dev server config
├── docker-compose.yml                # Docker orchestration
├── Dockerfile                        # Multi-stage Docker build
├── setup.ps1                         # PowerShell setup script
├── setup.sh                          # Bash setup script
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- Git

### Option 1: Automated Setup

**Windows PowerShell:**
```powershell
.\setup.ps1
```

**Linux/macOS:**
```bash
chmod +x setup.sh && ./setup.sh
```

### Option 2: Manual Setup

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed demo data
python seed_db.py

# Start server
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/api/health |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civiclens.ai | demo123 |
| Student | student@civiclens.ai | demo123 |
| Farmer | farmer@civiclens.ai | demo123 |
| Startup | startup@civiclens.ai | demo123 |
| MSME | msme@civiclens.ai | demo123 |

---

## 🎬 Demo Walkthrough

### 1. Landing Page
Visit `http://localhost:5173` — see the hero section, feature cards, and user type showcase.

### 2. Quick Login
Click **"Login"** → use any demo account quick-login button (Admin, Student, Farmer, Startup).

### 3. Dashboard
After login, explore:
- **Stat cards**: Total schemes, new today, active alerts, coverage
- **Budget chart**: Ministry-wise allocation bar chart
- **Category breakdown**: Donut chart of scheme categories
- **Live feeds**: "What's New Today" and "Relevant for You"

### 4. Scheme Explorer
Navigate to **"Schemes"** in the sidebar:
- Search by keyword
- Filter by category (Agriculture, Education, Healthcare, etc.)
- Click a scheme card to see full details in a modal

### 5. AI Chat
Navigate to **"AI Chat"**:
- Ask: *"What schemes are available for farmers?"*
- Ask: *"Tell me about PM-KISAN"*
- Ask: *"How to apply for Startup India?"*
- Try suggested questions

### 6. Alerts Center
Navigate to **"Alerts"**:
- View deadline reminders, new scheme notifications
- Filter by type or unread status
- Click to mark as read

### 7. Admin Panel
Login as **admin@civiclens.ai** → Navigate to **"Admin"**:
- View all crawl sources with status
- Toggle sources active/inactive
- Trigger a manual crawl cycle
- Add new crawl sources

---

## 🔧 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/preferences` | Update user preferences |

### Schemes & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard stats + charts |
| GET | `/api/schemes` | List all schemes (filterable) |
| GET | `/api/schemes/{id}` | Get scheme details |
| GET | `/api/updates` | Recent scheme updates |
| GET | `/api/whats-relevant` | Personalized feed |

### AI & Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ask` | Ask a civic question |
| POST | `/api/summarize` | Summarize a document |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get user alerts |
| PUT | `/api/alerts/{id}/read` | Mark alert as read |
| PUT | `/api/alerts/read-all` | Mark all as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/crawl-sources` | List crawl sources |
| POST | `/api/admin/crawl-sources` | Add crawl source |
| DELETE | `/api/admin/crawl-sources/{id}` | Delete crawl source |
| POST | `/api/admin/trigger-crawl` | Trigger crawl cycle |

---

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up --build

# Access at http://localhost:5173
```

---

## 🧪 Testing

```bash
# Backend API tests
cd backend
pytest tests/ -v

# Frontend (if test runner configured)
cd frontend
npm test
```

---

## 🗺️ Roadmap

- [ ] **LLM Integration**: Plug in Llama 3 / GPT-4 for advanced summarization
- [ ] **Multi-language**: Hindi, Tamil, Bengali, Marathi translations
- [ ] **WhatsApp Bot**: Deliver alerts via WhatsApp Business API
- [ ] **Mobile App**: React Native companion app
- [ ] **Voice Interface**: Speech-to-text for rural users
- [ ] **Aadhaar Integration**: Direct scheme application with eKYC
- [ ] **PostgreSQL Migration**: Production-grade database
- [ ] **Redis Caching**: Sub-millisecond response times
- [ ] **Kubernetes Deployment**: Auto-scaling on AMD EPYC clusters

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 👥 Team

**CivicLens AI** — Built for the hackathon with ❤️ for India's 1.4B citizens.

---

<p align="center">
  <strong>🇮🇳 Making governance accessible, one scheme at a time.</strong><br/>
  <em>Powered by AMD EPYC · Built with FastAPI + React</em>
</p>
