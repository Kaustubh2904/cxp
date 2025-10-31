from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_router, admin_router, company_router
from app.database import create_tables
from app.database.connection import engine, Base
from app.models import College, StudentGroup, Drive, DriveTarget
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect, text
import json

# Create FastAPI app
app = FastAPI(
    title="Company Exam Portal API",
    description="Backend API for Company Exam Portal - Admin and Company Management System",
    version="1.0.0"
)

# Add CORS middleware - Allow frontend from any port (Live Server, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(company_router, prefix="/api/company", tags=["Company"])

def migrate_old_targeting_data(db):
    """Migrate old targeting data from JSON columns to DriveTarget table"""
    try:
        # Get all drives
        drives = db.query(Drive).all()
        migrated_count = 0
        
        for drive in drives:
            # Skip if already migrated (has DriveTarget entries)
            if db.query(DriveTarget).filter(DriveTarget.drive_id == drive.id).first():
                continue
            
            # Parse old JSON data if it exists
            target_colleges = []
            target_groups = []
            custom_colleges = []
            custom_groups = []
            
            if hasattr(drive, 'target_colleges') and drive.target_colleges:
                try:
                    target_colleges = json.loads(drive.target_colleges) if isinstance(drive.target_colleges, str) else []
                except:
                    pass
            
            if hasattr(drive, 'target_student_groups') and drive.target_student_groups:
                try:
                    target_groups = json.loads(drive.target_student_groups) if isinstance(drive.target_student_groups, str) else []
                except:
                    pass
            
            if hasattr(drive, 'custom_colleges') and drive.custom_colleges:
                try:
                    custom_colleges = json.loads(drive.custom_colleges) if isinstance(drive.custom_colleges, str) else []
                except:
                    pass
            
            if hasattr(drive, 'custom_student_groups') and drive.custom_student_groups:
                try:
                    custom_groups = json.loads(drive.custom_student_groups) if isinstance(drive.custom_student_groups, str) else []
                except:
                    pass
            
            # Create DriveTarget entries for approved colleges and groups
            for college_id in target_colleges:
                for group_id in target_groups:
                    target = DriveTarget(
                        drive_id=drive.id,
                        college_id=college_id,
                        student_group_id=group_id
                    )
                    db.add(target)
            
            # Handle custom colleges
            for custom_college in custom_colleges:
                college = db.query(College).filter(College.name == custom_college).first()
                if not college:
                    college = College(name=custom_college, is_approved=False)
                    db.add(college)
                    db.flush()
                
                for group_id in target_groups:
                    target = DriveTarget(
                        drive_id=drive.id,
                        college_id=college.id,
                        student_group_id=group_id
                    )
                    db.add(target)
            
            # Handle custom groups
            for custom_group in custom_groups:
                group = db.query(StudentGroup).filter(StudentGroup.name == custom_group).first()
                if not group:
                    group = StudentGroup(name=custom_group, is_approved=False)
                    db.add(group)
                    db.flush()
                
                for college_id in target_colleges:
                    target = DriveTarget(
                        drive_id=drive.id,
                        college_id=college_id,
                        student_group_id=group.id
                    )
                    db.add(target)
            
            migrated_count += 1
        
        db.commit()
        
        if migrated_count > 0:
            print(f"  ✓ Migrated {migrated_count} drives to new targeting system")
            
            # Drop old columns
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS target_colleges CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS target_student_groups CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS custom_colleges CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS custom_student_groups CASCADE"))
            
            print("  ✓ Removed old targeting columns")
        
    except Exception as e:
        print(f"  ⚠️ Migration error: {e}")
        db.rollback()

@app.on_event("startup")
async def startup_event():
    """Create database tables, migrate old data, and initialize sample data on startup"""
    print("🚀 Starting Company Exam Portal...")
    print("📊 Initializing database...")
    
    # Create inspector to check existing schema
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Check if migration is needed (old columns exist)
    needs_migration = False
    if 'drives' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('drives')]
        needs_migration = 'target_colleges' in columns
    
    # Create all tables
    print("  ✓ Creating/updating database tables...")
    create_tables()
    
    # Run migration if needed
    if needs_migration:
        print("  ⚙️ Migrating old targeting data...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        try:
            migrate_old_targeting_data(db)
        finally:
            db.close()
    
    # Initialize sample data
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if colleges exist, if not add sample colleges
        if db.query(College).count() == 0:
            print("  ✓ Adding sample colleges...")
            sample_colleges = [
                "IIT Delhi", "IIT Bombay", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
                "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Calicut",
                "BITS Pilani", "VIT Vellore", "Manipal Institute of Technology",
                "Delhi University", "Mumbai University", "Pune University",
                "Anna University", "Jadavpur University", "Osmania University"
            ]
            
            for college_name in sample_colleges:
                college = College(name=college_name, is_approved=True)
                db.add(college)
            
            db.commit()
        
        # Check if student groups exist, if not add sample groups
        if db.query(StudentGroup).count() == 0:
            print("  ✓ Adding sample student groups...")
            sample_groups = [
                "Computer Science Engineering", "Information Technology", 
                "Electronics & Communication", "Mechanical Engineering",
                "Civil Engineering", "Electrical Engineering",
                "MBA Students", "MCA Students", "B.Tech Final Year",
                "M.Tech Students", "PhD Scholars", "Diploma Students",
                "Data Science Students", "AI/ML Students", "Cybersecurity Students"
            ]
            
            for group_name in sample_groups:
                group = StudentGroup(name=group_name, is_approved=True)
                db.add(group)
            
            db.commit()
        
        print("✅ Database initialization complete!")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Company Exam Portal API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
