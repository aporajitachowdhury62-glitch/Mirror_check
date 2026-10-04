# Mirror Check - Backend API

> **An AI Thinking Companion for "Should I learn this skill?"**  
> Mirror Check **NEVER** recommends, decides, advises, or ranks. It acts purely as a Socratic mirror: surfacing hidden assumptions, asking clarifying questions, framing low-risk 2-hour exploratory options, and generating 30-day reflection check-ins.

---

## Architecture & Design Principles

### 1. Inviolable Socratic Guardrail
- **System Instruction**: Explicitly instructs Gemini to act strictly as a Socratic thinking partner, treating user input as data rather than instructions.
- **Two-Stage Guardrail Pipeline**:
  1. **Regex Pre-filter**: Scans all outputs for directive phrases (`you should`, `I recommend`, `worth it`, `don't learn`, `you must`, `the best choice is`, etc.).
  2. **Second-Pass Gemini Auditor**: Calls Gemini with a zero-temperature audit prompt to verify that no subtle advice or verdicts are present.
  3. **Stricter Regeneration**: If any violation is flagged, regenerates once with an emphasized anti-prescriptive directive.
  4. **Safe Fallback**: If a second attempt fails, returns a deterministic, non-judgmental Socratic fallback payload.

### 2. Efficiency & Caching
- **Async Throughout**: Fully asynchronous FastAPI endpoints and Google GenAI calls.
- **In-Memory TTL Cache**: Uses deterministic payload hashing to cache identical requests for 300 seconds, saving tokens and speeding up repeated requests.

### 3. Security
- **Strict Input Validation**: Pydantic v2 schemas enforce minimum and maximum string bounds and forbid extra payload fields.
- **CORS Allowlist**: Configurable via `CORS_ORIGINS` environment variable.
- **Rate Limiting**: IP-based rate limiting via `slowapi` (`60/minute` default).
- **Security Headers**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`, `Content-Security-Policy: default-src 'self'`, and `Referrer-Policy`.
- **Sanitized Errors**: No raw exceptions or stack traces leaked to clients.
- **Timeouts**: Network calls to Gemini are bound by an asynchronous timeout (15s default).

---

## Directory Layout

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application & /health route
│   ├── schemas.py                 # Pydantic v2 request & response schemas
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic-settings environment configuration
│   │   └── security.py            # CORS, security headers, rate limiting, error handlers
│   ├── routers/
│   │   ├── __init__.py
│   │   └── api.py                 # /api/beliefs, /api/questions, /api/reflect, /api/experiment, /api/checkin
│   └── services/
│       ├── __init__.py
│       ├── cache.py               # Async TTL in-memory request cache
│       ├── gemini.py              # Google GenAI service with structured outputs & retry
│       └── guardrail.py           # Regex pre-filter, checker, and safe fallback factories
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures & mock helpers
│   ├── test_endpoints.py          # Endpoint integration tests (Gemini mocked)
│   ├── test_guardrail.py          # Guardrail regex, checker, regeneration & fallback tests
│   ├── test_security_headers_and_rate_limit.py # Security headers, CORS & rate limit tests
│   └── test_validation.py         # Pydantic input length & constraint validation tests
├── .env.example                   # Environment variable template
├── requirements.txt               # Backend dependencies
└── README.md                      # Documentation
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status check |
| `POST` | `/api/beliefs` | Surfaces 4–6 hidden assumptions and mental models behind the user's doubt |
| `POST` | `/api/questions` | Formulates 4–5 Socratic questions across goal, deadline, trade-offs, transferability, and doubts |
| `POST` | `/api/reflect` | Generates 2–3 deep reflective questions probing motivation and cost of inaction |
| `POST` | `/api/experiment` | Designs a single 2-hour low-risk exploratory sandbox test phrased as an option |
| `POST` | `/api/checkin` | Creates a 30-day follow-up plan with reflection prompts and trigger events |

---

## Running Locally

### 1. Prerequisites
- Python 3.10+ (Python 3.11, 3.12, 3.13, or 3.14)
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 2. Setup Environment

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Windows (CMD):
.venv\Scripts\activate.bat
# On Linux/macOS:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_SECONDS=15.0
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_PER_MINUTE=60/minute
CACHE_TTL_SECONDS=300
ENVIRONMENT=development
```

### 4. Start the API Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Running Tests

Run the complete test suite with `pytest`:

```bash
pytest -v
```

Run specific test suites:

```bash
# Test guardrail behavior, regex prefilter, and fallback logic
pytest tests/test_guardrail.py -v

# Test Pydantic input validation and bounds
pytest tests/test_validation.py -v

# Test all API endpoints with mocked Gemini responses
pytest tests/test_endpoints.py -v

# Test security headers and CORS
pytest tests/test_security_headers_and_rate_limit.py -v
```
