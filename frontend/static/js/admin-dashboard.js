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
    const sections = ['companies-section', 'drives-section', 'approvals-section', 'colleges-section', 'groups-section'];
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
        case 'approvals':
            loadPendingApprovals();
            break;
        case 'colleges':
            loadColleges();
            break;
        case 'groups':
            loadStudentGroups();
            break;
    }
}

// Track current company filter
let currentCompanyFilter = 'pending';

// Company management
async function loadCompanies(filter = 'pending') {
    currentCompanyFilter = filter;
    const tbody = document.getElementById('companies-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    
    // Update filter buttons
    updateCompanyFilterButtons(filter);
    
    try {
        const companies = await ApiService.getCompanies(filter);
        console.log(`Loaded ${companies.length} companies for filter '${filter}':`, companies);
        
        if (companies.length === 0) {
            const message = getCompanyEmptyMessage(filter);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">
                <i class="fas fa-building mb-2"></i><br>
                ${message}
            </td></tr>`;
            return;
        }
        
        tbody.innerHTML = companies.map(company => `
            <tr>
                <td>${company.id}</td>
                <td>
                    <div>
                        <strong>${company.name}</strong><br>
                        <small class="text-muted"><i class="fas fa-envelope"></i> ${company.email}</small>
                    </div>
                </td>
                <td>${UIUtils.formatDate(company.created_at)}</td>
                <td>${getCompanyStatusBadge(company, filter)}</td>
                <td>${getCompanyActionButtons(company, filter)}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading companies</td></tr>';
        UIUtils.showAlert('Error loading companies: ' + error.message, 'danger');
    }
}

// Update company filter buttons visual state
function updateCompanyFilterButtons(activeFilter) {
    const filters = ['pending', 'approved', 'suspended', 'rejected', 'all'];
    
    filters.forEach(filter => {
        const button = document.getElementById(`company-filter-${filter}`);
        if (button) {
            if (filter === activeFilter) {
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-primary');
            }
        }
    });
}

// Get empty message for companies based on filter
function getCompanyEmptyMessage(filter) {
    switch(filter) {
        case 'pending': return 'No companies pending approval';
        case 'approved': return 'No active companies found';
        case 'suspended': return 'No suspended companies found';
        case 'rejected': return 'No rejected companies found';
        case 'all': return 'No companies found';
        default: return `No ${filter} companies found`;
    }
}

// Get company status badge
function getCompanyStatusBadge(company, filter) {
    const status = company.status || (company.is_approved ? 'approved' : 'pending');
    
    switch(status) {
        case 'approved':
            return '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Active</span>';
        case 'rejected':
            return '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Rejected</span>';
        case 'suspended':
            return '<span class="badge badge-warning"><i class="fas fa-ban"></i> Suspended</span>';
        case 'pending':
        default:
            return '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending Review</span>';
    }
}

// Get company action buttons based on status and current filter
function getCompanyActionButtons(company, filter) {
    const status = company.status || (company.is_approved ? 'approved' : 'pending');
    
    switch(status) {
        case 'pending':
            return `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success btn-sm" onclick="approveCompany(${company.id}, true)" title="Approve Company">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectCompanyToRejected(${company.id})" title="Reject Company">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        
        case 'approved':
            return `
                <div class="btn-group btn-group-sm">
                    <span class="badge badge-success me-2"><i class="fas fa-check-circle"></i> Active</span>
                    <button class="btn btn-warning btn-sm" onclick="suspendCompany(${company.id})" title="Suspend Company">
                        <i class="fas fa-ban"></i> Suspend
                    </button>
                </div>
            `;
        
        case 'suspended':
            return `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success btn-sm" onclick="reactivateCompany(${company.id})" title="Reactivate Company">
                        <i class="fas fa-play"></i> Reactivate
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectCompanyToRejected(${company.id})" title="Reject Company">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            `;
        
        case 'rejected':
            return `
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success btn-sm" onclick="reactivateRejectedCompany(${company.id})" title="Re-approve Company">
                        <i class="fas fa-undo"></i> Re-approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRejectedCompany(${company.id})" title="Permanently Delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
        
        default:
            return `<span class="badge badge-secondary">-</span>`;
    }
}

async function approveCompany(companyId, isApproved) {
    if (!confirm(`Are you sure you want to approve this company?`)) {
        return;
    }
    
    try {
        await ApiService.approveCompany(companyId, true);
        UIUtils.showAlert('Company approved successfully!', 'success');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error approving company: ' + error.message, 'danger');
    }
}

async function suspendCompany(companyId) {
    const reason = prompt('Why are you suspending this company? (Optional)');
    if (reason === null) return; // User cancelled
    
    if (!confirm('Are you sure you want to suspend this company? They will need admin re-approval to become active again.')) {
        return;
    }
    
    try {
        // Suspend company by setting is_approved to false
        console.log(`Suspending company ID: ${companyId}`);
        await ApiService.approveCompany(companyId, false);
        UIUtils.showAlert('Company suspended successfully!', 'warning');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        console.error('Suspend company error:', error);
        UIUtils.showAlert('Error suspending company: ' + error.message, 'danger');
    }
}

async function reactivateCompany(companyId) {
    if (!confirm('Are you sure you want to reactivate this suspended company?')) {
        return;
    }
    
    try {
        console.log(`Reactivating company ID: ${companyId}`);
        await ApiService.approveCompany(companyId, true);
        UIUtils.showAlert('Company reactivated successfully!', 'success');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        console.error('Reactivate company error:', error);
        UIUtils.showAlert('Error reactivating company: ' + error.message, 'danger');
    }
}

async function rejectCompanyToRejected(companyId) {
    const reason = prompt('Why are you rejecting this company? (Optional)');
    if (reason === null) return; // User cancelled
    
    if (!confirm('Are you sure you want to reject this company? They will be moved to the rejected list and can be re-approved later.')) {
        return;
    }
    
    try {
        console.log(`Rejecting company ID: ${companyId}`);
        await ApiService.rejectCompany(companyId, reason);
        UIUtils.showAlert('Company rejected successfully! It has been moved to the rejected list.', 'warning');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        console.error('Reject company error:', error);
        UIUtils.showAlert('Error rejecting company: ' + error.message, 'danger');
    }
}

async function reactivateRejectedCompany(companyId) {
    if (!confirm('Are you sure you want to re-approve this previously rejected company?')) {
        return;
    }
    
    try {
        console.log(`Re-approving company ID: ${companyId}`);
        await ApiService.approveCompany(companyId, true);
        UIUtils.showAlert('Company re-approved successfully!', 'success');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        console.error('Re-approve company error:', error);
        UIUtils.showAlert('Error re-approving company: ' + error.message, 'danger');
    }
}

async function deleteRejectedCompany(companyId) {
    const confirmMessage = 'Are you sure you want to PERMANENTLY DELETE this rejected company? This action cannot be undone and they will need to re-register completely.';
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        console.log(`Permanently deleting company ID: ${companyId}`);
        await ApiService.deleteCompany(companyId);
        UIUtils.showAlert('Company permanently deleted successfully!', 'success');
        
        // Refresh current filter view
        loadCompanies(currentCompanyFilter);
        loadDashboardData();
    } catch (error) {
        console.error('Delete company error:', error);
        if (error.message.includes('404') || error.message.includes('not found')) {
            UIUtils.showAlert('Company already removed or not found. Refreshing list.', 'warning');
            loadCompanies(currentCompanyFilter);
        } else {
            UIUtils.showAlert('Error deleting company: ' + error.message, 'danger');
        }
    }
}

// Track current drive filter
let currentDriveFilter = 'pending';

// Drive management
async function loadDrives(filter = 'pending') {
    currentDriveFilter = filter;
    const tbody = document.getElementById('drives-table-body');
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';
    
    // Update filter buttons
    updateDriveFilterButtons(filter);
    
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
            const message = getEmptyMessage(filter);
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
                <i class="fas fa-inbox mb-2"></i><br>
                ${message}
            </td></tr>`;
            return;
        }
        
        tbody.innerHTML = drives.map(drive => {
            const company = companyMap[drive.company_id] || { name: 'Unknown Company', email: 'N/A' };
            const targets = formatTargets(drive.targets || []);
            const companyName = drive.company_name || company.name || 'Unknown Company';
            
            return `
            <tr>
                <td>${drive.id}</td>
                <td>${drive.title}</td>
                <td>
                    <strong>${companyName}</strong><br>
                    <small class="text-muted">${company.email}</small>
                </td>
                <td><span class="badge badge-secondary">${drive.question_type.toUpperCase()}</span></td>
                <td>${targets}</td>
                <td>${drive.duration_minutes} min</td>
                <td>${getStatusBadges(drive)}</td>
                <td>${UIUtils.formatDate(drive.created_at)}</td>
                <td>${getActionButtons(drive)}</td>
            </tr>
        `}).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading drives</td></tr>';
        UIUtils.showAlert('Error loading drives: ' + error.message, 'danger');
    }
}

// Update filter buttons visual state
function updateDriveFilterButtons(activeFilter) {
    const filters = ['pending', 'approved', 'rejected', 'all'];
    
    filters.forEach(filter => {
        const button = document.getElementById(`filter-${filter}`);
        if (button) {
            if (filter === activeFilter) {
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-primary');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-primary');
            }
        }
    });
}

