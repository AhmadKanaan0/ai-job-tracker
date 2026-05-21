# AI Job Tracker & Career Agent

An all-in-one intelligent career agent that automates job discovery, analyzes resume compatibility, generates personalized application materials, and manages your full application pipeline. Powered by a Next.js frontend and a FastAPI backend with support for multiple AI providers.

---

## Features

| Module | Description |
| :--- | :--- |
| **Job Discovery** | Profile-based auto-search on startup across 22 job portals simultaneously. Filter by source, location, role, level, type, workplace, date, experience. Tabs for Liked, Applied, and ATS Board jobs. |
| **Job Import** | Bulk-import jobs from a `.json` or `.csv` file. Flexible field mapping handles any common column naming convention. |
| **AI Analysis** | Match score, skills gap, level strategy, ATS issues, personalization tips, and interview prep — all generated per job/CV pair. |
| **CV Diff Viewer** | Structured before → after change plan per CV section (rewrite / add / remove / keyword). Priority-ranked, accept or dismiss per change. |
| **Posting Legitimacy** | AI flags ghost listings, missing salary, suspicious patterns. Verdict: Verified / Caution / Suspicious — shown inline on job cards. |
| **Pipeline Board** | Stats cards, status distribution bar, sortable table with inline status updates, CV and Report actions per row. |
| **Reports** | Full career-ops style evaluation report per job: role summary, matched/missing skills, level strategy, CV diff, ATS issues, interview questions, legitimacy signals. |
| **Cover Letter Generator** | Tailored cover letters in Professional, Friendly, or Concise tone. |
| **CV Manager** | Upload PDF or DOCX, auto-extract profile via AI, maintain multiple CV versions. |
| **Application Tracker** | Track applications from Saved → Applied → Screening → Interview → Final Round → Offer / Rejected. |

---

## Job Sources (22 portals)

| Type | Portals |
| :--- | :--- |
| **JSON APIs** | We Work Remotely, Remotive, RemoteOK, Himalayas, Working Nomads, HN Who's Hiring (Algolia), YC Work at a Startup |
| **ATS Boards** | Greenhouse, Lever, Ashby, Workable |
| **HTML Scrapers** | ai-jobs.net, EU Remote Jobs, Nodesk, Truly Remote, Forward Deploy, Welcome to the Jungle, TrueUp, Remote Rocketship, DevRel Job |
| **Spain** | Getmanfred, Tecnoempleo, JobFluent |
| **Via JSearch API** | LinkedIn, Indeed + expanded `site:` WebSearch across all portals above |

All sources run in parallel via `asyncio.gather`. Failed sources return `[]` silently without affecting others.

---

## Tech Stack

### Frontend
- **Next.js 16.2** (React 19, App Router) — TypeScript
- **TanStack Query v5** — server state & caching
- **Tailwind CSS v4** + **Radix UI / shadcn**
- **Recharts** — analytics charts
- **Lucide React** — icons
- **Sonner** — toasts

### Backend
- **FastAPI 0.115** + **Uvicorn**
- **PostgreSQL** + **SQLAlchemy 2.0** ORM + **Alembic** migrations
- **AI providers** (switchable via `AI_PROVIDER` env var):
  - Claude — `claude-3-5-sonnet-20240620`
  - Gemini — `gemini-3-flash-preview`
  - DeepSeek — `deepseek-chat` (OpenAI-compatible)
- **Scraping** — HTTPX + BeautifulSoup4 + Playwright (SPA fallback)
- **Document parsing** — PDFPlumber + python-docx
- **Auth** — JWT (python-jose) + bcrypt (Passlib)
- **File storage** — local or S3/Cloudflare R2 (Boto3)

---

## Project Structure

```
ai-job-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, router mounts
│   │   ├── core/                # DB, security, settings
│   │   ├── models/              # SQLAlchemy models (User, CV, Job, Tracker, Analysis)
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API endpoints
│   │   └── services/            # AI, scraper, CV parser, storage
│   ├── alembic/                 # Migration history
│   ├── migrate_add_columns.py   # One-time column additions (run after alembic)
│   ├── uploads/                 # Local file storage
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard home (KPIs, pipeline, activity)
│   │   │   ├── discovery/       # Job discovery feed + detail
│   │   │   ├── analyzer/        # AI job analyzer
│   │   │   ├── pipeline/        # Pipeline board
│   │   │   ├── tracker/         # Application tracker
│   │   │   ├── reports/         # Analysis reports list + detail
│   │   │   ├── cv-manager/      # CV upload and management
│   │   │   └── profile/         # User profile & settings
│   ├── components/job-tracker/  # All page components
│   ├── hooks/                   # React Query hooks
│   └── lib/                     # API client, types, utils
└── README.md
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL
- Redis (optional — only needed for Celery async tasks)

---

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium
```

Copy and configure environment variables:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/jobhunt

# AI provider: "claude", "gemini", or "deepseek"
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your-key

# Optional: LinkedIn / Indeed via RapidAPI JSearch
JSEARCH_API_KEY=your-rapidapi-key
```

Create the database and run migrations:

```bash
# Create schema (tables)
alembic upgrade head

# Add columns to existing tables (safe to run multiple times)
python migrate_add_columns.py
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
# Swagger docs → http://localhost:8000/docs
```

---

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
# App → http://localhost:3000
```

---

## Job Import Format

**JSON** (`/jobs/import`):
```json
[
  {
    "title": "Senior Software Engineer",
    "company": "Acme Corp",
    "url": "https://example.com/jobs/123",
    "location": "Remote",
    "description": "...",
    "salary_min": 120000,
    "salary_max": 160000,
    "tags": ["python", "fastapi", "postgresql"]
  }
]
```

**CSV** — any of these column names are recognized automatically:
`title` / `job_title` / `position`, `company` / `employer`, `url` / `link` / `apply_url`, `description` / `job_description`, `salary_min` / `min_salary`, `salary_max` / `max_salary`, `tags` / `skills` (comma-separated)

---

## Multi-Level Discovery Architecture

1. **Level 1 — Visual (Playwright)**: renders JS-heavy SPAs (e.g. Workday) headlessly
2. **Level 2 — ATS JSON APIs**: Greenhouse, Lever, Ashby, Workable — structured feeds, no tokens needed
3. **Level 3 — JSearch WebSearch**: LinkedIn, Indeed + `site:` filtered search across all 22 portals (requires RapidAPI key)

---

## Deployment

| Service | Development | Production |
| :--- | :--- | :--- |
| Database | PostgreSQL local | Supabase / Neon |
| File storage | Local `/uploads` | Cloudflare R2 or AWS S3 |
| Backend | Uvicorn local | Railway / Render / AWS ECS |
| Frontend | Next.js dev server | Vercel |
