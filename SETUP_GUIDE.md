# Setup and Deployment Guide

## Complete Setup Instructions

### Part 1: Backend Setup

#### 1.1 Install Dependencies

```bash
cd cxp/backend
pip install -r requirements.txt
```

#### 1.2 Configure Environment

Create a `.env` file in `backend/` directory (or use existing `app/database/config.py`):

```env
DATABASE_URL=sqlite:///./exam_portal.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### 1.3 Initialize Database

```bash
python app/main.py
# Or use:
python -c "from app.database import create_tables; create_tables()"
```

#### 1.4 Run Backend Server

```bash
cd cxp/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

---

### Part 2: Frontend-React Setup

#### 2.1 Install Dependencies

```bash
cd cxp/frontend-react
npm install
```

#### 2.2 Configure API Base URL

The frontend is already configured to use `/api` relative path, which works with:

- **Development:** Proxy through Vite dev server
- **Production:** Served from same domain as backend

For custom API URL, edit `src/lib/api.js`:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Change this if needed
  headers: { 'Content-Type': 'application/json' },
});
```

#### 2.3 Run Development Server

```bash
cd cxp/frontend-react
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

#### 2.4 Build for Production

```bash
npm run build
```

Output files in `dist/` directory ready for deployment.

---

## Testing the Integration

### Quick Test Checklist

1. **Backend Running?**

   ```bash
   curl http://localhost:8000/health
   # Should return {"status": "ok"}
   ```

2. **Frontend Running?**

   - Open `http://localhost:5173` in browser
   - Should see landing page

3. **Can Access Admin Login?**

   - Navigate to `http://localhost:5173/admin/login`
   - Should load login form

4. **Can Login as Admin?**

   - Username: `admin`
   - Password: `admin123`
   - Should see admin dashboard

5. **Can Access Company Login?**

   - Navigate to `http://localhost:5173/company/login`
   - Should load login form

6. **Can Register Company?**

   - Navigate to `http://localhost:5173/company/register`
   - Fill form and submit
   - Should see success message

7. **Can View API Docs?**
   - Visit `http://localhost:8000/docs`
   - Should see Swagger UI with all endpoints

---

## Project Structure

```
cxp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py (FastAPI app)
│   │   ├── auth/
│   │   │   ├── security.py (JWT handling)
│   │   │   └── __init__.py
│   │   ├── database/
│   │   │   ├── config.py (Settings)
│   │   │   ├── connection.py (SQLAlchemy)
│   │   │   └── __init__.py
│   │   ├── models/ (ORM models)
│   │   ├── schemas/ (Pydantic schemas)
│   │   ├── routes/ (API endpoints)
│   │   └── utils/ (Helper functions)
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── admin-dashboard.html
│   ├── admin-login.html
│   ├── company-dashboard.html
│   ├── company-login.html
│   ├── company-register.html
│   ├── js/
│   │   └── config.js (API client)
│   ├── css/
│   │   └── styles.css
│   ├── server.py (Simple server)
│   └── README.md
│
├── frontend-react/ ← YOUR WORKING DIRECTORY
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx ✅
│   │   │   ├── AdminDashboard.jsx ✅
│   │   │   ├── CompanyLogin.jsx ✅
│   │   │   ├── CompanyRegister.jsx ✅
│   │   │   └── CompanyDashboard.jsx ✅
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx ✅
│   │   ├── lib/
│   │   │   ├── api.js ✅
│   │   │   └── companyApi.js ✅
│   │   ├── App.jsx ✅
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── INTEGRATION_SUMMARY.md
│   ├── TESTING_GUIDE.md
│   └── README.md
│
└── requirements.txt
```

---

## Key Features Implemented

### Authentication ✅

- Admin login (username/password)
- Company registration with approval workflow
- Company login (username/password)
- JWT token management
- Session persistence
- Logout functionality

### Admin Dashboard ✅

- View all companies with status filtering
- Approve/reject company registrations
- Suspend/activate companies
- View company drives and enrolled students
- Manage colleges and student groups
- Approve pending colleges and groups
- Drive approval and suspension

### Company Dashboard ✅

- Create recruitment drives
- Select target audience (colleges, student groups, batch years)
- Add custom colleges/groups (pending admin approval)
- Manage drive questions (add, edit, view)
- Manage student enrollment (upload via CSV)
- Submit drives for admin approval
- View drive status and admin notes
- Duplicate drives for easy resubmission
- Delete drives
- Email template management
- Send emails to enrolled students

### Data Management ✅

