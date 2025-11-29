# Company Exam Portal - Frontend

A modern, responsive frontend for the Company Exam Portal built with HTML, CSS, and JavaScript.

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for running the development server)
- Backend API running on `http://localhost:8000`

### Running the Frontend

1. **Start the frontend server:**
   ```bash
   python server.py
   ```

2. **Access the application:**
   - Frontend: http://localhost:3001
   - Home Page: http://localhost:3001/index.html

## 📱 Application Structure

### Public Pages
- **Home Page** (`index.html`) - Landing page with portal information
- **Admin Login** (`admin-login.html`) - Admin authentication
- **Company Login** (`company-login.html`) - Company authentication
- **Company Register** (`company-register.html`) - Company registration

### Admin Dashboard
- **Companies** (`admin-dashboard.html`) - Manage company registrations
- **Drives** (`admin-drives.html`) - Approve/reject drives
- **Reference Data** (`admin-colleges.html`) - Manage colleges and student groups

### Company Dashboard
- **Drives** (`company-dashboard.html`) - View and manage recruitment drives
- **Create Drive** (`company-create-drive.html`) - Create new recruitment drives
- **Drive Details** (`company-drive-detail.html`) - Upload questions and students
- **Send Emails** (`company-send-emails.html`) - Configure and send email invitations

## 🎨 Features

### Admin Features
✅ Approve/reject company registrations
✅ Approve/reject recruitment drives
✅ View drive details with questions and students
✅ Manage colleges and student groups
✅ Filter companies and drives by status

### Company Features
✅ Register and login
✅ Create recruitment drives with targeting
✅ Upload questions via CSV
✅ Upload students via CSV
✅ Submit drives for approval
✅ Duplicate existing drives
✅ Configure custom email templates
✅ Send email invitations to students

## 📁 File Structure

```
frontend/
├── index.html                    # Home page
├── admin-login.html              # Admin login
├── admin-dashboard.html          # Admin: Companies
├── admin-drives.html             # Admin: Drives
├── admin-colleges.html           # Admin: Reference data
├── company-login.html            # Company login
├── company-register.html         # Company registration
├── company-dashboard.html        # Company: Drives list
├── company-create-drive.html     # Company: Create drive
├── company-drive-detail.html     # Company: Drive details
├── company-send-emails.html      # Company: Email configuration
├── server.py                     # Development server
├── css/
│   └── styles.css                # All styles
└── js/
    └── config.js                 # API configuration & utilities
```

## 🔧 Configuration

### API Endpoint Configuration
Edit `js/config.js` to change the backend API URL:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',  // Change this if backend is on different URL
    // ...
};
```

## 📝 CSV File Formats

### Questions CSV Format
```csv
question,option_a,option_b,option_c,option_d,correct_answer,points
"What is 2+2?","3","4","5","6","4",1
```

### Students CSV Format
```csv
roll_number,email,name
CS001,student1@college.edu,John Doe
CS002,student2@college.edu,Jane Smith
```

## 🎯 Default Credentials

### Admin
- **Username:** `admin`
- **Password:** `admin123`

## 🔒 Authentication

The application uses JWT (JSON Web Token) based authentication:
- Tokens are stored in `localStorage`
- Automatic redirect on authentication failure
- Protected routes check authentication status

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📦 No Build Process Required

This is a pure HTML/CSS/JavaScript application with **no build process** or dependencies. Just serve the files and you're ready to go!

## 🔍 API Integration

All API calls are handled through the `API` utility in `js/config.js`:

```javascript
// Example API call
const data = await API.request('/api/company/drives', {
    method: 'POST',
    body: JSON.stringify(driveData)
});
```

## 🐛 Troubleshooting

### CORS Issues
If you encounter CORS issues:
1. Make sure backend CORS is configured correctly
2. Check that backend is running on expected URL
3. Verify `API_CONFIG.BASE_URL` matches your backend

### Authentication Issues
1. Check browser console for errors
2. Verify backend is returning valid JWT tokens
3. Clear localStorage and try logging in again

### File Upload Issues
1. Verify CSV format matches expected structure
2. Check backend logs for detailed error messages
3. Ensure file size is within limits

## 📚 Additional Resources

- Sample CSV files are available for download from the drive detail page
- Email template variables are documented in the send emails page
- Status badges indicate current state of companies and drives

## 🤝 Support

For issues or questions:
1. Check backend logs
2. Check browser console
3. Verify API endpoints are accessible

## 📄 License

Part of the Company Exam Portal project.
