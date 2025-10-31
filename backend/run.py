"""
Company Exam Portal - FastAPI Backend

To run the application:
1. Install dependencies: pip install -r requirements.txt
2. Set up PostgreSQL database and update DATABASE_URL in .env
3. Run: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Default admin credentials:
Username: admin
Password: admin123
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
