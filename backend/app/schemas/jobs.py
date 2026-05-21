from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any
from datetime import datetime


# ── CV ──────────────────────────────────────────────────────────────────────

class CVOut(BaseModel):
    id: int
    filename: str
    file_url: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Job ─────────────────────────────────────────────────────────────────────

class JobOut(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str]
    remote: Optional[str]
    description: Optional[str]
    url: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: Optional[str]
    source: Optional[str]
    tags: Optional[List[str]]
    job_type: Optional[str]
    experience_level: Optional[str]
    is_early_applicant: Optional[bool]
    applicants_count: Optional[str]
    no_h1b: Optional[bool]
    requirements: Optional[List[str]]
    responsibilities: Optional[List[str]]
    scraped_at: datetime
    posted_at: Optional[datetime]
    formatted_description: Optional[str] = None
    match_score: Optional[float] = None
    posting_legitimacy: Optional[str] = None
    legitimacy_signals: Optional[Any] = None

    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    url: str                          # paste a URL and we scrape it


class JobSearch(BaseModel):
    query: str
    location: Optional[str] = None
    remote_only: bool = False
    sources: Optional[List[str]] = None   # ["linkedin", "weworkremotely", ...]
    limit: int = 40


# ── Tracker ──────────────────────────────────────────────────────────────────

class TrackerCreate(BaseModel):
    job_id: int
    status: str = "saved"
    notes: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None


class TrackerUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None


class TrackerOut(BaseModel):
    id: int
    status: str
    notes: Optional[str]
    applied_date: Optional[datetime]
    next_action: Optional[str]
    next_action_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    match_score: Optional[float] = None
    job: JobOut

    class Config:
        from_attributes = True


# ── Analysis ─────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    job_id: int
    cv_id: int


class ATSRequest(BaseModel):
    job_id: int
    cv_id: int


class FixCVRequest(BaseModel):
    job_id: int
    cv_id: int


class AnalysisOut(BaseModel):
    id: int
    job_id: int
    cv_id: int
    match_score: Optional[float]
    ats_score: Optional[float]
    role_summary: Optional[str]
    matched_skills: Optional[List[str]]
    missing_skills: Optional[List[str]]
    level_strategy: Optional[str]
    personalization_tips: Optional[Any]
    interview_questions: Optional[Any]
    ats_issues: Optional[Any]
    fixed_cv_text: Optional[str]
    cv_customization_plan: Optional[Any] = None
    # Denormalized job fields (populated via @property on model)
    job_title: Optional[str] = None
    company: Optional[str] = None
    job_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Cover Letter ─────────────────────────────────────────────────────────────

class CoverLetterRequest(BaseModel):
    job_id: int
    cv_id: int
    tone: str = "professional"    # professional / friendly / concise


class CoverLetterOut(BaseModel):
    id: int
    job_id: int
    cv_id: int
    tone: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Scrape a single URL ───────────────────────────────────────────────────────

class ScrapeRequest(BaseModel):
    url: str

class ScanBoardRequest(BaseModel):
    company: str
    ats_type: str = "auto"
