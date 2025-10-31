from app.database.connection import Base, engine
from app.models import Admin, Company, Drive, Question, College, StudentGroup

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)
