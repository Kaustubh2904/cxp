from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models import Company, Drive, College, StudentGroup, DriveStatus
from app.schemas.company import CompanyResponse, CompanyApprovalUpdate, CollegeResponse, StudentGroupResponse
from app.schemas.drive import DriveResponse, AdminDriveApprovalUpdate
from app.auth import get_admin_user

def format_drive_response(drive, db):
    """Format drive response with resolved target names"""
    targets = []
    for target in drive.targets:
        college_name = target.custom_college_name
        if not college_name and target.college_id:
            college = db.query(College).filter(College.id == target.college_id).first()
            college_name = college.name if college else "Unknown College"
        
        group_name = target.custom_student_group_name
        if not group_name and target.student_group_id:
            group = db.query(StudentGroup).filter(StudentGroup.id == target.student_group_id).first()
            group_name = group.name if group else "Unknown Group"
        
        targets.append({
            "id": target.id,
            "college_id": target.college_id,
            "custom_college_name": target.custom_college_name,
            "college_name": college_name,
            "student_group_id": target.student_group_id,
            "custom_student_group_name": target.custom_student_group_name,
            "student_group_name": group_name,
            "batch_year": target.batch_year
        })
    
    return {
        "id": drive.id,
        "company_id": drive.company_id,
        "title": drive.title,
        "description": drive.description,
        "question_type": drive.question_type,
        "targets": targets,
        "duration_minutes": drive.duration_minutes,
        "scheduled_start": drive.scheduled_start,
        "status": drive.status,
        "is_approved": drive.is_approved,
        "admin_notes": drive.admin_notes,
        "created_at": drive.created_at,
        "updated_at": drive.updated_at
    }

router = APIRouter()

@router.get("/companies", response_model=List[CompanyResponse])
def get_all_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Get all companies (admin only)"""
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@router.put("/companies/{company_id}/approve", response_model=CompanyResponse)
def approve_company(
    company_id: int,
    approval_data: CompanyApprovalUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Approve or reject company registration"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.is_approved = approval_data.is_approved
    db.commit()
    db.refresh(company)
    
    return company

@router.get("/drives", response_model=List[DriveResponse])
def get_all_drives(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = "pending",  # pending, all, approved, rejected
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Get drives for admin review"""
    query = db.query(Drive)
    
    if status_filter == "pending":
        # Show only drives that need approval
        query = query.filter(Drive.is_approved == False, Drive.status == DriveStatus.SUBMITTED)
    elif status_filter == "approved":
        query = query.filter(Drive.is_approved == True)
    elif status_filter == "rejected":
        query = query.filter(Drive.status == DriveStatus.REJECTED)
    # "all" shows everything
    
    drives = query.offset(skip).limit(limit).all()
    return [format_drive_response(drive, db) for drive in drives]

@router.put("/drives/{drive_id}/approve", response_model=DriveResponse)
def approve_drive(
    drive_id: int,
    approval_data: AdminDriveApprovalUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Approve or reject drive"""
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    drive.is_approved = approval_data.is_approved
    drive.admin_notes = approval_data.admin_notes
    
    if approval_data.is_approved:
        drive.status = DriveStatus.APPROVED
    else:
        drive.status = DriveStatus.REJECTED
    
    db.commit()
    db.refresh(drive)
    
    return format_drive_response(drive, db)

@router.get("/colleges", response_model=List[CollegeResponse])
def get_all_colleges(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Get all colleges"""
    colleges = db.query(College).all()
    return colleges

@router.put("/colleges/{college_id}/approve")
def approve_college(
    college_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Approve custom college"""
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    college.is_approved = True
    db.commit()
    
    return {"message": "College approved successfully"}

@router.get("/student-groups", response_model=List[StudentGroupResponse])
def get_all_student_groups(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Get all student groups"""
    groups = db.query(StudentGroup).all()
    return groups

@router.put("/student-groups/{group_id}/approve")
def approve_student_group(
    group_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Approve custom student group"""
    group = db.query(StudentGroup).filter(StudentGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")
    
    group.is_approved = True
    db.commit()
    
    return {"message": "Student group approved successfully"}

# New endpoints for managing colleges and student groups
@router.post("/colleges")
def create_college(
    college_data: dict,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Create a new college"""
    # Check if college already exists
    existing = db.query(College).filter(College.name == college_data["name"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="College already exists")
    
    college = College(name=college_data["name"], is_approved=True)
    db.add(college)
    db.commit()
    db.refresh(college)
    
    return {"message": "College created successfully", "college": college}

@router.put("/colleges/{college_id}")
def update_college(
    college_id: int,
    college_data: dict,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Update college details"""
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    # Check if new name conflicts with existing college
    if college_data.get("name") and college_data["name"] != college.name:
        existing = db.query(College).filter(College.name == college_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="College name already exists")
        college.name = college_data["name"]
    
    if "is_approved" in college_data:
        college.is_approved = college_data["is_approved"]
    
    db.commit()
    db.refresh(college)
    
    return {"message": "College updated successfully", "college": college}

@router.delete("/colleges/{college_id}")
def delete_college(
    college_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Delete a college"""
    college = db.query(College).filter(College.id == college_id).first()
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    db.delete(college)
    db.commit()
    
    return {"message": "College deleted successfully"}

@router.post("/student-groups")
def create_student_group(
    group_data: dict,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Create a new student group"""
    # Check if group already exists
    existing = db.query(StudentGroup).filter(StudentGroup.name == group_data["name"]).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student group already exists")
    
    group = StudentGroup(name=group_data["name"], is_approved=True)
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return {"message": "Student group created successfully", "group": group}

@router.put("/student-groups/{group_id}")
def update_student_group(
    group_id: int,
    group_data: dict,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Update student group details"""
    group = db.query(StudentGroup).filter(StudentGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")
    
    # Check if new name conflicts with existing group
    if group_data.get("name") and group_data["name"] != group.name:
        existing = db.query(StudentGroup).filter(StudentGroup.name == group_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Student group name already exists")
        group.name = group_data["name"]
    
    if "is_approved" in group_data:
        group.is_approved = group_data["is_approved"]
    
    db.commit()
    db.refresh(group)
    
    return {"message": "Student group updated successfully", "group": group}

@router.delete("/student-groups/{group_id}")
def delete_student_group(
    group_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
):
    """Delete a student group"""
    group = db.query(StudentGroup).filter(StudentGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")
    
    db.delete(group)
    db.commit()
    
    return {"message": "Student group deleted successfully"}
