from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=False, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    drive = relationship("Drive", back_populates="students")
    company = relationship("Company", back_populates="students")