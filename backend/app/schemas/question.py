from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class QuestionCreate(BaseModel):
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[int] = 1

class QuestionResponse(BaseModel):
    id: int
    drive_id: int
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    difficulty: Optional[str] = None
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionBulkUpload(BaseModel):
    questions: list[QuestionCreate]
