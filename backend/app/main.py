from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_router, admin_router, company_router
from app.database import create_tables
from app.database.migrations import migrate_old_targeting_data, migrate_company_status_fields, initialize_sample_data
from app.database.connection import engine
from app.models import *  # Import all models for migrations and sample data
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect

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

@app.on_event("startup")
async def startup_event():
    """Create database tables, migrate old data, and initialize sample data on startup"""
    print("🚀 Starting Company Exam Portal...")
    print("📊 Initializing database...")
    
    # Create inspector to check existing schema
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Create all tables
    print("  ✓ Creating/updating database tables...")
    create_tables()
    
    # Check and run migrations
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if targeting data migration is needed
        if 'drives' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('drives')]
            if 'target_colleges' in columns:
                print("  ⚙️ Migrating old targeting data...")
                migrate_old_targeting_data(db)
        
        # Check if company status migration is needed
        if 'companies' in existing_tables:
            columns = [col['name'] for col in inspector.get_columns('companies')]
            if 'status' not in columns:
                print("  ⚙️ Migrating company status fields...")
                migrate_company_status_fields()
        
        # Initialize sample data
        print("  ⚙️ Initializing sample data...")
        initialize_sample_data(db)
        
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
