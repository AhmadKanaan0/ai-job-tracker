from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class JobAnalysis(Base):
    __tablename__ = "job_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)

    # Scores
    match_score = Column(Float, nullable=True)       # 0–100 overall match
    ats_score = Column(Float, nullable=True)         # 0–100 ATS compatibility

    # AI output stored as JSON blobs
    role_summary = Column(Text, nullable=True)
    matched_skills = Column(JSON, nullable=True)     # ["Python", "FastAPI", ...]
    missing_skills = Column(JSON, nullable=True)     # ["Kubernetes", ...]
    level_strategy = Column(Text, nullable=True)
    personalization_tips = Column(JSON, nullable=True)
    interview_questions = Column(JSON, nullable=True)
    ats_issues = Column(JSON, nullable=True)         # formatting / keyword gaps
    fixed_cv_text = Column(Text, nullable=True)      # AI-rewritten CV text
    cv_customization_plan = Column(JSON, nullable=True)  # structured diff: [{section, priority, type, original, suggested, reason}]

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="analyses")
    job = relationship("Job", back_populates="analyses")
    cv = relationship("CV", back_populates="analyses")

    @property
    def job_title(self) -> str | None:
        return self.job.title if self.job else None

    @property
    def company(self) -> str | None:
        return self.job.company if self.job else None

    @property
    def job_url(self) -> str | None:
        return self.job.url if self.job else None
