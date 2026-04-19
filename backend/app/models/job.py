from sqlalchemy import Column, Integer, String, Text, DateTime, func, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False, index=True)
    location = Column(String, nullable=True)
    remote = Column(String, nullable=True)           # remote / hybrid / onsite
    description = Column(Text, nullable=True)
    url = Column(String, unique=True, nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String, nullable=True)
    source = Column(String, nullable=True)           # linkedin / weworkremotely / greenhouse / etc.
    tags = Column(JSON, nullable=True)               # ["python", "fastapi", ...]
    job_type = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)
    is_early_applicant = Column(Boolean, nullable=True)
    applicants_count = Column(String, nullable=True)
    no_h1b = Column(Boolean, nullable=True)
    requirements = Column(JSON, nullable=True)
    responsibilities = Column(JSON, nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    posted_at = Column(DateTime(timezone=True), nullable=True)

    tracked = relationship("TrackedJob", back_populates="job")
    analyses = relationship("JobAnalysis", back_populates="job")
    cover_letters = relationship("CoverLetter", back_populates="job")
