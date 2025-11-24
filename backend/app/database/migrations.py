"""
Database migration utilities for Company Exam Portal
"""
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import json
from app.models import Drive, DriveTarget, College, StudentGroup, Company

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
            from app.database.connection import engine
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS target_colleges CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS target_student_groups CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS custom_colleges CASCADE"))
                conn.execute(text("ALTER TABLE drives DROP COLUMN IF EXISTS custom_student_groups CASCADE"))
            
            print("  ✓ Removed old targeting columns")
        
    except Exception as e:
        print(f"  ⚠️ Migration error: {e}")
        db.rollback()

def migrate_company_status_fields():
    """Add status, admin_notes, reviewed_at, reviewed_by fields to Company table"""
    from app.database.connection import engine
    
    try:
        print("    ⚙️ Adding company status tracking fields...")
        
        # Add new columns
        with engine.connect() as connection:
            trans = connection.begin()
            try:
                # Add status column
                connection.execute(text("""
                    ALTER TABLE companies 
                    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
                """))
                
                # Add admin_notes column
                connection.execute(text("""
                    ALTER TABLE companies 
                    ADD COLUMN IF NOT EXISTS admin_notes TEXT
                """))
                
                # Add reviewed_at column
                connection.execute(text("""
                    ALTER TABLE companies 
                    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
                """))
                
                # Add reviewed_by column
                connection.execute(text("""
                    ALTER TABLE companies 
                    ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255)
                """))
                
                # Migrate existing data
                connection.execute(text("""
                    UPDATE companies 
                    SET status = CASE
                        WHEN is_approved = true THEN 'approved'
                        WHEN is_approved = false AND logo_url = 'REJECTED' THEN 'rejected'
                        WHEN is_approved = false AND EXISTS(
                            SELECT 1 FROM drives WHERE drives.company_id = companies.id
                        ) THEN 'suspended'
                        ELSE 'pending'
                    END
                    WHERE status IS NULL OR status = 'pending'
                """))
                
                # Clear hacky logo_url field
                connection.execute(text("""
                    UPDATE companies 
                    SET logo_url = NULL 
                    WHERE logo_url = 'REJECTED'
                """))
                
                trans.commit()
                
                # Show migration summary
                result = connection.execute(text("""
                    SELECT status, COUNT(*) as count 
                    FROM companies 
                    GROUP BY status 
                    ORDER BY status
                """))
                
                print("    ✓ Company status migration completed!")
                for row in result:
                    print(f"      - {row[0]}: {row[1]} companies")
                        
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"    ❌ Company status migration error: {e}")

def initialize_sample_data(db):
    """Initialize sample colleges and student groups if they don't exist"""
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