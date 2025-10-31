# Company Exam Portal

A comprehensive platform for managing placement drives and exams.

## Features

### Admin Dashboard
- **Company Management**: Approve/reject company registrations
- **Drive Management**: Approve/reject placement drives
- **Analytics**: View statistics and reports
- **College/Group Management**: Manage target colleges and student groups

### Company Dashboard
- **Drive Creation**: Create placement drives with different question types (Aptitude, Coding, Technical, HR)
- **Question Management**: Add questions via forms or bulk upload templates
- **Drive Scheduling**: Schedule drives for future dates
- **Drive Duplication**: Copy existing drives with all questions
- **Targeting**: Target specific colleges and student groups

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: Python SQL toolkit and ORM
- **JWT**: Secure authentication
- **Pydantic**: Data validation using Python type annotations

### Frontend
- **HTML/CSS/JavaScript**: Pure frontend without frameworks
- **Responsive Design**: Works on desktop and mobile devices
- **REST API Integration**: Communicates with FastAPI backend

## Project Structure

```
company-exam-portal/
├── backend/
│   ├── app/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── database/       # Database configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── utils/          # Utility functions
│   │   └── main.py         # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── run.py             # Application runner
└── frontend/
    ├── static/
    │   ├── css/           # Stylesheets
    │   └── js/            # JavaScript files
    └── templates/         # HTML templates
        ├── admin/         # Admin dashboard pages
        └── company/       # Company dashboard pages
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Node.js (optional, for frontend development)

### Quick Start

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   
   # Activate virtual environment
   # Windows:
   .\.venv\Scripts\Activate.ps1
   # Linux/Mac:
   source .venv/bin/activate
   
   pip install -r requirements.txt
   
   # Configure .env file with your database settings
   DATABASE_URL=postgresql://username:password@localhost/company_exam_portal
   SECRET_KEY=your-secret-key-here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   
   # Start backend API server - Everything auto-initializes!
   uvicorn app.main:app --reload
   ```
   
   ✅ **Auto-creates database tables**
   ✅ **Auto-migrates old data** (if upgrading)
   ✅ **Auto-adds 18 sample colleges**
   ✅ **Auto-adds 15 sample student groups**
   ✅ **Ready to use immediately!**

2. **Frontend Setup**
   ```bash
   cd frontend
   
   # Option 1: Use VS Code Live Server extension (Recommended)
   # Right-click index.html → "Open with Live Server"
   
   # Option 2: Use any HTTP server
   python -m http.server 3000
   # or
   npx serve .
   ```

### Access Points

- **Frontend**: http://127.0.0.1:5500 (Live Server) or http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Login**: Frontend URL + `/admin-login.html`
- **Company Login**: Frontend URL + `/company-login.html`
- **Company Registration**: Frontend URL + `/company-register.html`

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Schema

### Key Tables
- **admins**: Admin user accounts
- **companies**: Company registrations (require admin approval)
- **drives**: Placement drives created by companies
- **questions**: Questions associated with each drive
- **colleges**: Target colleges (with approval system)
- **student_groups**: Target student groups (with approval system)

## Authentication Flow

### Admin
1. Login with predefined credentials
2. Receive JWT token
3. Access admin-only endpoints

### Company
1. Register with company details
2. Wait for admin approval
3. Login after approval
4. Receive JWT token
5. Access company endpoints

## Drive Management Flow

### For Companies
1. **Create Drive**: Basic drive information
2. **Add Questions**: Individual or bulk upload
3. **Submit for Approval**: Complete drive with questions
4. **Admin Review**: Wait for admin approval/rejection
5. **Go Live**: Approved drives can be started

### For Admins
1. **Review Drives**: View all submitted drives
2. **Check Questions**: Verify question quality
3. **Approve/Reject**: Make approval decisions
4. **Add Notes**: Provide feedback to companies

## Question Types Supported

- **Aptitude**: Logical reasoning, quantitative aptitude
- **Coding**: Programming challenges, algorithms
- **Technical**: Domain-specific technical questions
- **HR**: Behavioral and situational questions

## Deployment

### Production Environment Variables
```bash
DATABASE_URL=postgresql://prod_user:prod_password@prod_host/prod_db
SECRET_KEY=super-secret-production-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "run.py"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.
