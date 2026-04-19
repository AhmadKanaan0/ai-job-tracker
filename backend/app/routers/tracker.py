from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.tracker import TrackedJob, STATUSES
from app.schemas.jobs import TrackerCreate, TrackerUpdate, TrackerOut

router = APIRouter(prefix="/tracker", tags=["Tracker"])


@router.post("/", response_model=TrackerOut, status_code=201)
def add_to_tracker(
    payload: TrackerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Don't add duplicates
    existing = db.query(TrackedJob).filter(
        TrackedJob.user_id == current_user.id,
        TrackedJob.job_id == payload.job_id,
    ).first()
    if existing:
        return existing

    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {STATUSES}")

    entry = TrackedJob(
        user_id=current_user.id,
        job_id=payload.job_id,
        status=payload.status,
        notes=payload.notes,
        next_action=payload.next_action,
        next_action_date=payload.next_action_date,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/", response_model=list[TrackerOut])
def list_tracked(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TrackedJob).filter(TrackedJob.user_id == current_user.id)
    if status:
        q = q.filter(TrackedJob.status == status)
    return q.order_by(TrackedJob.updated_at.desc().nullslast(), TrackedJob.created_at.desc()).all()


@router.get("/statuses")
def list_statuses():
    """Return all valid statuses in pipeline order."""
    return {"statuses": STATUSES}


@router.patch("/{entry_id}", response_model=TrackerOut)
def update_tracker(
    entry_id: int,
    payload: TrackerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(TrackedJob).filter(
        TrackedJob.id == entry_id,
        TrackedJob.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Tracker entry not found")

    if payload.status and payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {STATUSES}")

    update_data = payload.model_dump(exclude_unset=True)

    # Auto-set applied_date when status moves to "applied"
    if payload.status == "applied" and not entry.applied_date:
        update_data["applied_date"] = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def remove_from_tracker(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(TrackedJob).filter(
        TrackedJob.id == entry_id,
        TrackedJob.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Tracker entry not found")
    db.delete(entry)
    db.commit()


@router.get("/stats/summary")
def tracker_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Quick pipeline stats — useful for a dashboard overview."""
    from sqlalchemy import func
    rows = (
        db.query(TrackedJob.status, func.count(TrackedJob.id).label("count"))
        .filter(TrackedJob.user_id == current_user.id)
        .group_by(TrackedJob.status)
        .all()
    )
    counts = {status: 0 for status in STATUSES}
    for row in rows:
        counts[row.status] = row.count

    total = sum(counts.values())
    interview_rate = round(
        (counts.get("interview", 0) + counts.get("final_round", 0)) / max(counts.get("applied", 1), 1) * 100, 1
    )

    return {
        "total": total,
        "by_status": counts,
        "interview_rate_pct": interview_rate,
    }
