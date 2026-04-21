from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.cv import CV
from app.models.analysis import JobAnalysis
from app.schemas.jobs import AnalyzeRequest, ATSRequest, FixCVRequest, AnalysisOut
from app.services import ai_service

router = APIRouter(prefix="/analyze", tags=["Analysis"])


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
        "missing_keywords": result.get("missing_keywords", []),
        "formatting_issues": result.get("formatting_issues", []),
        "quick_wins": result.get("quick_wins", []),
        "keyword_coverage": result.get("keyword_coverage"),
        "formatting_score": result.get("formatting_score"),
    }

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
    # Store what changed in personalization_tips field
    analysis.personalization_tips = {
        "changes_made": result.get("changes_made", []),
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
    return (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == current_user.id)
        .order_by(JobAnalysis.created_at.desc())
        .all()
    )


@router.get("/{job_id}/{cv_id}", response_model=Optional[AnalysisOut])
def get_analysis(
    job_id: int,
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the most recent analysis for a specific job + CV."""
    return (
        db.query(JobAnalysis)
        .filter(
            JobAnalysis.user_id == current_user.id,
            JobAnalysis.job_id == job_id,
            JobAnalysis.cv_id == cv_id,
        )
        .order_by(JobAnalysis.created_at.desc())
        .first()
    )
