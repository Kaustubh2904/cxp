// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Token management
class TokenManager {
    static setToken(token) {
        localStorage.setItem('access_token', token);
    }
    
    static getToken() {
        return localStorage.getItem('access_token');
    }
    
    static removeToken() {
        localStorage.removeItem('access_token');
    }
    
    static getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
}

// API Service
class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: TokenManager.getHeaders(),
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'An error occurred');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Authentication
    static async adminLogin(username, password) {
        return this.request('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }
    
    static async companyLogin(email, password) {
        return this.request('/auth/company/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
    
    static async companyRegister(name, email, password, logo_url = null) {
        return this.request('/auth/company/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, logo_url })
        });
    }
    
    // Admin APIs
    static async getCompanies() {
        return this.request('/admin/companies');
    }
    
    static async approveCompany(companyId, isApproved) {
        return this.request(`/admin/companies/${companyId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ is_approved: isApproved })
        });
    }
    
    static async getAllDrives(filter = 'pending') {
        return this.request(`/admin/drives?status_filter=${filter}`);
    }
    
    static async approveDrive(driveId, isApproved, adminNotes = null) {
        return this.request(`/admin/drives/${driveId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ is_approved: isApproved, admin_notes: adminNotes })
        });
    }
    
    // Company APIs
    static async getCompanyDrives() {
        return this.request('/company/drives');
    }
    
    static async createDrive(driveData) {
        return this.request('/company/drives', {
            method: 'POST',
            body: JSON.stringify(driveData)
        });
    }
    
    static async updateDrive(driveId, driveData) {
        return this.request(`/company/drives/${driveId}`, {
            method: 'PUT',
            body: JSON.stringify(driveData)
        });
    }
    
    static async deleteDrive(driveId) {
        return this.request(`/company/drives/${driveId}`, {
            method: 'DELETE'
        });
    }
    
    static async duplicateDrive(driveId) {
        return this.request(`/company/drives/${driveId}/duplicate`, {
            method: 'POST'
        });
    }
    
    static async addQuestion(driveId, questionData) {
        return this.request(`/company/drives/${driveId}/questions`, {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }
    
    static async bulkUploadQuestions(driveId, questions) {
        return this.request(`/company/drives/${driveId}/questions/bulk`, {
            method: 'POST',
            body: JSON.stringify({ questions })
        });
    }
    
    static async getDriveQuestions(driveId) {
        return this.request(`/company/drives/${driveId}/questions`);
    }
    
    static async submitDriveForApproval(driveId) {
        return this.request(`/company/drives/${driveId}/submit`, {
            method: 'PUT'
        });
    }
    
    // Reference data APIs (Company)
    static async getColleges() {
        return this.request('/company/colleges');
    }
    
    static async getStudentGroups() {
        return this.request('/company/student-groups');
    }
    
    // Reference data APIs (Admin)
    static async getAllColleges() {
        return this.request('/admin/colleges');
    }
    
    static async getAllStudentGroups() {
        return this.request('/admin/student-groups');
    }
    
    static async createCollege(name) {
        return this.request('/admin/colleges', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
    
    static async updateCollege(collegeId, data) {
        return this.request(`/admin/colleges/${collegeId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async deleteCollege(collegeId) {
        return this.request(`/admin/colleges/${collegeId}`, {
            method: 'DELETE'
        });
    }
    
    static async createStudentGroup(name) {
        return this.request('/admin/student-groups', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
    
    static async updateStudentGroup(groupId, data) {
        return this.request(`/admin/student-groups/${groupId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async deleteStudentGroup(groupId) {
        return this.request(`/admin/student-groups/${groupId}`, {
            method: 'DELETE'
        });
    }
}

// UI Utilities
class UIUtils {
    static showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
    
    static showLoading(element) {
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        element.prepend(spinner);
        element.disabled = true;
    }
    
    static hideLoading(element) {
        const spinner = element.querySelector('.spinner');
        if (spinner) spinner.remove();
        element.disabled = false;
    }
    
    static formatDate(dateString) {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    static getStatusBadge(status) {
        const badges = {
            'draft': 'badge-secondary',
            'submitted': 'badge-warning',
            'approved': 'badge-success',
            'rejected': 'badge-danger',
            'upcoming': 'badge-warning',
            'live': 'badge-success',
            'ongoing': 'badge-success',
            'completed': 'badge-secondary'
        };
        
        return `<span class="badge ${badges[status] || 'badge-secondary'}">${status.toUpperCase()}</span>`;
    }
}

// Form Validation
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePassword(password) {
        return password.length >= 6;
    }
    
    static validateRequired(value) {
        return value && value.trim().length > 0;
    }
}

// Navigation
class Navigation {
    static redirectTo(path) {
        window.location.href = path;
    }
    
    static isAuthenticated() {
        return !!TokenManager.getToken();
    }
    
    static logout() {
        TokenManager.removeToken();
        this.redirectTo('index.html');
    }
    
    static checkAuth() {
        if (!this.isAuthenticated()) {
            this.redirectTo('index.html');
            return false;
        }
        return true;
    }
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add logout functionality to logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Navigation.logout();
        });
    });
    
    // Add CSRF protection for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Add any global form handling here
        });
    });
});
