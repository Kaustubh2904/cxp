from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base

class Drive(Base):
    __tablename__ = "drives"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    question_type = Column(String, nullable=False)  # mcqs, aptitude, coding, technical, hr
    duration_minutes = Column(Integer, nullable=False)
    scheduled_start = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)  # When exam actually started
    actual_end = Column(DateTime, nullable=True)  # When exam actually ended
    status = Column(String, default="draft")  # draft, submitted, approved, rejected, upcoming, live, ongoing, completed
    is_approved = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="company_drives")
    questions = relationship("Question", back_populates="drive", cascade="all, delete-orphan")
    targets = relationship("DriveTarget", back_populates="drive", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="drive", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Drive(id={self.id}, title='{self.title}', status='{self.status}')>"