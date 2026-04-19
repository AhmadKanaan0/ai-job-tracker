from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)         # original filename
    file_url = Column(String, nullable=False)         # local path or S3 URL
    parsed_text = Column(Text, nullable=True)         # extracted plain text
    is_active = Column(Boolean, default=True)         # "current" CV flag
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="cvs")
    analyses = relationship("JobAnalysis", back_populates="cv")
    cover_letters = relationship("CoverLetter", back_populates="cv")
