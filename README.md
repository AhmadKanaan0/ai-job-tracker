# AI Job Tracker & Career Agent 🚀

An all-in-one, intelligent career agent designed to automate job discovery, analyze resume compatibility, generate personalized application materials, and manage your application pipeline. Powered by a Next.js frontend and a FastAPI backend with support for multiple AI models (Claude, Gemini, DeepSeek).

---

## 🎨 System Features

| Module | Core Functionality | Details & Integrations |
| :--- | :--- | :--- |
| **🔍 Multi-Level Job Discovery** | Visual Scraping, ATS API Scanning, & Global Search | Scrapes directly from **We Work Remotely**, **Remotive**, **RemoteOK**, **Himalayas**, and company ATS platforms (**Greenhouse**, **Lever**, **Ashby**). Falls back to **Playwright** for visual scraping of Javascript-heavy job boards like Workday. |
| **📊 ATS & Fit Analysis** | Multi-Provider AI Scoring & Feedback | Analyzes CV compatibility against any job description, yielding match scores, level strategy, keyword gaps, formatting issues, personalization tips, and custom interview prep questions. |
| **📄 CV Parser & Manager** | Multi-Format Document Parsing & Versioning | Upload CVs (`.pdf` or `.docx`), auto-extract profile details via AI for onboarding, and maintain historical versions of targeted CVs. |
| **✍️ Cover Letter Generator** | Tailored application writing | Generates highly personalized cover letters highlighting candidate credentials directly aligned with the job requirements. Supports **Professional**, **Friendly**, and **Concise** tones. |
| **📋 Kanban Tracker & Analytics**| Pipeline tracking & analytics | Visual board tracking application stages from Saved → Applied → Interviewing → Offer → Rejected. Features analytics charts powered by Recharts. |

---

## 🛠️ Technology Stack

The project is structured as a monorepo featuring a decoupled frontend client and backend API server.

### Frontend
* **Core Framework**: [Next.js 16.2](https://nextjs.org/) (React 19) with TypeScript
* **State Management & Caching**: [React Query (TanStack Query v5)](https://tanstack.com/query/latest)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Component Library**: [Radix UI primitives](https://www.radix-ui.com/) with customized Premium components (Shadcn CSS UI)
* **Form & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
* **Analytics & Charts**: [Recharts](https://recharts.org/)
* **Markdown Rendering**: [React Markdown](https://github.com/remarkjs/react-markdown) & [Remark GFM](https://github.com/remarkjs/remark-gfm)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Toasts & Feedback**: [Sonner](https://emilkowalski.github.io/sonner/)

### Backend
* **API Framework**: [FastAPI (0.115.0)](https://fastapi.tiangolo.com/) with Uvicorn standard server
* **Database & Migrations**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.0 ORM](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/) migrations
* **AI Provider Suite**: Multi-engine wrapper supporting:
  * **Claude** (Anthropic API `claude-3-5-sonnet-20240620`)
  * **Gemini** (Google GenAI API `gemini-3-flash-preview`)
  * **DeepSeek** (DeepSeek API `deepseek-chat` via OpenAI SDK client compatibility)
* **Scraping Engine**:
  * Visual JS-rendering fallback using **Playwright**
  * Raw HTML parser using **BeautifulSoup4**
  * Direct HTTP integrations using **HTTPX**
* **Document Extraction**: **PDFPlumber** for resumes, **python-docx** for Word documents
* **Auth**: **JWT Tokens** with **python-jose** (cryptography) and **Passlib** (bcrypt)
* **Task Queues**: **Celery** with **Redis** for asynchronous processing
* **File Storage**: Local directory storage with toggleable fallback to **Amazon S3 / Cloudflare R2** via **Boto3**

---

## 📂 Project Structure

```text
ai-job-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app setup, middleware, router mounts
│   │   ├── core/                # DB connections, Security, Pydantic settings
│   │   ├── models/              # SQLAlchemy DB models (User, CV, Job, Tracker, Analysis)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── routers/             # API endpoint definitions
│   │   └── services/            # Core business logic (AI, Parser, Scraper, Storage)
│   ├── alembic/                 # Alembic DB migration environment and history
│   ├── uploads/                 # Local uploads storage directory (if enabled)
│   ├── .env.example             # Template for backend settings
│   └── requirements.txt         # Python package dependencies
├── frontend/
│   ├── app/                     # Next.js App Router (Dashboard, Onboarding, Auth, Setup)
│   ├── components/              # Shared UI and page-specific React components
│   ├── hooks/                   # Custom React hooks (React Query integrations)
│   ├── lib/                     # API utility clients and helper functions
│   ├── styles/                  # Tailwind CSS setups and global styles
│   ├── package.json             # Frontend package declarations
│   └── tsconfig.json            # TypeScript configuration
├── test_apis.py                 # Scraping test script for Greenhouse/Ashby APIs
└── README.md                    # Root project documentation
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Python 3.11+**
* **Node.js 18+** & **npm** (or yarn/pnpm)
* **PostgreSQL** running locally or a remote instance (e.g., Supabase)
* **Redis** (optional, required if using Celery async worker features)

---

### 2. Backend Setup

1. **Navigate to the backend directory and create a virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   * **Windows (PowerShell/CMD):**
     ```powershell
     venv\Scripts\activate
     ```
   * **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

3. **Install python packages:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Playwright dependencies (for level-1 visual scraping fallback):**
   ```bash
   playwright install chromium
   ```

5. **Configure environment variables:**
   Copy the example file and populate it with your database and API keys:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to configure your database connection and chosen AI engine:
   ```env
   # Setup database connection
   DATABASE_URL=postgresql://postgres:password@localhost:5432/jobhunt
   
   # Toggle preferred AI provider: "claude", "gemini", or "deepseek"
   AI_PROVIDER=claude
   ANTHROPIC_API_KEY=your-api-key-here
   
   # Optional: LinkedIn/Indeed search via RapidAPI JSearch
   JSEARCH_API_KEY=your-rapidapi-key
   ```

6. **Prepare the database & run migrations:**
   Create a database named `jobhunt` inside your PostgreSQL database server, then upgrade schema:
   ```bash
   alembic upgrade head
   ```

7. **Launch the backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   * Interactive OpenAPI documentation is accessible at **`http://localhost:8000/docs`**.

---

### 3. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure client environment variables:**
   Verify or create a `.env.local` containing:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```
   * The client app is accessible at **`http://localhost:3000`**.

---

## 🦾 Multi-Level Job Discovery System

Our ingestion pipeline runs on a 3-tier architecture:
1. **Level 1 (Visual Scraper)**: Playwright automates Visual Browser scraping to bypass SPA/React dynamic page loads (e.g. Workday job portals).
2. **Level 2 (Zero-Token ATS APIs)**: Direct integrations with public company job feeds for **Greenhouse**, **Lever**, and **Ashby**.
3. **Level 3 (Search API)**: JSearch API via RapidAPI pulls live LinkedIn, Indeed, and Google Jobs postings, with WebSearch fallback.

---

## ☁️ Deployment

When migrating to production environments, configure these settings:

| Service | Development Setup | Production Recommendation |
| :--- | :--- | :--- |
| **Database** | PostgreSQL (Local) | [Supabase Database](https://supabase.com) (Postgres Hosting) |
| **File Storage** | Local directory `/uploads` | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) or Amazon S3 |
| **Backend API** | Uvicorn (Local) | Railway, Render, or AWS ECS |
| **Frontend Client** | Next Dev Server (Local) | [Vercel](https://vercel.com) |
