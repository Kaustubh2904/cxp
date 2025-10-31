from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from app.database.connection import get_db
from app.models import Drive, Question, College, StudentGroup, DriveStatus, DriveTarget
from app.schemas.drive import DriveCreate, DriveUpdate, DriveResponse, DriveStatusUpdate
from app.schemas.question import QuestionCreate, QuestionResponse, QuestionBulkUpload
from app.schemas.company import CollegeResponse, StudentGroupResponse
from app.auth import get_company_user

router = APIRouter()

def format_drive_response(drive: Drive, db: Session):
    """Format drive response with resolved target information"""
    targets = []
    for target in drive.targets:
        college_name = None
        student_group_name = None
        
        if target.college_id:
            college = db.query(College).filter(College.id == target.college_id).first()
            college_name = college.name if college else None
        elif target.custom_college_name:
            college_name = target.custom_college_name
        
        if target.student_group_id:
            group = db.query(StudentGroup).filter(StudentGroup.id == target.student_group_id).first()
            student_group_name = group.name if group else None
        elif target.custom_student_group_name:
            student_group_name = target.custom_student_group_name
        
        targets.append({
            "id": target.id,
            "college_id": target.college_id,
            "custom_college_name": target.custom_college_name,
            "student_group_id": target.student_group_id,
            "custom_student_group_name": target.custom_student_group_name,
            "batch_year": target.batch_year,
            "college_name": college_name,
            "student_group_name": student_group_name
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

@router.get("/drives", response_model=List[DriveResponse])
def get_company_drives(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Get all drives for the authenticated company"""
    drives = db.query(Drive).filter(
        Drive.company_id == company.id  # Show all drives so company can see status
    ).offset(skip).limit(limit).all()
    
    return [format_drive_response(drive, db) for drive in drives]

@router.post("/drives", response_model=DriveResponse)
def create_drive(
    drive_data: DriveCreate,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Create a new drive with improved targeting system"""
    
    # Validate that we have at least one target
    if not drive_data.targets:
        raise HTTPException(status_code=400, detail="At least one target must be specified")
    
    # Create the drive
    drive = Drive(
        company_id=company.id,
        title=drive_data.title,
        description=drive_data.description,
        question_type=drive_data.question_type,
        duration_minutes=drive_data.duration_minutes,
        scheduled_start=drive_data.scheduled_start,
        status=DriveStatus.DRAFT
    )
    
    db.add(drive)
    db.flush()  # Get the drive ID without committing
    
    # Create drive targets
    for target_data in drive_data.targets:
        # Create custom colleges and student groups if provided
        if target_data.custom_college_name:
            existing_college = db.query(College).filter(College.name == target_data.custom_college_name).first()
            if not existing_college:
                new_college = College(name=target_data.custom_college_name, is_approved=False)
                db.add(new_college)
                db.flush()
        
        if target_data.custom_student_group_name:
            existing_group = db.query(StudentGroup).filter(StudentGroup.name == target_data.custom_student_group_name).first()
            if not existing_group:
                new_group = StudentGroup(name=target_data.custom_student_group_name, is_approved=False)
                db.add(new_group)
                db.flush()
        
        # Create drive target
        drive_target = DriveTarget(
            drive_id=drive.id,
            college_id=target_data.college_id,
            custom_college_name=target_data.custom_college_name,
            student_group_id=target_data.student_group_id,
            custom_student_group_name=target_data.custom_student_group_name,
            batch_year=target_data.batch_year
        )
        db.add(drive_target)
    
    db.commit()
    db.refresh(drive)
    
    # Load the drive with targets for response
    drive_with_targets = db.query(Drive).filter(Drive.id == drive.id).first()
    return format_drive_response(drive_with_targets, db)

@router.get("/drives/{drive_id}", response_model=DriveResponse)
def get_drive(
    drive_id: int,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Get a specific drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    return format_drive_response(drive, db)

@router.put("/drives/{drive_id}", response_model=DriveResponse)
def update_drive(
    drive_id: int,
    drive_data: DriveUpdate,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Update a drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    # Only allow updates if drive is not approved yet
    if drive.is_approved:
        raise HTTPException(status_code=400, detail="Cannot update approved drive")
    
    # Update basic fields
    if drive_data.title is not None:
        drive.title = drive_data.title
    if drive_data.description is not None:
        drive.description = drive_data.description
    if drive_data.duration_minutes is not None:
        drive.duration_minutes = drive_data.duration_minutes
    if drive_data.scheduled_start is not None:
        drive.scheduled_start = drive_data.scheduled_start
    
    # Update targets if provided
    if drive_data.targets is not None:
        # Remove existing targets
        db.query(DriveTarget).filter(DriveTarget.drive_id == drive_id).delete()
        
        # Add new targets
        for target_data in drive_data.targets:
            # Create custom colleges and student groups if provided
            if target_data.custom_college_name:
                existing_college = db.query(College).filter(College.name == target_data.custom_college_name).first()
                if not existing_college:
                    new_college = College(name=target_data.custom_college_name, is_approved=False)
                    db.add(new_college)
                    db.flush()
            
            if target_data.custom_student_group_name:
                existing_group = db.query(StudentGroup).filter(StudentGroup.name == target_data.custom_student_group_name).first()
                if not existing_group:
                    new_group = StudentGroup(name=target_data.custom_student_group_name, is_approved=False)
                    db.add(new_group)
                    db.flush()
            
            # Create drive target
            drive_target = DriveTarget(
                drive_id=drive.id,
                college_id=target_data.college_id,
                custom_college_name=target_data.custom_college_name,
                student_group_id=target_data.student_group_id,
                custom_student_group_name=target_data.custom_student_group_name,
                batch_year=target_data.batch_year
            )
            db.add(drive_target)
    
    db.commit()
    db.refresh(drive)
    
    return format_drive_response(drive, db)

@router.delete("/drives/{drive_id}")
def delete_drive(
    drive_id: int,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Delete a drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    # Only allow deletion if drive is not approved yet
    if drive.is_approved:
        raise HTTPException(status_code=400, detail="Cannot delete approved drive")
    
    db.delete(drive)
    db.commit()
    
    return {"message": "Drive deleted successfully"}

@router.put("/drives/{drive_id}/submit", response_model=DriveResponse)
def submit_drive_for_approval(
    drive_id: int,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Submit drive for admin approval"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    if drive.status != DriveStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft drives can be submitted")
    
    # Check if drive has questions
    question_count = db.query(Question).filter(Question.drive_id == drive_id).count()
    if question_count == 0:
        raise HTTPException(status_code=400, detail="Drive must have at least one question to submit")
    
    drive.status = DriveStatus.SUBMITTED
    db.commit()
    db.refresh(drive)
    
    return drive

@router.put("/drives/{drive_id}/status", response_model=DriveResponse)
def update_drive_status(
    drive_id: int,
    status_data: DriveStatusUpdate,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Update drive status (start/stop)"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    if not drive.is_approved:
        raise HTTPException(status_code=400, detail="Drive not approved by admin")
    
    drive.status = status_data.status
    db.commit()
    db.refresh(drive)
    
    return drive

@router.post("/drives/{drive_id}/duplicate", response_model=DriveResponse)
def duplicate_drive(
    drive_id: int,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Duplicate a drive with all its questions and targets"""
    original_drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not original_drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    # Create new drive with copied data
    new_drive = Drive(
        company_id=company.id,
        title=f"{original_drive.title} (Copy)",
        description=original_drive.description,
        question_type=original_drive.question_type,
        duration_minutes=original_drive.duration_minutes,
        scheduled_start=None,  # Reset schedule
        status=DriveStatus.DRAFT,
        is_approved=False
    )
    
    db.add(new_drive)
    db.flush()  # Get the ID for the new drive
    
    # Copy all targets
    for target in original_drive.targets:
        new_target = DriveTarget(
            drive_id=new_drive.id,
            college_id=target.college_id,
            custom_college_name=target.custom_college_name,
            student_group_id=target.student_group_id,
            custom_student_group_name=target.custom_student_group_name,
            batch_year=target.batch_year
        )
        db.add(new_target)
    
    # Copy all questions
    original_questions = db.query(Question).filter(Question.drive_id == drive_id).all()
    for question in original_questions:
        new_question = Question(
            drive_id=new_drive.id,
            question_text=question.question_text,
            option_a=question.option_a,
            option_b=question.option_b,
            option_c=question.option_c,
            option_d=question.option_d,
            correct_answer=question.correct_answer,
            difficulty=question.difficulty,
            points=question.points
        )
        db.add(new_question)
    
    db.commit()
    db.refresh(new_drive)
    
    return format_drive_response(new_drive, db)

# Question management routes
@router.post("/drives/{drive_id}/questions", response_model=QuestionResponse)
def add_question_to_drive(
    drive_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Add a question to a drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    if drive.is_approved:
        raise HTTPException(status_code=400, detail="Cannot add questions to approved drive")
    
    question = Question(
        drive_id=drive_id,
        question_text=question_data.question_text,
        option_a=question_data.option_a,
        option_b=question_data.option_b,
        option_c=question_data.option_c,
        option_d=question_data.option_d,
        correct_answer=question_data.correct_answer,
        difficulty=question_data.difficulty,
        points=question_data.points
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return question

@router.post("/drives/{drive_id}/questions/bulk")
def bulk_upload_questions(
    drive_id: int,
    questions_data: QuestionBulkUpload,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Bulk upload questions to a drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    if drive.is_approved:
        raise HTTPException(status_code=400, detail="Cannot add questions to approved drive")
    
    questions = []
    for question_data in questions_data.questions:
        question = Question(
            drive_id=drive_id,
            question_text=question_data.question_text,
            option_a=question_data.option_a,
            option_b=question_data.option_b,
            option_c=question_data.option_c,
            option_d=question_data.option_d,
            correct_answer=question_data.correct_answer,
            difficulty=question_data.difficulty,
            points=question_data.points
        )
        questions.append(question)
    
    db.add_all(questions)
    db.commit()
    
    return {"message": f"Successfully uploaded {len(questions)} questions"}

@router.get("/drives/{drive_id}/questions", response_model=List[QuestionResponse])
def get_drive_questions(
    drive_id: int,
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Get all questions for a drive"""
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.company_id == company.id
    ).first()
    
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    
    questions = db.query(Question).filter(Question.drive_id == drive_id).all()
    return questions

# Reference data endpoints for targeting
@router.get("/colleges", response_model=List[CollegeResponse])
def get_approved_colleges(
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Get all approved colleges for targeting"""
    colleges = db.query(College).filter(College.is_approved == True).all()
    return colleges

@router.get("/student-groups", response_model=List[StudentGroupResponse])
def get_approved_student_groups(
    db: Session = Depends(get_db),
    company: dict = Depends(get_company_user)
):
    """Get all approved student groups for targeting"""
    groups = db.query(StudentGroup).filter(StudentGroup.is_approved == True).all()
    return groups
