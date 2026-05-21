from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import json, csv, io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.jobs import JobOut, JobSearch, ScrapeRequest, ScanBoardRequest
from app.services import scraper, ai_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    payload: JobSearch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search jobs across all portals (WWR, Remotive, RemoteOK, Himalayas,
    and optionally LinkedIn/Indeed if JSearch API key is set).
    Enriches the query with user profile data for more relevant results.
    Results are saved to the DB automatically for tracking later.
    """
    # ── Build an enriched query from user profile ─────────────────────────
    query = payload.query.strip()
    user_skills = current_user.skills or []
    user_experiences = current_user.experiences or []

    # Extract job titles from past experience for relevance
    experience_titles = []
    for exp in user_experiences[:3]:  # top 3 most recent
        if isinstance(exp, dict) and exp.get("jobTitle"):
            experience_titles.append(exp["jobTitle"])

    # If the query is short/generic, enrich with top skills
    if len(query.split()) <= 3 and user_skills:
        top_skills = user_skills[:5]  # top 5 skills
        query = f"{query} {' '.join(top_skills)}"

    # Determine location and remote preferences
    location = payload.location or current_user.preferred_location or None
    remote_only = payload.remote_only or (current_user.open_to_remote and not location)

    raw_jobs = await scraper.search_jobs(
        query=query,
        location=location,
        remote_only=remote_only,
        sources=payload.sources,
        limit=payload.limit * 2,  # fetch extra to allow filtering
    )

    # ── Relevance filtering ──────────────────────────────────────────────
    # Build a set of relevant keywords from user profile
    desired_roles = current_user.desired_roles or []
    relevance_keywords = set()

    # Add words from desired roles
    for role in desired_roles:
        for word in role.lower().split():
            if len(word) > 2:  # skip tiny words like "a", "an"
                relevance_keywords.add(word)

    # Add words from skills
    for skill in user_skills:
        relevance_keywords.add(skill.lower())

    # Add words from past job titles
    for title in experience_titles:
        for word in title.lower().split():
            if len(word) > 2:
                relevance_keywords.add(word)

    # Add the original query words
    for word in payload.query.lower().split():
        if len(word) > 2:
            relevance_keywords.add(word)

    # Common tech/engineering terms to always allow
    tech_terms = {
        "software", "engineer", "developer", "frontend", "backend", "fullstack",
        "full-stack", "devops", "data", "machine", "learning", "cloud", "mobile",
        "web", "api", "platform", "infrastructure", "security", "product",
        "design", "designer", "ux", "ui", "architect", "scientist", "analyst",
        "qa", "test", "automation", "sre", "reliability",
    }
    relevance_keywords.update(tech_terms)

    # Irrelevant industry terms to hard-exclude
    exclude_terms = {
        "attorney", "lawyer", "paralegal", "legal counsel",
        "nurse", "nursing", "physician", "medical", "clinical", "pharmacy",
        "dentist", "dental", "therapist", "healthcare aide",
        "truck driver", "cdl", "forklift", "warehouse associate",
        "cashier", "barista", "janitor", "custodian",
        "real estate agent", "loan officer", "mortgage",
    }

    def is_relevant(job_title: str) -> bool:
        title_lower = job_title.lower()
        # Hard-exclude obvious mismatches
        for term in exclude_terms:
            if term in title_lower:
                return False
        # Check if any relevance keyword appears in the title
        if relevance_keywords:
            return any(kw in title_lower for kw in relevance_keywords)
        return True  # no filters set → allow everything

    filtered_jobs = [j for j in raw_jobs if is_relevant(j.get("title", ""))]

    # Fall back to unfiltered if filter is too aggressive (< 5 results)
    if len(filtered_jobs) < 5 and len(raw_jobs) > 5:
        filtered_jobs = raw_jobs

    saved = []
    for j in filtered_jobs[:payload.limit]:
        if not j.get("url"):
            continue
        # Upsert by URL — don't create duplicates
        existing = db.query(Job).filter(Job.url == j["url"]).first()
        if existing:
            saved.append(existing)
            continue

        job = Job(
            title=j["title"],
            company=j["company"],
            location=j.get("location"),
            remote=j.get("remote"),
            description=j.get("description"),
            url=j["url"],
            source=j.get("source"),
            tags=j.get("tags", []),
            salary_min=j.get("salary_min"),
            salary_max=j.get("salary_max"),
            salary_currency=j.get("salary_currency"),
            posted_at=j.get("posted_at"),
        )
        db.add(job)
        saved.append(job)

    db.commit()
    for job in saved:
        db.refresh(job)

    return saved


@router.post("/import", response_model=List[JobOut], status_code=201)
async def import_jobs(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import jobs from a JSON array or CSV file.
    Flexible field mapping handles common column name variations.
    Deduplicates by URL — skips rows that already exist.
    """
    content = await file.read()
    filename = (file.filename or "").lower()

    # ── Field name aliases ────────────────────────────────────────────────
    ALIASES = {
        "title":           ["title", "job_title", "position", "role", "name"],
        "company":         ["company", "company_name", "employer", "organisation", "organization"],
        "url":             ["url", "link", "apply_url", "job_url", "application_link", "source_url", "applyurl"],
        "location":        ["location", "city", "country", "job_location"],
        "remote":          ["remote", "work_type", "workplace", "remote_type"],
        "description":     ["description", "job_description", "details", "body", "content"],
        "salary_min":      ["salary_min", "min_salary", "salary_from", "salarymin"],
        "salary_max":      ["salary_max", "max_salary", "salary_to", "salarymax"],
        "salary_currency": ["salary_currency", "currency", "salarycurrency"],
        "source":          ["source", "portal", "board", "site"],
        "job_type":        ["job_type", "employment_type", "type", "contract_type"],
        "experience_level":["experience_level", "level", "seniority", "experience"],
        "posted_at":       ["posted_at", "posted_date", "date_posted", "pub_date", "created_at", "publishedat"],
        "tags":            ["tags", "skills", "keywords", "categories"],
    }

    def resolve(row: dict, field: str):
        """Pick the first alias that exists in the row."""
        for alias in ALIASES[field]:
            if alias in row:
                return row[alias]
            # also try case-insensitive
            for k in row:
                if k.lower() == alias:
                    return row[k]
        return None

    def parse_rows(raw_rows: list[dict]) -> list[dict]:
        out = []
        for row in raw_rows:
            url = resolve(row, "url")
            title = resolve(row, "title")
            company = resolve(row, "company")
            if not url or not title or not company:
                continue  # skip incomplete rows
            tags_raw = resolve(row, "tags")
            if isinstance(tags_raw, str):
                tags = [t.strip() for t in tags_raw.replace(";", ",").split(",") if t.strip()]
            elif isinstance(tags_raw, list):
                tags = tags_raw
            else:
                tags = []
            out.append({
                "title": str(title),
                "company": str(company),
                "url": str(url),
                "location": resolve(row, "location"),
                "remote": resolve(row, "remote"),
                "description": resolve(row, "description"),
                "salary_min": _to_int(resolve(row, "salary_min")),
                "salary_max": _to_int(resolve(row, "salary_max")),
                "salary_currency": resolve(row, "salary_currency"),
                "source": resolve(row, "source") or "import",
                "job_type": resolve(row, "job_type"),
                "experience_level": resolve(row, "experience_level"),
                "posted_at": resolve(row, "posted_at"),
                "tags": tags,
            })
        return out

    # ── Parse file ────────────────────────────────────────────────────────
    try:
        if filename.endswith(".json"):
            data = json.loads(content.decode("utf-8"))
            raw_rows = data if isinstance(data, list) else data.get("jobs", data.get("data", []))
        elif filename.endswith(".csv"):
            text = content.decode("utf-8-sig")  # handle BOM
            reader = csv.DictReader(io.StringIO(text))
            raw_rows = list(reader)
        else:
            raise HTTPException(status_code=415, detail="Only .json and .csv files are supported")
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    rows = parse_rows(raw_rows)
    if not rows:
        raise HTTPException(status_code=422, detail="No valid job rows found. Rows need at least title, company, and url.")

    # ── Upsert ───────────────────────────────────────────────────────────
    from app.services.scraper import _parse_date
    saved = []
    skipped = 0
    for r in rows:
        if db.query(Job).filter(Job.url == r["url"]).first():
            skipped += 1
            continue
        job = Job(
            title=r["title"],
            company=r["company"],
            url=r["url"],
            location=r.get("location"),
            remote=r.get("remote"),
            description=r.get("description"),
            salary_min=r.get("salary_min"),
            salary_max=r.get("salary_max"),
            salary_currency=r.get("salary_currency"),
            source=r.get("source", "import"),
            job_type=r.get("job_type"),
            experience_level=r.get("experience_level"),
            posted_at=_parse_date(r.get("posted_at")),
            tags=r.get("tags", []),
        )
        db.add(job)
        saved.append(job)

    db.commit()
    for job in saved:
        db.refresh(job)

    return saved


