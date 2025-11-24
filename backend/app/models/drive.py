from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base
from app.models.enums import DriveStatus, QuestionType

class Drive(Base):
    __tablename__ = "drives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    question_type = Column(Enum(QuestionType), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    scheduled_start = Column(DateTime, nullable=True)
    status = Column(Enum(DriveStatus), default=DriveStatus.DRAFT)
    is_approved = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="company_drives")
    questions = relationship("Question", back_populates="drive", cascade="all, delete-orphan")
    targets = relationship("DriveTarget", back_populates="drive", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="drive")