// Get empty message based on filter
function getEmptyMessage(filter) {
    switch(filter) {
        case 'pending': return 'No drives pending approval';
        case 'approved': return 'No approved drives found';
        case 'rejected': return 'No rejected drives found';
        case 'all': return 'No drives found';
        default: return `No ${filter} drives found`;
    }
}

// Format targets for display
function formatTargets(targets) {
    if (!targets || targets.length === 0) {
        return '<span class="text-muted">No targets</span>';
    }
    
    if (targets.length === 1) {
        const target = targets[0];
        const display = `${target.college_name} - ${target.student_group_name}${target.batch_year ? ` - ${target.batch_year}` : ''}`;
        return `<small>${display}</small>`;
    } else {
        const hasCustom = targets.some(t => t.custom_college_name || t.custom_student_group_name);
        return `<small>${targets.length} targets${hasCustom ? ' <span class="text-warning">(⚠️ Custom)</span>' : ''}</small>`;
    }
}

// Get status badges
function getStatusBadges(drive) {
    let statusBadge = '';
    let approvalBadge = '';
    
    // Status badge
    const statusClass = {
        'draft': 'badge-secondary',
        'submitted': 'badge-warning', 
        'approved': 'badge-success',
        'rejected': 'badge-danger',
        'active': 'badge-primary',
        'completed': 'badge-info'
    }[drive.status.toLowerCase()] || 'badge-secondary';
    
    statusBadge = `<span class="badge ${statusClass}">${drive.status.toUpperCase()}</span>`;
    
    // Approval badge
    if (drive.status.toLowerCase() === 'submitted' || (drive.status.toLowerCase() === 'approved' && drive.is_approved)) {
        if (drive.is_approved) {
            approvalBadge = `<br><span class="badge badge-success mt-1">Admin Approved</span>`;
        } else {
            approvalBadge = `<br><span class="badge badge-warning mt-1">Pending Review</span>`;
        }
    }
    
    return statusBadge + approvalBadge;
}

