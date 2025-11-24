from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

# Import base from database connection to use the same instance
from app.database.connection import Base

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