- Company information
- Drive configuration
- Questions and answers
- Student enrollment
- Email templates and sending status
- College and student group management

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=sqlite:///./exam_portal.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/exam_portal

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Environment
ENVIRONMENT=development  # or production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (if needed)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=Company Exam Portal
```

---

## Troubleshooting

### Issue: CORS Error when accessing API

**Solution:**

1. Verify backend CORS configuration
2. Check that frontend URL is in `ALLOWED_ORIGINS`
3. Restart backend after changing CORS settings

### Issue: Token not being sent with requests

**Solution:**

1. Check localStorage for `cxp_auth` key
2. Verify browser DevTools > Application > LocalStorage
3. Check Network tab to see Authorization header

### Issue: 404 Not Found on API endpoints

**Solution:**

1. Verify backend is running on port 8000
2. Check API endpoint URL spelling in frontend
3. Review backend route definitions

### Issue: Database connection error

**Solution:**

1. Verify DATABASE_URL in .env
2. Ensure database file path is writable
3. Run database initialization
4. Check SQLite file exists: `exam_portal.db`

### Issue: Frontend blank page

**Solution:**

1. Check browser console (F12) for errors
2. Verify npm dependencies installed
3. Restart dev server (`npm run dev`)
4. Clear browser cache and localStorage

### Issue: Login not working

**Solution:**

1. Check backend API logs
2. Verify credentials are correct
3. Check if user exists in database
4. For companies, check if approved by admin

---

## Production Deployment

### Backend Deployment

```bash
# Build
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000

# Or use Docker
docker build -t exam-portal-backend .
docker run -p 8000:8000 exam-portal-backend
```

### Frontend Deployment

```bash
# Build
npm run build

# Deploy dist/ folder to:
# - Vercel: npm i -g vercel && vercel
# - Netlify: https://app.netlify.com/
# - GitHub Pages: Push dist/ to gh-pages branch
# - Traditional hosting: Upload dist/ to web server
```

### Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - '8000:8000'
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/exam_portal
    depends_on:
      - db

  frontend:
    build: ./frontend-react
    ports:
      - '3000:3000'
    environment:
      VITE_API_BASE_URL: http://backend:8000/api

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: exam_portal
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

---

## Performance Optimization

### Frontend

1. **Code Splitting:** Routes are automatically split with React Router
2. **Lazy Loading:** Components load on demand
3. **Asset Optimization:** Use `npm run build` for minification
4. **Caching:** Browser cache API responses
5. **CDN:** Serve static files from CDN in production

### Backend

1. **Database Indexing:** Add indexes on frequently queried fields
2. **Query Optimization:** Use `select_in_load()` for relationships
3. **Caching:** Implement Redis for session/data caching
4. **Pagination:** Use limit/offset for large datasets
5. **Connection Pooling:** Configure SQLAlchemy pool settings

---

## Security Considerations

### Frontend

- ✅ JWT tokens stored securely
- ✅ HTTPS enforced in production
- ✅ CSRF protection via SameSite cookies
- ✅ Input validation on forms
- ✅ Protected routes with auth guards

### Backend

- ✅ Password hashing with bcrypt
- ✅ JWT token validation
- ✅ CORS security
- ✅ SQL injection prevention via ORM
- ✅ Rate limiting recommended
- ✅ Input validation on all endpoints

### Best Practices

1. Use HTTPS in production
2. Set secure environment variables
3. Regularly update dependencies
4. Implement rate limiting
5. Add logging and monitoring
6. Use strong JWT secret
7. Implement refresh token rotation
8. Add API key authentication for sensitive operations

---

## Maintenance

### Regular Tasks

- [ ] Check application logs weekly
- [ ] Monitor database size
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review error rates
- [ ] Monitor API response times

### Database Maintenance

```bash
# SQLite
sqlite3 exam_portal.db "VACUUM;"

# PostgreSQL
psql -U user -d exam_portal -c "VACUUM ANALYZE;"
```

---

## Support & Documentation

- **API Documentation:** `http://localhost:8000/docs`
- **OpenAPI Schema:** `http://localhost:8000/openapi.json`
- **Frontend Docs:** See `frontend-react/README.md`
- **Backend Docs:** See `backend/README.md`

---

## Version Information

- **Node.js:** 18+
- **Python:** 3.8+
- **React:** 18+
- **FastAPI:** Latest
- **SQLAlchemy:** 2.0+
- **Tailwind CSS:** Latest

---

## License & Credits

- **Backend:** FastAPI + SQLAlchemy
- **Frontend:** React + Vite + Tailwind CSS
- **Original HTML/CSS/JS Frontend:** Friend's implementation
- **Integration:** React modernization while preserving functionality

---

## Quick Start Summary

### For Development:

```bash
# Terminal 1 - Backend
cd cxp/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd cxp/frontend-react
npm install
npm run dev

# Visit: http://localhost:5173
```

### For Production:

```bash
# Build
npm run build

# Deploy dist/ folder to hosting
# Start backend: gunicorn app.main:app -w 4 -b 0.0.0.0:8000
```

---

**Happy coding! 🚀**

For detailed testing procedures, see `TESTING_GUIDE.md`
For integration details, see `INTEGRATION_SUMMARY.md`
