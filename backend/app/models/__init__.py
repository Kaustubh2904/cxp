from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# Import base from database connection to use the same instance
from app.database.connection import Base

class DriveStatus(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    UPCOMING = "upcoming"
    LIVE = "live"
    ONGOING = "ongoing"
    COMPLETED = "completed"

class QuestionType(enum.Enum):
    APTITUDE = "aptitude"
    CODING = "coding"
    TECHNICAL = "technical"
    HR = "hr"

class CompanyStatus(enum.Enum):
    PENDING = "pending"      # Newly registered, awaiting review
    APPROVED = "approved"    # Approved and active
    REJECTED = "rejected"    # Rejected by admin
    SUSPENDED = "suspended"  # Temporarily suspended

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    drives = relationship("Drive", back_populates="company")

class College(Base):
    __tablename__ = "colleges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_approved = Column(Boolean, default=True)  # Pre-approved colleges are True
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentGroup(Base):
    __tablename__ = "student_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_approved = Column(Boolean, default=True)  # Pre-approved groups are True
    created_at = Column(DateTime, default=datetime.utcnow)

class DriveTarget(Base):
    __tablename__ = "drive_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)  # Reference to master college
    custom_college_name = Column(String, nullable=True)  # For custom colleges
    student_group_id = Column(Integer, ForeignKey("student_groups.id"), nullable=True)  # Reference to master group
    custom_student_group_name = Column(String, nullable=True)  # For custom groups
    batch_year = Column(String, nullable=True)  # Optional batch/year like "2025", "2024-2025"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    drive = relationship("Drive", back_populates="targets")
    college = relationship("College")
    student_group = relationship("StudentGroup")

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
    company = relationship("Company", back_populates="drives")
    questions = relationship("Question", back_populates="drive", cascade="all, delete-orphan")
    targets = relationship("DriveTarget", back_populates="drive", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)
    correct_answer = Column(String, nullable=True)  # For MCQ questions
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    points = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    drive = relationship("Drive", back_populates="questions")
