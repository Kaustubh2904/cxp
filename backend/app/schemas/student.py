from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class StudentResponse(BaseModel):
    id: int
    drive_id: int
    company_id: int
    roll_number: str
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True