from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Personal Info
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    address_line = Column(String, nullable=True)

    # Setup Wizard Data
    educations = Column(JSON, nullable=True)
    experiences = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)

    # Equal Employment
    has_disability = Column(String, nullable=True)
    gender = Column(String, nullable=True)

    # Onboarding state
    setup_completed = Column(Boolean, default=False)
    
    # Job Preferences
    desired_roles = Column(JSON, nullable=True)           # ["Full Stack Developer", "Frontend"]
    preferred_job_types = Column(JSON, nullable=True)     # ["full-time", "contract"]
    preferred_location = Column(String, nullable=True)
    open_to_remote = Column(Boolean, default=True)
    needs_visa = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    cvs = relationship("CV", back_populates="owner", cascade="all, delete-orphan")
    tracked_jobs = relationship("TrackedJob", back_populates="owner", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="owner", cascade="all, delete-orphan")
    analyses = relationship("JobAnalysis", back_populates="owner", cascade="all, delete-orphan")
