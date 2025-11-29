// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    ENDPOINTS: {
        // Auth
        ADMIN_LOGIN: '/api/auth/admin/login',
        COMPANY_LOGIN: '/api/auth/company/login',
        COMPANY_REGISTER: '/api/auth/company/register',
        
        // Admin
        ADMIN_COMPANIES: '/api/admin/companies',
        ADMIN_APPROVE_COMPANY: (id) => `/api/admin/companies/${id}/approve`,
        ADMIN_REJECT_COMPANY: (id) => `/api/admin/companies/${id}/reject`,
        ADMIN_DRIVES: '/api/admin/drives',
        ADMIN_APPROVE_DRIVE: (id) => `/api/admin/drives/${id}/approve`,
        ADMIN_SUSPEND_DRIVE: (id) => `/api/admin/drives/${id}/suspend`,
        ADMIN_REACTIVATE_DRIVE: (id) => `/api/admin/drives/${id}/reactivate`,
        ADMIN_DRIVE_DETAIL: (id) => `/api/admin/drives/${id}/detail`,
        ADMIN_COLLEGES: '/api/admin/colleges',
        ADMIN_STUDENT_GROUPS: '/api/admin/student-groups',
        ADMIN_PENDING_COLLEGES: '/api/admin/colleges/pending',
        ADMIN_APPROVE_CUSTOM_COLLEGE: '/api/admin/colleges/approve-custom',
        ADMIN_APPROVE_COLLEGE: (id) => `/api/admin/colleges/${id}/approve`,
        ADMIN_PENDING_GROUPS: '/api/admin/student-groups/pending',
        ADMIN_APPROVE_CUSTOM_GROUP: '/api/admin/student-groups/approve-custom',
        ADMIN_APPROVE_GROUP: (id) => `/api/admin/student-groups/${id}/approve`,
        
        // Company
        COMPANY_DRIVES: '/api/company/drives',
        COMPANY_CREATE_DRIVE: '/api/company/drives',
        COMPANY_DRIVE_DETAIL: (id) => `/api/company/drives/${id}`,
        COMPANY_UPDATE_DRIVE: (id) => `/api/company/drives/${id}`,
        COMPANY_DELETE_DRIVE: (id) => `/api/company/drives/${id}`,
        COMPANY_SUBMIT_DRIVE: (id) => `/api/company/drives/${id}/submit`,
        COMPANY_DUPLICATE_DRIVE: (id) => `/api/company/drives/${id}/duplicate`,
        
        // Questions
        COMPANY_QUESTIONS: (driveId) => `/api/company/drives/${driveId}/questions`,
        COMPANY_UPLOAD_QUESTIONS: (driveId) => `/api/company/drives/${driveId}/questions/csv-upload`,
        
        // Students
        COMPANY_STUDENTS: (driveId) => `/api/company/drives/${driveId}/students`,
        COMPANY_UPLOAD_STUDENTS: (driveId) => `/api/company/drives/${driveId}/students/csv-upload`,
        
        // Email
        COMPANY_EMAIL_TEMPLATE: '/api/company/email-template',
        COMPANY_EMAIL_PREVIEW: '/api/company/email-template/preview',
        COMPANY_SEND_EMAILS: (driveId) => `/api/company/drives/${driveId}/email-students`,
        COMPANY_EMAIL_STATUS: (driveId) => `/api/company/drives/${driveId}/email-status`,
        
        // Reference Data
        COMPANY_COLLEGES: '/api/company/colleges',
        COMPANY_STUDENT_GROUPS: '/api/company/student-groups',
    }
};

// Utility functions
const API = {
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Get user type from localStorage
    getUserType() {
        return localStorage.getItem('userType');
    },

    // Set auth data
    setAuth(token, userType) {
        localStorage.setItem('token', token);
        localStorage.setItem('userType', userType);
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Make authenticated request
    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
                ...options,
                headers
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                this.clearAuth();
                window.location.href = '/index.html';
                throw new Error('Unauthorized');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Upload file
    async uploadFile(url, formData) {
        const token = this.getToken();
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
};

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format status badge
function getStatusBadge(status) {
    const statusMap = {
        'pending': 'badge-pending',
        'approved': 'badge-approved',
        'rejected': 'badge-rejected',
        'suspended': 'badge-warning',
        'draft': 'badge-draft',
        'submitted': 'badge-submitted'
    };
    
    return `<span class="badge ${statusMap[status] || 'badge-pending'}">${status}</span>`;
}

// Check authentication on protected pages
function requireAuth(requiredType) {
    if (!API.isAuthenticated()) {
        window.location.href = '/index.html';
        return false;
    }
    
    const userType = API.getUserType();
    if (requiredType && userType !== requiredType) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// Logout
function logout() {
    API.clearAuth();
    window.location.href = '/index.html';
}
