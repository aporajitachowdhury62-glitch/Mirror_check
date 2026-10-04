<<<<<<< HEAD
# Mirror Check 🪞

> *"Check your blind spot before you switch lanes."*

Mirror Check is an AI-powered Socratic thinking companion designed to help engineers, leaders, and creators examine their doubts about learning new skills or making career pivots.

Rather than acting as an advice engine that tells you what to do, **Mirror Check strictly surfaces your unstated assumptions, highlights blind spots, and formulates non-judgmental inquiry questions** so you can find genuine clarity on your own terms.

---

## 🎯 Core Philosophy: Why Mirror Check Never Gives Verdicts

Traditional AI tools often rush to dispense prescriptive advice (*"You should definitely learn Rust in 2026"* or *"Don't bother with Management"*). This triggers two major failure modes:
1. **Decision Outsourcing**: You follow external consensus without examining your personal constraints, strengths, or energy.
2. **False Reassurance**: Surface-level optimism masks deep structural friction (e.g. lack of bandwidth, tech FOMO, or fear of obsolescence).

### The Socratic Mirror Principle
- **No Advice, No Commands, No Verdicts**: The system will never say *"I recommend"*, *"You should"*, *"It is worth it"*, or *"You must"*.
- **Assumptions First**: Every doubt stems from implicit beliefs about career survival, time cost, or identity. Mirror Check reflects these back as a mirror.
- **Automated Non-Prescriptive Guardrail**: Every AI generation passes through a two-stage evaluation (regex heuristic filter + structured Gemini guardrail validator) to ensure responses remain strictly observational, neutral, and inquiry-focused.

---

## 🗺️ The 5-Screen Socratic Journey

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ Screen 1     │ ──> │ Screen 2       │ ──> │ Screen 3         │
│ Frame Doubt  │     │ Tag Beliefs    │     │ Blind Spots      │
│ (Slider 0-100)│    │ (Know/Guess/?) │     │ (Questions & Notes)│
└──────────────┘     └────────────────┘     └──────────────────┘
                                                     │
                                                     ▼
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ 30-Day Due   │ <── │ Screen 5       │ <── │ Screen 4         │
│ Check-in     │     │ 2-Hr Sandbox   │     │ Conviction Shift │
│ (Hype/Drift) │     │ (Calendar/Txt) │     │ & Mirror Stats   │
└──────────────┘     └────────────────┘     └──────────────────┘
```

1. **Screen 1 — Frame Your Doubt (`AskScreen`)**:
   - Enter the skill or transition under consideration and describe what is causing hesitation.
   - Set your gut conviction on an interactive `0–100%` confidence slider.
2. **Screen 2 — Surface Your Assumptions (`BeliefsScreen`)**:
   - Calls `/api/beliefs` to reveal 4–6 hidden mental models.
   - Categorize each belief as **Know** (direct proof), **Guess** (working hypothesis), or **Not sure** (untested blind spot).
   - Progression is unlocked only when all assumptions are categorized.
3. **Screen 3 — What You Might Have Missed (`QuestionsScreen`)**:
   - Calls `/api/questions` to probe five critical dimensions: *Goal, Deadline & Urgency, Trade-offs & Sacrifices, Transferable Skills, and Root Doubt*.
   - Includes concise note textareas (skipping is completely permitted).
4. **Screen 4 — Your Thinking in the Mirror (`MirrorScreen`)**:
   - Side-by-side comparison of your initial conviction vs. post-examination conviction with live change delta (+/- points).
   - Quantified summary (e.g., *"3 of 5 beliefs are guesses, 1 is an untested blind spot"*).
   - 2–3 deep reflective prompts on internal motivation and definition of mastery from `/api/reflect`.
5. **Screen 5 — Your 2-Hour Sandbox Test (`ExperimentScreen`)**:
   - Calls `/api/experiment` to formulate a low-risk, hands-on 2-hour taste test (*Setup ~20m, Build & Explore ~70m, Debrief ~30m*).
   - **Save Reasoning**: Stores full session locally with an automated 30-day reflection date.
   - **Google Calendar Integration**: One-click reminder URL to schedule a 30-day reflection.
   - **Download .txt**: Exports a formatted summary report.
6. **30-Day Check-in System (`CheckinBanner` & `CheckinModal`)**:
   - When a saved session reaches 30+ days, a banner appears on Screen 1.
   - Calls `/api/checkin` to run a **Hype & Drift Check** (*questions only, no advice*) to see if peer pressure or urgency has changed.

---

## 🏗️ Architecture & Technology Stack

```
Mirror_check/
├── backend/                  # FastAPI Socratic Intelligence Engine
│   ├── app/
│   │   ├── core/             # Configuration, CORS, rate limits, security headers
│   │   ├── routers/          # REST endpoints (/api/beliefs, /questions, /reflect, /experiment, /checkin)
│   │   ├── schemas.py        # Strict Pydantic models and request validation
│   │   └── services/         # Gemini 2.5 Flash SDK client & Socratic guardrail pipeline
│   ├── tests/                # 42 comprehensive pytest test cases
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend configuration template
│
├── frontend/                 # Next.js 16 (App Router) + Tailwind CSS UI
│   ├── src/
│   │   ├── app/              # App router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/       # Screens (Ask, Beliefs, Questions, Mirror, Experiment, Checkin) & UI kit
│   │   ├── lib/              # Typed API client, localStorage persistence, Google Calendar builder
│   │   └── types/            # TypeScript interfaces & domain models
│   ├── tests/                # 25 Vitest unit & integration tests
│   ├── package.json          # Node dependencies
│   └── .env.example          # Frontend configuration template
│
├── render.yaml               # Render deployment blueprint for Backend
└── README.md                 # Project documentation
```

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Async Python 3.12+)
- **LLM Engine**: Google Gemini 2.5 Flash via official `google-genai` SDK
- **Validation**: [Pydantic V2](https://docs.pydantic.dev/) with `extra="forbid"` and strict string boundary constraints
- **Security & Reliability**: SlowAPI rate limiting, security headers (CSP, HSTS, X-Content-Type-Options), and safe error sanitization
- **Testing**: Pytest + Pytest-Asyncio + HTTPX test client

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language & Styling**: TypeScript 5 + Tailwind CSS v4 (Glassmorphic dark design)
- **Typography**: Google Fonts (`Plus_Jakarta_Sans` & `JetBrains_Mono` via `next/font/google`)
- **Icons**: Lucide React
- **Accessibility**: WCAG AA contrast, keyboard navigation, visible focus rings, ARIA radiogroups, live regions (`aria-live="polite"`), and screen-reader slider descriptors (`aria-valuetext`)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library + JSDOM

---

## 🌐 How Google Services Are Used

1. **Google Gemini API (`gemini-2.5-flash`)**:
   - Generates structured JSON outputs according to strict Pydantic schemas.
   - Powers the 2-stage Socratic guardrail evaluator to detect and neutralize any accidental prescriptive wording or advice.
   - Built using the official `@google/genai` Python SDK (`google-genai`).

2. **Google Calendar Event Integration**:
   - Generates standard UTC RFC-5545 compatible calendar template links (`https://calendar.google.com/calendar/render?...`).
   - Schedules a 30-day reminder with original inquiry context, confidence change metrics, and reflection prompts.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | `""` | Google Gemini API Key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |
