from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.schemas.jobs import JobOut, JobSearch, ScrapeRequest
from app.services import scraper

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
    Results are saved to the DB automatically for tracking later.
    """
    raw_jobs = await scraper.search_jobs(
        query=payload.query,
        location=payload.location,
        remote_only=payload.remote_only,
        sources=payload.sources,
        limit=payload.limit,
    )

    saved = []
    for j in raw_jobs:
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


@router.get("/", response_model=list[JobOut])
def list_jobs(
    source: Optional[str] = Query(None),
    remote: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all scraped jobs in the DB with optional filters."""
    q = db.query(Job)
    if source:
        q = q.filter(Job.source == source)
    if remote:
        q = q.filter(Job.remote == remote)
    return q.order_by(Job.scraped_at.desc()).offset(offset).limit(limit).all()


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
