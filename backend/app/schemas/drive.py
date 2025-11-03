from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import DriveStatus, QuestionType

class DriveTargetCreate(BaseModel):
    college_id: Optional[int] = None  # From master college list
    custom_college_name: Optional[str] = None  # Custom college name
    student_group_id: Optional[int] = None  # From master student group list
    custom_student_group_name: Optional[str] = None  # Custom student group
    batch_year: Optional[str] = None  # Optional batch/year

class DriveTargetResponse(BaseModel):
    id: int
    college_id: Optional[int] = None
    custom_college_name: Optional[str] = None
    student_group_id: Optional[int] = None
    custom_student_group_name: Optional[str] = None
    batch_year: Optional[str] = None
    college_name: Optional[str] = None  # Resolved college name
    student_group_name: Optional[str] = None  # Resolved student group name
    
    class Config:
        from_attributes = True

class DriveCreate(BaseModel):
    title: str
    description: Optional[str] = None
    question_type: QuestionType
    targets: List[DriveTargetCreate]  # List of targeting configurations
    duration_minutes: int
    scheduled_start: Optional[datetime] = None

class DriveUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    targets: Optional[List[DriveTargetCreate]] = None
    duration_minutes: Optional[int] = None
    scheduled_start: Optional[datetime] = None

class DriveResponse(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None  # Company name for display
    title: str
    description: Optional[str] = None
    question_type: QuestionType
    targets: List[DriveTargetResponse] = []
    duration_minutes: int
    scheduled_start: Optional[datetime] = None
    status: DriveStatus
    is_approved: bool
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DriveStatusUpdate(BaseModel):
    status: DriveStatus

class AdminDriveApprovalUpdate(BaseModel):
    is_approved: bool
    admin_notes: Optional[str] = None