// Get action buttons based on drive status
function getActionButtons(drive) {
    const status = drive.status.toLowerCase();
    
    if (status === 'submitted' && !drive.is_approved) {
        return `
            <div class="btn-group btn-group-sm">
                <button class="btn btn-success btn-sm" onclick="approveDrive(${drive.id}, true)" title="Approve Drive">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger btn-sm" onclick="approveDrive(${drive.id}, false)" title="Reject Drive">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;
    } else if (drive.is_approved) {
        return `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Approved</span>`;
    } else if (status === 'rejected') {
        return `<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Rejected</span>`;
    } else if (status === 'draft') {
        return `<span class="badge badge-secondary"><i class="fas fa-edit"></i> Draft</span>`;
    } else {
        return `<span class="badge badge-info">${status}</span>`;
    }
}

async function approveDrive(driveId, isApproved) {
    const action = isApproved ? 'approve' : 'reject';
    const adminNotes = prompt(
        `${action.charAt(0).toUpperCase() + action.slice(1)} this drive. Add notes (optional):`
    );
    
    if (adminNotes === null) return; // User cancelled
    
    try {
        await ApiService.approveDrive(driveId, isApproved, adminNotes || null);
        UIUtils.showAlert(
            `Drive ${action}d successfully!`, 
            'success'
        );
        
        // Refresh current filter view
        loadDrives(currentDriveFilter);
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert(`Error ${action}ing drive: ` + error.message, 'danger');
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

// Pending Approvals Management
async function loadPendingApprovals() {
    loadPendingColleges();
    loadPendingStudentGroups();
}

async function loadPendingColleges() {
    const tbody = document.getElementById('pending-colleges-table-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
    
    try {
        const pendingColleges = await ApiService.getPendingCustomColleges();
        
        if (pendingColleges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No pending custom colleges</td></tr>';
            return;
        }
        
        tbody.innerHTML = pendingColleges.map(college => `
            <tr>
                <td>
                    <strong>${college.name}</strong><br>
                    <small class="text-muted">First used: ${UIUtils.formatDate(college.first_used)}</small>
                </td>
                <td>
                    <span class="badge badge-info">${college.usage_count} drive${college.usage_count !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveCustomCollege('${college.name}')" title="Approve College">
                        <i class="fas fa-check"></i> Approve
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error loading pending colleges</td></tr>';
        UIUtils.showAlert('Error loading pending colleges: ' + error.message, 'danger');
    }
}

async function loadPendingStudentGroups() {
    const tbody = document.getElementById('pending-groups-table-body');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
    
    try {
        const pendingGroups = await ApiService.getPendingCustomStudentGroups();
        
        if (pendingGroups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No pending custom student groups</td></tr>';
            return;
        }
        
        tbody.innerHTML = pendingGroups.map(group => `
            <tr>
                <td>
                    <strong>${group.name}</strong><br>
                    <small class="text-muted">First used: ${UIUtils.formatDate(group.first_used)}</small>
                </td>
                <td>
                    <span class="badge badge-info">${group.usage_count} drive${group.usage_count !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveCustomStudentGroup('${group.name}')" title="Approve Student Group">
                        <i class="fas fa-check"></i> Approve
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error loading pending student groups</td></tr>';
        UIUtils.showAlert('Error loading pending student groups: ' + error.message, 'danger');
    }
}

async function approveCustomCollege(name) {
    if (!confirm(`Approve "${name}" as an official college? This will update all drives using this custom college.`)) {
        return;
    }
    
    try {
        const result = await ApiService.approveCustomCollege(name);
        UIUtils.showAlert(
            `College "${name}" approved successfully! Updated ${result.updated_targets} drive target${result.updated_targets !== 1 ? 's' : ''}.`, 
            'success'
        );
        loadPendingApprovals();
        loadColleges(); // Refresh official colleges list
    } catch (error) {
        UIUtils.showAlert('Error approving college: ' + error.message, 'danger');
    }
}

async function approveCustomStudentGroup(name) {
    if (!confirm(`Approve "${name}" as an official student group? This will update all drives using this custom group.`)) {
        return;
    }
    
    try {
        const result = await ApiService.approveCustomStudentGroup(name);
        UIUtils.showAlert(
            `Student group "${name}" approved successfully! Updated ${result.updated_targets} drive target${result.updated_targets !== 1 ? 's' : ''}.`, 
            'success'
        );
        loadPendingApprovals();
        loadStudentGroups(); // Refresh official groups list
    } catch (error) {
        UIUtils.showAlert('Error approving student group: ' + error.message, 'danger');
    }
}
