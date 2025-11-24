from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)  # Keep for backward compatibility
    status = Column(String, default="pending")  # pending, approved, rejected, suspended
    admin_notes = Column(String, nullable=True)  # Admin notes for approval/rejection
    reviewed_at = Column(DateTime, nullable=True)  # When admin reviewed
    reviewed_by = Column(String, nullable=True)  # Which admin reviewed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    company_drives = relationship("Drive", back_populates="company")
    students = relationship("Student", back_populates="company")