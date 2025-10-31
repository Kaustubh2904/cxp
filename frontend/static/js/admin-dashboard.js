// Admin Dashboard JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!Navigation.checkAuth()) return;
    
    // Load initial data
    loadDashboardData();
    loadCompanies();
});

// Dashboard data loading
async function loadDashboardData() {
    try {
        const [companies, drives] = await Promise.all([
            ApiService.getCompanies(),
            ApiService.getAllDrives()
        ]);
        
        document.getElementById('total-companies').textContent = companies.length;
        document.getElementById('pending-companies').textContent = companies.filter(c => !c.is_approved).length;
        document.getElementById('total-drives').textContent = drives.length;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    const sections = ['companies-section', 'drives-section', 'colleges-section', 'groups-section'];
    sections.forEach(section => {
        document.getElementById(section).style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').style.display = 'block';
    
    // Load section data
    switch(sectionName) {
        case 'companies':
            loadCompanies();
            break;
        case 'drives':
            loadDrives();
            break;
        case 'colleges':
            loadColleges();
            break;
        case 'groups':
            loadStudentGroups();
            break;
    }
}

// Company management
async function loadCompanies() {
    const tbody = document.getElementById('companies-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    try {
        const companies = await ApiService.getCompanies();
        
        if (companies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No companies found</td></tr>';
            return;
        }
        
        tbody.innerHTML = companies.map(company => `
            <tr>
                <td>${company.id}</td>
                <td>${company.name}</td>
                <td>${company.email}</td>
                <td>${UIUtils.formatDate(company.created_at)}</td>
                <td>
                    <span class="badge ${company.is_approved ? 'badge-success' : 'badge-warning'}">
                        ${company.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                </td>
                <td>
                    ${!company.is_approved ? `
                        <button class="btn btn-success btn-sm" onclick="approveCompany(${company.id}, true)">
                            Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="approveCompany(${company.id}, false)">
                            Reject
                        </button>
                    ` : `
                        <button class="btn btn-warning btn-sm" onclick="approveCompany(${company.id}, false)">
                            Suspend
                        </button>
                    `}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading companies</td></tr>';
        UIUtils.showAlert('Error loading companies: ' + error.message, 'danger');
    }
}

async function approveCompany(companyId, isApproved) {
    if (!confirm(`Are you sure you want to ${isApproved ? 'approve' : 'reject'} this company?`)) {
        return;
    }
    
    try {
        await ApiService.approveCompany(companyId, isApproved);
        UIUtils.showAlert(
            `Company ${isApproved ? 'approved' : 'rejected'} successfully`, 
            'success'
        );
        loadCompanies();
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error updating company: ' + error.message, 'danger');
    }
}

// Drive management
async function loadDrives(filter = 'pending') {
    const tbody = document.getElementById('drives-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';
    
    try {
        const [drives, companies] = await Promise.all([
            ApiService.getAllDrives(filter),
            ApiService.getCompanies()
        ]);
        
        // Create company lookup map
        const companyMap = {};
        companies.forEach(company => {
            companyMap[company.id] = company;
        });
        
        if (drives.length === 0) {
            const message = filter === 'pending' ? 
                'No drives pending approval' : 
                `No ${filter} drives found`;
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">${message}</td></tr>`;
            return;
        }
        
        tbody.innerHTML = drives.map(drive => {
            const company = companyMap[drive.company_id] || { name: 'Unknown Company', email: 'N/A' };
            return `
            <tr>
                <td>${drive.id}</td>
                <td>${drive.title}</td>
                <td>
                    <strong>${company.name}</strong><br>
                    <small>${company.email}</small>
                </td>
                <td><span class="badge badge-secondary">${drive.question_type.toUpperCase()}</span></td>
                <td>${UIUtils.getStatusBadge(drive.status)}</td>
                <td>
                    <span class="badge ${drive.is_approved ? 'badge-success' : 'badge-warning'}">
                        ${drive.is_approved ? 'APPROVED' : drive.status === 'submitted' ? 'PENDING' : 'DRAFT'}
                    </span>
                </td>
                <td>${UIUtils.formatDate(drive.created_at)}</td>
                <td>
                    ${!drive.is_approved && drive.status === 'submitted' ? `
                        <button class="btn btn-success btn-sm" onclick="approveDrive(${drive.id}, true)">
                            Approve
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="approveDrive(${drive.id}, false)">
                            Reject
                        </button>
                    ` : drive.is_approved ? `
                        <span class="badge badge-success">APPROVED</span>
                    ` : drive.status === 'draft' ? `
                        <span class="badge badge-secondary">DRAFT</span>
                    ` : drive.status === 'rejected' ? `
                        <span class="badge badge-danger">REJECTED</span>
                    ` : ''}
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error loading drives</td></tr>';
        UIUtils.showAlert('Error loading drives: ' + error.message, 'danger');
    }
}

async function approveDrive(driveId, isApproved) {
    const adminNotes = prompt(
        `${isApproved ? 'Approve' : 'Reject'} this drive. Add notes (optional):`
    );
    
    if (adminNotes === null) return; // User cancelled
    
    try {
        await ApiService.approveDrive(driveId, isApproved, adminNotes || null);
        UIUtils.showAlert(
            `Drive ${isApproved ? 'approved' : 'rejected'} successfully`, 
            'success'
        );
        loadDrives();
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error updating drive: ' + error.message, 'danger');
    }
}

// College and Student Group management
async function loadColleges() {
    const tbody = document.getElementById('colleges-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    
    try {
        const colleges = await ApiService.getAllColleges();
        
        if (colleges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No colleges found. <a href="#" onclick="showAddCollegeForm()">Add the first college</a></td></tr>';
            return;
        }
        
        tbody.innerHTML = colleges.map(college => `
            <tr>
                <td>${college.id}</td>
                <td>${college.name}</td>
                <td>
                    <span class="badge ${college.is_approved ? 'badge-success' : 'badge-warning'}">
                        ${college.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                </td>
                <td>${UIUtils.formatDate(college.created_at)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editCollege(${college.id}, '${college.name}')">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCollege(${college.id}, '${college.name}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading colleges</td></tr>';
        UIUtils.showAlert('Error loading colleges: ' + error.message, 'danger');
    }
}

async function loadStudentGroups() {
    const tbody = document.getElementById('groups-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    
    try {
        const groups = await ApiService.getAllStudentGroups();
        
        if (groups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No student groups found. <a href="#" onclick="showAddGroupForm()">Add the first group</a></td></tr>';
            return;
        }
        
        tbody.innerHTML = groups.map(group => `
            <tr>
                <td>${group.id}</td>
                <td>${group.name}</td>
                <td>
                    <span class="badge ${group.is_approved ? 'badge-success' : 'badge-warning'}">
                        ${group.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                </td>
                <td>${UIUtils.formatDate(group.created_at)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editStudentGroup(${group.id}, '${group.name}')">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudentGroup(${group.id}, '${group.name}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading student groups</td></tr>';
        UIUtils.showAlert('Error loading student groups: ' + error.message, 'danger');
    }
}

// College management functions
function showAddCollegeForm() {
    const name = prompt('Enter college name:');
    if (name && name.trim()) {
        addCollege(name.trim());
    }
}

async function addCollege(name) {
    try {
        await ApiService.createCollege(name);
        UIUtils.showAlert('College added successfully!', 'success');
        loadColleges();
    } catch (error) {
        UIUtils.showAlert('Error adding college: ' + error.message, 'danger');
    }
}

function editCollege(collegeId, currentName) {
    const newName = prompt('Edit college name:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        updateCollege(collegeId, newName.trim());
    }
}

async function updateCollege(collegeId, name) {
    try {
        await ApiService.updateCollege(collegeId, { name });
        UIUtils.showAlert('College updated successfully!', 'success');
        loadColleges();
    } catch (error) {
        UIUtils.showAlert('Error updating college: ' + error.message, 'danger');
    }
}

async function deleteCollege(collegeId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await ApiService.deleteCollege(collegeId);
        UIUtils.showAlert('College deleted successfully!', 'success');
        loadColleges();
    } catch (error) {
        UIUtils.showAlert('Error deleting college: ' + error.message, 'danger');
    }
}

// Student Group management functions
function showAddGroupForm() {
    const name = prompt('Enter student group name:');
    if (name && name.trim()) {
        addStudentGroup(name.trim());
    }
}

async function addStudentGroup(name) {
    try {
        await ApiService.createStudentGroup(name);
        UIUtils.showAlert('Student group added successfully!', 'success');
        loadStudentGroups();
    } catch (error) {
        UIUtils.showAlert('Error adding student group: ' + error.message, 'danger');
    }
}

function editStudentGroup(groupId, currentName) {
    const newName = prompt('Edit student group name:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        updateStudentGroup(groupId, newName.trim());
    }
}

async function updateStudentGroup(groupId, name) {
    try {
        await ApiService.updateStudentGroup(groupId, { name });
        UIUtils.showAlert('Student group updated successfully!', 'success');
        loadStudentGroups();
    } catch (error) {
        UIUtils.showAlert('Error updating student group: ' + error.message, 'danger');
    }
}

async function deleteStudentGroup(groupId, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await ApiService.deleteStudentGroup(groupId);
        UIUtils.showAlert('Student group deleted successfully!', 'success');
        loadStudentGroups();
    } catch (error) {
        UIUtils.showAlert('Error deleting student group: ' + error.message, 'danger');
    }
}
