from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_router, admin_router, company_router
from app.database import create_tables
from app.database.migrations import migrate_old_targeting_data, migrate_company_status_fields, initialize_sample_data
from app.database.connection import engine, Base
from app.models import *  # Import all models for migrations and sample data
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
    
    # Check if company status migration is needed
    needs_company_migration = False
    if 'companies' in existing_tables:
        columns = [col['name'] for col in inspector.get_columns('companies')]
        needs_company_migration = 'status' not in columns
    
    # Run company status migration if needed
    if needs_company_migration:
        print("  ⚙️ Migrating company status fields...")
        migrate_company_status_fields()
    
# Initialize sample data
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        initialize_sample_data(db)
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
