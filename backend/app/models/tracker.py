from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

# All possible statuses in pipeline order
STATUSES = [
    "saved",
    "applied",
    "phone_screen",
    "interview",
    "take_home",
    "final_round",
    "offer",
    "accepted",
    "rejected",
    "ghosted",
    "withdrawn",
]


class TrackedJob(Base):
    __tablename__ = "tracked_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="saved", nullable=False)
    notes = Column(Text, nullable=True)
    applied_date = Column(DateTime(timezone=True), nullable=True)
    next_action = Column(String, nullable=True)     # "Follow up by Friday"
    next_action_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="tracked_jobs")
    job = relationship("Job", back_populates="tracked")

    @property
    def match_score(self):
        from app.models.analysis import JobAnalysis
        from sqlalchemy.orm import object_session
        session = object_session(self)
        if session:
            analysis = session.query(JobAnalysis).filter_by(
                job_id=self.job_id, user_id=self.user_id
            ).order_by(JobAnalysis.created_at.desc()).first()
            return analysis.match_score if analysis else None
        return None
