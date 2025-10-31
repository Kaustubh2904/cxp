from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CompanyResponse(BaseModel):
    id: int
    name: str
    email: str
    logo_url: Optional[str] = None
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyApprovalUpdate(BaseModel):
    is_approved: bool

class CollegeCreate(BaseModel):
    name: str

class CollegeResponse(BaseModel):
    id: int
    name: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StudentGroupCreate(BaseModel):
    name: str

class StudentGroupResponse(BaseModel):
    id: int
    name: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True