def _to_int(val) -> Optional[int]:
    try:
        return int(float(str(val).replace(",", "").replace("$", "").replace("€", "").strip()))
    except Exception:
        return None


@router.post("/scrape", response_model=JobOut, status_code=201)
async def scrape_single(
    payload: ScrapeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Paste any job URL (Greenhouse, Lever, Ashby, WWR, or any page)
    and we'll scrape and save it.
    """
    # Return existing if already scraped
    existing = db.query(Job).filter(Job.url == payload.url).first()
    if existing:
        return existing

    try:
        j = await scraper.scrape_single_job(payload.url)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not scrape URL: {e}")

    job = Job(
        title=j["title"],
        company=j["company"],
        location=j.get("location"),
        remote=j.get("remote"),
        description=j.get("description"),
        url=payload.url,
        source=j.get("source"),
        tags=j.get("tags", []),
        salary_min=j.get("salary_min"),
        salary_max=j.get("salary_max"),
        salary_currency=j.get("salary_currency"),
        posted_at=j.get("posted_at"),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.post("/scan-board", response_model=List[JobOut], status_code=201)
async def scan_board(
    payload: ScanBoardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scan an entire company's job board via ATS JSON API (Level 2).
    """
    try:
        new_jobs_data = await scraper.scan_company_board(payload.company, payload.ats_type)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not scan board: {e}")

    saved_jobs = []
    for j_data in new_jobs_data:
        if not j_data.get("url"):
            continue
        
        # Deduplicate
        existing = db.query(Job).filter(Job.url == j_data["url"]).first()
        if existing:
            continue
            
        job = Job(
            title=j_data["title"],
            company=j_data["company"],
            location=j_data.get("location"),
            remote=j_data.get("remote"),
            url=j_data["url"],
            source=j_data.get("source"),
            posted_at=j_data.get("posted_at")
        )
        db.add(job)
        saved_jobs.append(job)
        
    db.commit()
    for job in saved_jobs:
        db.refresh(job)
        
    return saved_jobs


@router.get("/", response_model=list[JobOut])
def list_jobs(
    source: Optional[str] = Query(None),
    remote: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all scraped jobs in the DB with optional filters, joined with match scores."""
    from app.models.analysis import JobAnalysis
    from app.models.cv import CV

    active_cv = db.query(CV).filter(CV.user_id == current_user.id, CV.is_active == True).first()
    
    q = db.query(Job)
    if source:
        q = q.filter(Job.source == source)
    if remote:
        q = q.filter(Job.remote == remote)

    jobs = q.order_by(Job.scraped_at.desc()).offset(offset).limit(limit).all()
    
    # If we have an active CV, try to attach scores
    if active_cv:
        job_ids = [j.id for j in jobs]
        analyses = db.query(JobAnalysis).filter(
            JobAnalysis.job_id.in_(job_ids),
            JobAnalysis.user_id == current_user.id,
            JobAnalysis.cv_id == active_cv.id
        ).all()
        
        scores_map = {a.job_id: a.match_score for a in analyses}
        for j in jobs:
            j.match_score = scores_map.get(j.id)

    return jobs


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.analysis import JobAnalysis
    from app.models.cv import CV

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    active_cv = db.query(CV).filter(CV.user_id == current_user.id, CV.is_active == True).first()
    if active_cv:
        analysis = db.query(JobAnalysis).filter(
            JobAnalysis.job_id == job_id,
            JobAnalysis.user_id == current_user.id,
            JobAnalysis.cv_id == active_cv.id
        ).first()
        if analysis:
            job.match_score = analysis.match_score

    return job


@router.post("/{job_id}/check-legitimacy", response_model=JobOut)
async def check_legitimacy(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run an AI legitimacy check on a job posting.
    Flags ghost listings, missing salary, old posts, and other red flags.
    Result is cached on the Job record.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.description:
        raise HTTPException(status_code=400, detail="Job has no description to check")

    try:
        result = ai_service.check_posting_legitimacy(
            job_title=job.title,
            company=job.company,
            description=job.description,
            posted_at=str(job.posted_at) if job.posted_at else "",
            url=job.url,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    job.posting_legitimacy = result.get("verdict")
    job.legitimacy_signals = result
    db.commit()
    db.refresh(job)
    return job


@router.post("/{job_id}/optimize", response_model=JobOut)
async def optimize_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Use AI to reorganize the job description into a structured format.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if not job.description:
        raise HTTPException(status_code=400, detail="Job has no description to optimize")
    
    # Skip if already formatted (optional, but user wants it checked)
    # if job.formatted_description:
    #     return job

    try:
        optimized = ai_service.optimize_job_description(job.description)
        job.formatted_description = optimized
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
