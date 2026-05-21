from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import asyncio

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.cv import CV
from app.models.analysis import JobAnalysis
from app.schemas.jobs import AnalyzeRequest, ATSRequest, FixCVRequest, AnalysisOut
from app.services import ai_service

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class BatchScoreRequest(BaseModel):
    job_ids: List[int]
    cv_id: int


class BatchScoreResult(BaseModel):
    job_id: int
    match_score: Optional[float]


def _get_job_and_cv(job_id: int, cv_id: int, user_id: int, db: Session):
    """Shared helper — fetch job and CV, raise 404 if missing."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.description:
        raise HTTPException(status_code=422, detail="Job has no description to analyse. Scrape it first.")

    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if not cv.parsed_text:
        raise HTTPException(status_code=422, detail="CV has no parsed text. Re-upload it.")

    return job, cv


@router.post("/full", response_model=AnalysisOut)
def full_analysis(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full 6-block analysis: match score, ATS score, skill gaps,
    level strategy, personalization tips, interview questions.
    """
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)

    try:
        result = ai_service.analyze_job(
            cv_text=cv.parsed_text,
            job_description=job.description,
            job_title=job.title,
            company=job.company,
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    # Upsert — overwrite previous analysis for same job+cv combo
    existing = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.job_id == payload.job_id,
        JobAnalysis.cv_id == payload.cv_id,
    ).first()

    analysis = existing or JobAnalysis(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
    )

    analysis.match_score = result.get("match_score")
    analysis.ats_score = result.get("ats_score")
    analysis.role_summary = result.get("role_summary")
    analysis.matched_skills = result.get("matched_skills", [])
    analysis.missing_skills = result.get("missing_skills", [])
    analysis.level_strategy = result.get("level_strategy")
    analysis.personalization_tips = result.get("personalization_tips", [])
    analysis.interview_questions = result.get("interview_questions", [])
    analysis.ats_issues = result.get("ats_issues", {})

    if not existing:
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/ats", response_model=AnalysisOut)
def ats_score_only(
    payload: ATSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Faster, cheaper ATS-only check — no full 6-block analysis."""
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)

    try:
        result = ai_service.score_ats(
            cv_text=cv.parsed_text,
            job_description=job.description,
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    existing = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.job_id == payload.job_id,
        JobAnalysis.cv_id == payload.cv_id,
    ).first()

    analysis = existing or JobAnalysis(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
    )

    analysis.ats_score = result.get("ats_score")
    analysis.ats_issues = {
        "issues": result.get("issues", []),
    }

    if not existing:
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/quick-score", response_model=AnalysisOut)
def fast_score(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ultra-fast match score for discovery feed background scanning."""
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)

    # Check if we already have any analysis (full or fast)
    existing = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.job_id == payload.job_id,
        JobAnalysis.cv_id == payload.cv_id,
    ).first()

    if existing and existing.match_score is not None:
        return existing

    try:
        result = ai_service.quick_score(
            cv_text=cv.parsed_text,
            job_description=job.description,
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    analysis = existing or JobAnalysis(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
    )
    analysis.match_score = result.get("match_score")

    if not existing:
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/batch-quick-score", response_model=list[BatchScoreResult])
async def batch_quick_score(
    payload: BatchScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Score multiple jobs in parallel for the Discovery Feed.
    Skips jobs that already have a score. Returns all scores at once.
    """
    cv = db.query(CV).filter(CV.id == payload.cv_id, CV.user_id == current_user.id).first()
    if not cv or not cv.parsed_text:
        raise HTTPException(status_code=404, detail="CV not found or has no parsed text")

    # Find which jobs already have scores
    existing_analyses = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.cv_id == payload.cv_id,
        JobAnalysis.job_id.in_(payload.job_ids),
        JobAnalysis.match_score.isnot(None),
    ).all()
    scored_map = {a.job_id: a.match_score for a in existing_analyses}

    # Get unscored jobs
    unscored_ids = [jid for jid in payload.job_ids if jid not in scored_map]
    jobs_to_score = db.query(Job).filter(
        Job.id.in_(unscored_ids),
        Job.description.isnot(None),
    ).all() if unscored_ids else []

    # Score in parallel (up to 5 at a time)
    async def score_one(job: Job):
        try:
            result = await ai_service.async_quick_score(
                cv_text=cv.parsed_text,
                job_description=job.description,
            )
            return job.id, result.get("match_score")
        except Exception:
            return job.id, None

    # Process in batches of 5
    results = []
    for i in range(0, len(jobs_to_score), 5):
        batch = jobs_to_score[i:i+5]
        batch_results = await asyncio.gather(*[score_one(j) for j in batch])
        results.extend(batch_results)

    # Save new scores to DB
    for job_id, score in results:
        if score is None:
            continue
        existing = db.query(JobAnalysis).filter(
            JobAnalysis.user_id == current_user.id,
            JobAnalysis.job_id == job_id,
            JobAnalysis.cv_id == payload.cv_id,
        ).first()
        analysis = existing or JobAnalysis(
            user_id=current_user.id,
            job_id=job_id,
            cv_id=payload.cv_id,
        )
        analysis.match_score = score
        if not existing:
            db.add(analysis)
        scored_map[job_id] = score

    db.commit()

    # Return all scores (existing + newly computed)
    return [
        BatchScoreResult(job_id=jid, match_score=scored_map.get(jid))
        for jid in payload.job_ids
    ]


@router.post("/score")
def quick_score(
    payload: ATSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ultra-fast score for discovery feed."""
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)
    return ai_service.quick_score(cv.parsed_text, job.description)


@router.post("/cv-diff", response_model=AnalysisOut)
def cv_diff(
    payload: FixCVRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a prioritised list of specific CV changes for a job — no full rewrite.
    Returns structured before/after diffs per CV section with priority and reason.
    """
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)

    try:
        result = ai_service.generate_cv_diff(
            cv_text=cv.parsed_text,
            job_description=job.description,
            job_title=job.title,
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    existing = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.job_id == payload.job_id,
        JobAnalysis.cv_id == payload.cv_id,
    ).first()

    analysis = existing or JobAnalysis(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
    )

    analysis.cv_customization_plan = result

    if not existing:
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/fix-cv", response_model=AnalysisOut)
def fix_cv(
    payload: FixCVRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI rewrites the CV to better match this specific job."""
    job, cv = _get_job_and_cv(payload.job_id, payload.cv_id, current_user.id, db)

    try:
        result = ai_service.fix_cv(
            cv_text=cv.parsed_text,
            job_description=job.description,
            job_title=job.title,
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    existing = db.query(JobAnalysis).filter(
        JobAnalysis.user_id == current_user.id,
        JobAnalysis.job_id == payload.job_id,
        JobAnalysis.cv_id == payload.cv_id,
    ).first()

    analysis = existing or JobAnalysis(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
    )

    analysis.fixed_cv_text = result.get("fixed_cv_text")
    # Store rich change data in personalization_tips field
    analysis.personalization_tips = {
        "changes": result.get("changes", []),
        "quick_wins": result.get("quick_wins", []),
        "ats_improvement": result.get("ats_improvement", ""),
    }

    if not existing:
        db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/history", response_model=list[AnalysisOut])
def analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    return (
        db.query(JobAnalysis)
        .options(joinedload(JobAnalysis.job))
        .filter(JobAnalysis.user_id == current_user.id)
        .order_by(JobAnalysis.created_at.desc())
        .all()
    )


@router.get("/detail/{analysis_id}", response_model=AnalysisOut)
def get_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single analysis by its primary key."""
    from sqlalchemy.orm import joinedload
    analysis = (
        db.query(JobAnalysis)
        .options(joinedload(JobAnalysis.job))
        .filter(
            JobAnalysis.id == analysis_id,
            JobAnalysis.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/{job_id}/{cv_id}", response_model=Optional[AnalysisOut])
def get_analysis(
    job_id: int,
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the most recent analysis for a specific job + CV."""
    from sqlalchemy.orm import joinedload
    return (
        db.query(JobAnalysis)
        .options(joinedload(JobAnalysis.job))
        .filter(
            JobAnalysis.user_id == current_user.id,
            JobAnalysis.job_id == job_id,
            JobAnalysis.cv_id == cv_id,
        )
        .order_by(JobAnalysis.created_at.desc())
        .first()
    )

