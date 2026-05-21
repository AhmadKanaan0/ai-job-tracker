from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.cv import CV
from app.models.cover_letter import CoverLetter
from app.schemas.jobs import CoverLetterRequest, CoverLetterOut
from app.services import ai_service

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])

VALID_TONES = ["professional", "friendly", "concise"]


@router.post("/generate", response_model=CoverLetterOut, status_code=201)
def generate(
    payload: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.tone not in VALID_TONES:
        raise HTTPException(status_code=400, detail=f"tone must be one of: {VALID_TONES}")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.description:
        raise HTTPException(status_code=422, detail="Job has no description. Scrape it first.")

    cv = db.query(CV).filter(CV.id == payload.cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    try:
        # Build user display name
        user_name = ""
        if current_user.first_name or current_user.last_name:
            user_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()

        content = ai_service.generate_cover_letter(
            cv_text=cv.parsed_text,
            job_description=job.description,
            job_title=job.title,
            company=job.company,
            tone=payload.tone,
            user_name=user_name,
            user_email=current_user.email or "",
            user_phone=current_user.phone or "",
            user_city=current_user.city or "",
            user_country=current_user.country or "",
        )
    except Exception as e:
        if e.__class__.__name__ == "HTTPException":
            raise e
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    letter = CoverLetter(
        user_id=current_user.id,
        job_id=payload.job_id,
        cv_id=payload.cv_id,
        tone=payload.tone,
        content=content,
    )
    db.add(letter)
    db.commit()
    db.refresh(letter)
    return letter


@router.get("/", response_model=list[CoverLetterOut])
def list_letters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CoverLetter)
        .filter(CoverLetter.user_id == current_user.id)
        .order_by(CoverLetter.created_at.desc())
        .all()
    )


@router.get("/{letter_id}", response_model=CoverLetterOut)
def get_letter(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    letter = db.query(CoverLetter).filter(
        CoverLetter.id == letter_id,
        CoverLetter.user_id == current_user.id,
    ).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return letter


@router.delete("/{letter_id}", status_code=204)
def delete_letter(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    letter = db.query(CoverLetter).filter(
        CoverLetter.id == letter_id,
        CoverLetter.user_id == current_user.id,
    ).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    db.delete(letter)
    db.commit()
