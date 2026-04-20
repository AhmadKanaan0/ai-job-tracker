from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.cv import CV
from app.schemas.jobs import CVOut
from app.services.cv_parser import extract_text
from app.services.storage import save_file
from app.services import ai_service

router = APIRouter(prefix="/cv", tags=["CV"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=CVOut, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate type
    if not file.filename.lower().endswith((".pdf", ".docx", ".doc")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files are accepted")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    # Parse text
    try:
        parsed_text = extract_text(data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    # Save to disk / S3
    file_url = save_file(data, file.filename)

    # Deactivate previous CVs so only this one is "active"
    db.query(CV).filter(CV.user_id == current_user.id).update({"is_active": False})

    cv = CV(
        user_id=current_user.id,
        filename=file.filename,
        file_url=file_url,
        parsed_text=parsed_text,
        is_active=True,
    )
    db.add(cv)

    # Extract profile data and update user
    try:
        profile_data = ai_service.extract_profile_from_cv(parsed_text)
        
        # Simple string fields
        fields = ["first_name", "last_name", "phone", "country", "city"]
        for field in fields:
            if profile_data.get(field):
                setattr(current_user, field, profile_data[field])
        
        # Complex JSON fields
        if profile_data.get("educations"):
            current_user.educations = profile_data["educations"]
        if profile_data.get("experiences"):
            current_user.experiences = profile_data["experiences"]
        if profile_data.get("skills"):
            current_user.skills = profile_data["skills"]
            
        # Update full_name if possible
        if profile_data.get("first_name") and profile_data.get("last_name"):
            current_user.full_name = f"{profile_data['first_name']} {profile_data['last_name']}"
            
    except Exception as e:
        # Ignore extraction failures, CV is still uploaded
        print(f"Failed to extract profile data from CV: {e}")

    db.commit()
    db.refresh(cv)
    return cv


@router.get("/", response_model=list[CVOut])
def list_cvs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CV).filter(CV.user_id == current_user.id).order_by(CV.created_at.desc()).all()


@router.get("/active", response_model=CVOut)
def get_active_cv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cv = db.query(CV).filter(CV.user_id == current_user.id, CV.is_active == True).first()
    if not cv:
        raise HTTPException(status_code=404, detail="No active CV found. Please upload one.")
    return cv


@router.patch("/{cv_id}/activate", response_model=CVOut)
def activate_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    db.query(CV).filter(CV.user_id == current_user.id).update({"is_active": False})
    cv.is_active = True
    db.commit()
    db.refresh(cv)
    return cv


@router.delete("/{cv_id}", status_code=204)
def delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    db.delete(cv)
    db.commit()
