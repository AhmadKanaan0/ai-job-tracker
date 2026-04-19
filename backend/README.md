# JobHunt Backend 🚀

AI-powered job search backend built with **FastAPI + PostgreSQL + Claude API**.

## Features

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | `/auth/*` | Register, login, JWT tokens |
| **CV** | `/cv/*` | Upload PDF/DOCX, auto-parse text, manage versions |
| **Jobs** | `/jobs/*` | Search across 6+ portals, paste any job URL to scrape |
| **Tracker** | `/tracker/*` | Full pipeline tracker (saved → offer), stats dashboard |
| **Analysis** | `/analyze/*` | AI match score, ATS score, CV fix (powered by Claude) |
| **Cover Letter** | `/cover-letter/*` | Generate tailored cover letters in 3 tones |

## Job Sources

| Source | Method | API Key needed? |
|---|---|---|
| We Work Remotely | Scraping | No |
| Remotive | Public JSON API | No |
| RemoteOK | Public JSON API | No |
| Himalayas | Public JSON API | No |
| Greenhouse | Company JSON API | No |
| Lever | Company JSON API | No |
| Ashby | Scraping | No |
| LinkedIn | JSearch RapidAPI | Yes (free tier) |
| Indeed | JSearch RapidAPI | Yes (free tier) |

---

## Quick Start (Local)

### 1. Prerequisites

- Python 3.11+
- PostgreSQL running locally
- An [Anthropic API key](https://console.anthropic.com)

### 2. Install

```bash
cd job-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL  — your postgres connection string
#   ANTHROPIC_API_KEY — your Claude API key
#   SECRET_KEY — any random string (generate with: openssl rand -hex 32)
```

### 4. Set up the database

```bash
# Create the database in postgres first:
createdb jobhunt

# Run migrations (or let the app auto-create tables on first start):
alembic upgrade head
```

### 5. Run

```bash
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for the interactive API docs.

---

## API Usage Examples

### Register & Login
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123"}'

# Login — returns JWT token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "secret123"}'
```

### Upload your CV
```bash
curl -X POST http://localhost:8000/cv/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your-cv.pdf"
```

### Search Jobs
```bash
curl -X POST http://localhost:8000/jobs/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "python backend engineer", "remote_only": true, "limit": 20}'
```

### Paste a Job URL
```bash
curl -X POST http://localhost:8000/jobs/scrape \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://jobs.lever.co/openai/some-job-id"}'
```

### Full AI Analysis (match score + ATS + interview prep)
```bash
curl -X POST http://localhost:8000/analyze/full \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "cv_id": 1}'
```

### Fix CV for a Job
```bash
curl -X POST http://localhost:8000/analyze/fix-cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "cv_id": 1}'
```

### Generate Cover Letter
```bash
curl -X POST http://localhost:8000/cover-letter/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "cv_id": 1, "tone": "professional"}'
```

### Track a Job Application
```bash
# Add to tracker
curl -X POST http://localhost:8000/tracker/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": 1, "status": "applied", "notes": "Applied via company website"}'

# Update status
curl -X PATCH http://localhost:8000/tracker/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "interview", "next_action": "Prepare system design questions"}'

# Get pipeline stats
curl http://localhost:8000/tracker/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Project Structure

```
job-backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── core/
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   └── security.py          # JWT + password hashing
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── cv.py
│   │   ├── job.py
│   │   ├── tracker.py
│   │   ├── cover_letter.py
│   │   └── analysis.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── auth.py
│   │   └── jobs.py
│   ├── routers/                 # API route handlers
│   │   ├── auth.py
│   │   ├── cv.py
│   │   ├── jobs.py
│   │   ├── tracker.py
│   │   ├── analyze.py
│   │   └── cover_letter.py
│   └── services/                # Business logic
│       ├── ai_service.py        # All Claude API calls
│       ├── scraper.py           # Job portal scrapers
│       ├── cv_parser.py         # PDF/DOCX text extraction
│       └── storage.py           # Local or S3 file storage
├── alembic/                     # DB migrations
├── requirements.txt
├── .env.example
└── README.md
```

---

## Adding LinkedIn / Indeed (Optional)

1. Sign up at [RapidAPI](https://rapidapi.com/letscrape-6baf62af1c/api/jsearch)
2. Get your free API key (200 req/month free)
3. Add to `.env`:
   ```
   JSEARCH_API_KEY=your-rapidapi-key
   ```
4. In your search request, add `"sources": ["linkedin", "indeed"]`

---

## Deploying Later

When you're ready to go live:

| Service | Replace with |
|---|---|
| Local PostgreSQL | Supabase (free tier) |
| Local file storage | Cloudflare R2 (free 10 GB) |
| `uvicorn` on laptop | Railway or Render (free tier) |

Just update the env vars — no code changes needed.
