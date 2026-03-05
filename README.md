# ⚖️ NivaranAI — AI-Powered Citizen Grievance Redressal Platform

> A full-stack platform that uses Machine Learning and NLP to automatically classify, prioritize, and route citizen complaints to the correct government department — in seconds.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![Django](https://img.shields.io/badge/Django-5.x-green?style=flat-square&logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📌 Overview

NivaranAI is a smart governance platform built to bridge the gap between citizens and government departments. Instead of complaints getting lost in bureaucracy, the AI pipeline reads each complaint, scores its urgency, detects the language and sentiment, and routes it to the right department automatically — with full transparency for the citizen at every step.

---

## ✨ Key Features

- **🤖 AI Auto-Classification** — TF-IDF + Random Forest classifies complaints into 11 government department categories
- **🧠 NLP Preprocessing Pipeline** — Language detection (LangDetect), sentiment analysis (TextBlob), rule-based urgency scoring (0–100)
- **⚡ Emergency Override** — Critical keywords (heart attack, fire, accident) bypass ML and trigger CRITICAL priority instantly
- **🌐 Multilingual Support** — Accepts 10+ Indian languages including Hinglish
- **🎤 Voice Input** — Web Speech API lets citizens speak complaints directly in the browser (no third-party API)
- **📊 Live Analytics Dashboard** — Real-time charts (status, priority, 14-day trend, department workload) using Recharts
- **🔐 JWT Authentication** — Role-based access for Citizens, Officers, and Admins
- **🤖 RAG Chatbot** — DeepSeek LLM answers policy questions from real government documents using FAISS semantic search
- **📍 Complaint Tracking** — Full timeline with timestamps visible to the citizen in real time

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite + TypeScript)       │
│  LoginPage · HomePage · ComplaintsPage · TrackingPage        │
│  OfficerPage · AdminPage · DashboardPage · ChatbotPage       │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (Axios + JWT)
┌────────────────────────▼────────────────────────────────────┐
│                   Django REST Framework                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  complaints/ │  │    users/    │  │   departments/   │  │
│  │  ViewSet     │  │  ViewSet     │  │   ViewSet        │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │              AI / NLP Pipeline                      │    │
│  │  preprocess.py → TextBlob · LangDetect · Rules      │    │
│  │  classifier.py → TF-IDF + Random Forest             │    │
│  │  rag_chain.py  → FAISS + SentenceTransformer        │    │
│  │  llm.py        → DeepSeek (Ollama) / WatsonX IBM    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│                     SQLite → Firebase (prod)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
AI-Grievance-Redressal-System/
├── backend/
│   ├── config/              # Django settings, urls, wsgi
│   ├── complaints/          # Complaint model, views, serializers, AI pipeline
│   │   ├── services/
│   │   │   ├── preprocess.py    # NLP preprocessing (sentiment, urgency, language)
│   │   │   ├── classifier.py    # TF-IDF + Random Forest
│   │   │   ├── retriever.py     # FAISS semantic search
│   │   │   └── rag_chain.py     # RAG chain (context + LLM)
│   ├── users/               # Custom User model, JWT auth, signup
│   ├── departments/         # Department, DepartmentUser models
│   ├── chatbot/             # RAG chatbot views
│   ├── analytics/           # Aggregation queries for dashboard
│   └── contact/             # Contact form email endpoint
│
└── frontend/
    ├── src/
    │   ├── pages/           # LandingPage, LoginPage, HomePage, ...
    │   ├── components/      # Layout, Badge, ProtectedRoute
    │   ├── api/             # Axios client, complaints.ts, auth.ts
    │   ├── hooks/           # useAuth context
    │   └── types/           # TypeScript types, speech.d.ts
    └── public/
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/AyushSamant/AI-Grievance-Redressal-System.git
cd AI-Grievance-Redressal-System
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install Three.js (for landing page particle animation)
npm install three @types/three

# Start dev server
npm run dev
```

App runs at → **http://localhost:5173**  
API runs at → **http://localhost:8000**

---

## 🔐 Environment Variables

Create `backend/config/.env`:

```env
SECRET_KEY=your-django-secret-key-here
DEBUG=True

# Email (Gmail SMTP)
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=NivaranAI <your-gmail@gmail.com>

# Database (leave blank for SQLite default)
DATABASE_URL=
```

> ⚠️ **Never commit `.env` to GitHub.** It is already in `.gitignore`.

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Citizen** | File complaints, track status, use AI chatbot |
| **Officer** | View and update complaints assigned to their department |
| **Admin** | Full access — manage users, departments, view all complaints and analytics |

### Default Test Accounts (after `createsuperuser`)

Create additional accounts via `/admin` or the Signup page.

---

## 🧠 AI Pipeline — How It Works

```
Complaint Text
      │
      ▼
preprocess_text()
  ├── detect_language()     → LangDetect (en, hi, ...)
  ├── sentiment()           → TextBlob polarity → positive/neutral/negative
  └── urgency_score()       → Rule-based keyword scan → score 0–100 → priority
      │ CRITICAL keywords bypass ML entirely
      ▼
classify_complaint()
  └── TF-IDF vectorizer → Random Forest → Department label
      │
      ▼
Complaint saved with:
  department, priority, urgency_score, sentiment_label, language
```

**Emergency keyword examples:** `heart attack`, `fire`, `accident`, `blood`, `unconscious`  
These immediately set `priority = CRITICAL` and `urgency_score = 100` regardless of ML output.

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/token/` | Login — returns JWT access + refresh tokens |
| `POST` | `/api/users/signup/` | Register new account |
| `GET` | `/api/users/me/` | Get current user info |
| `GET` | `/api/complaints/` | List complaints (role-filtered) |
| `POST` | `/api/complaints/` | File a new complaint |
| `POST` | `/api/complaints/{id}/status/` | Update complaint status (Officer/Admin) |
| `POST` | `/api/complaints/{id}/assign/` | Assign department (Admin) |
| `GET` | `/api/analytics/overview/` | Dashboard analytics data |
| `POST` | `/api/chatbot/ask/` | Ask AI chatbot a policy question |
| `POST` | `/api/contact/` | Send contact form email |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django 5 + DRF | REST API framework |
| SimpleJWT | JWT authentication |
| TextBlob | Sentiment analysis |
| LangDetect | Language detection |
| Scikit-learn | TF-IDF + Random Forest classification |
| SentenceTransformers | Semantic embeddings for RAG |
| FAISS | Vector similarity search |
| DeepSeek / WatsonX | LLM for chatbot responses |
| SQLite / Firebase | Database |
| python-dotenv | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| Recharts | Analytics charts |
| Three.js | Particle text animation (landing page) |
| Web Speech API | Voice input (browser-native) |

---

## 📸 Screenshots

> Add screenshots here after deploying

| Landing Page | Dashboard | Officer Panel |
|---|---|---|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## 🔄 Status Workflow

```
SUBMITTED → AI_PROCESSED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
                                   ↘                          ↘
                                    REJECTED                  REJECTED
```

Officers can only move complaints forward through defined transitions. Terminal states (`CLOSED`, `REJECTED`) cannot be updated further.

---

## 📬 Contact

**Ayush Samant**  
📧 ayushsamant01@gmail.com  
🐙 [github.com/AyushSamant](https://github.com/AyushSamant)

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ for smarter, more transparent governance.</strong>
</div>