| `GEMINI_TIMEOUT_SECONDS` | No | `15.0` | API request timeout in seconds |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed comma-separated origins |
| `RATE_LIMIT_PER_MINUTE` | No | `60/minute` | Rate limit per client IP |
| `CACHE_TTL_SECONDS` | No | `300` | In-memory cache TTL for identical inquiries |
| `ENVIRONMENT` | No | `development` | Deployment environment (`development` / `production`) |

### Frontend (`frontend/.env.local`)
| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | No | `http://127.0.0.1:8000` | Base URL of the backend FastAPI service |

---

## 🚀 Local Development Setup

### Prerequisites
- **Python**: 3.11, 3.12, or 3.14
- **Node.js**: v18+ (v20+ recommended)
- **Gemini API Key**: [Get a Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux:
# python -m venv .venv && source .venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and insert your GEMINI_API_KEY=your_key_here

# Start the FastAPI server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend will be live at:
- **API**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start the Next.js development server
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

## 🧪 Running Automated Tests

### Backend Tests (`pytest`)
Runs unit, integration, validation, rate limiting, and Socratic guardrail test suites:
```bash
cd backend
.\.venv\Scripts\python -m pytest -v
```
*Expected: 42 passed in ~0.5s*

### Frontend Tests (`vitest`)
Runs belief tagging completion logic, typed API client with retries, Google Calendar URL builder, and 30-day check-in threshold tests:
```bash
cd frontend
npm run test
```
*Expected: 25 passed across 4 test suites*

---

## 🚢 Deployment Guide

### Deploy Backend to Render
1. Connect your repository to [Render](https://render.com/).
2. Create a new **Web Service** using the root `render.yaml` blueprint, or configure manually:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. In the Render Dashboard, add the environment variable:
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`

### Deploy Frontend to Vercel
1. Import the repository into [Vercel](https://vercel.com/).
2. Set the **Root Directory** to `frontend`.
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-render-backend.onrender.com`
4. Click **Deploy**.

---

## 🔒 Security & Privacy Notes
- **Zero Client-Side Secrets**: `GEMINI_API_KEY` is strictly encapsulated on the backend; the browser only communicates with the backend proxy.
- **Client-Side Storage**: All user reasoning, notes, and reflection history are stored exclusively in the user's browser `localStorage`. No user reasoning is persisted to a remote database.
- **Input Sanitization & Bounds**: Enforced 100-character caps on skill titles and 1,000-character bounds on context to prevent prompt injection and resource abuse.

---

## 📄 License
MIT License. Free for personal and commercial exploration.
=======
# Mirror_check
>>>>>>> 3115b409e6ee91d9b94f9ef27e4f39fb3568dbb3
