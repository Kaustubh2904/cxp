// Company Dashboard JavaScript

let currentDriveId = null;
let availableColleges = [];
let availableStudentGroups = [];
let selectedTargets = [];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!Navigation.checkAuth()) return;
    
    // Load initial data
    loadDashboardData();
    loadDrives();
    loadTargetingData();
    
    // Setup form handlers
    setupFormHandlers();
    setupTargetingSelects();
});

// Load targeting data (colleges and student groups)
async function loadTargetingData() {
    try {
        const [colleges, studentGroups] = await Promise.all([
            ApiService.getColleges(),
            ApiService.getStudentGroups()
        ]);
        
        availableColleges = colleges;
        availableStudentGroups = studentGroups;
        
        populateTargetingDropdowns();
        
    } catch (error) {
        console.error('Error loading targeting data:', error);
        UIUtils.showAlert('Error loading colleges and student groups', 'warning');
    }
}

// Populate targeting dropdowns
function populateTargetingDropdowns() {
    const collegeSelect = document.getElementById('college-select');
    const groupSelect = document.getElementById('group-select');
    
    if (collegeSelect) {
        collegeSelect.innerHTML = '<option value="">Select College</option>';
        availableColleges.forEach(college => {
            collegeSelect.innerHTML += `<option value="${college.id}">${college.name}</option>`;
        });
        collegeSelect.innerHTML += '<option value="other">➕ Other (Add Custom)</option>';
    }
    
    if (groupSelect) {
        groupSelect.innerHTML = '<option value="">Select Student Group</option>';
        availableStudentGroups.forEach(group => {
            groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
        });
        groupSelect.innerHTML += '<option value="other">➕ Other (Add Custom)</option>';
    }
}

// Setup targeting select handlers
function setupTargetingSelects() {
    const collegeSelect = document.getElementById('college-select');
    const groupSelect = document.getElementById('group-select');
    
    if (collegeSelect) {
        collegeSelect.addEventListener('change', function() {
            const customDiv = document.getElementById('custom-college-div');
            if (this.value === 'other') {
                customDiv.style.display = 'block';
            } else {
                customDiv.style.display = 'none';
                document.getElementById('custom-college-input').value = '';
            }
        });
    }
    
    if (groupSelect) {
        groupSelect.addEventListener('change', function() {
            const customDiv = document.getElementById('custom-group-div');
            if (this.value === 'other') {
                customDiv.style.display = 'block';
            } else {
                customDiv.style.display = 'none';
                document.getElementById('custom-group-input').value = '';
            }
        });
    }
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        const drives = await ApiService.getCompanyDrives();
        
        document.getElementById('total-drives').textContent = drives.length;
        document.getElementById('active-drives').textContent = drives.filter(d => 
            ['live', 'ongoing', 'upcoming'].includes(d.status)
        ).length;
        document.getElementById('completed-drives').textContent = drives.filter(d => 
            d.status === 'completed'
        ).length;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    const sections = ['drives-section', 'create-drive-section', 'questions-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) element.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Load section data
    switch(sectionName) {
        case 'drives':
            loadDrives();
            break;
        case 'create-drive':
            resetCreateDriveForm();
            loadTargetingData(); // Refresh targeting data when creating drive
            break;
    }
}

// Add target to the list
function addTarget() {
    const collegeSelect = document.getElementById('college-select');
    const groupSelect = document.getElementById('group-select');
    const customCollegeInput = document.getElementById('custom-college-input');
    const customGroupInput = document.getElementById('custom-group-input');
    const batchYear = document.getElementById('batch-year');
    
    // Get college info
    let collegeId = null;
    let collegeName = '';
    let customCollege = null;
    let isCustomCollege = false;
    
    if (collegeSelect.value === 'other') {
        customCollege = customCollegeInput.value.trim();
        if (!customCollege) {
            UIUtils.showAlert('Please enter a custom college name', 'warning');
            return;
        }
        collegeName = customCollege;
        isCustomCollege = true;
    } else if (collegeSelect.value) {
        collegeId = parseInt(collegeSelect.value);
        const college = availableColleges.find(c => c.id === collegeId);
        collegeName = college ? college.name : '';
    } else {
        UIUtils.showAlert('Please select a college', 'warning');
        return;
    }
    
    // Get group info
    let groupId = null;
    let groupName = '';
    let customGroup = null;
    let isCustomGroup = false;
    
    if (groupSelect.value === 'other') {
        customGroup = customGroupInput.value.trim();
        if (!customGroup) {
            UIUtils.showAlert('Please enter a custom student group name', 'warning');
            return;
        }
        groupName = customGroup;
        isCustomGroup = true;
    } else if (groupSelect.value) {
        groupId = parseInt(groupSelect.value);
        const group = availableStudentGroups.find(g => g.id === groupId);
        groupName = group ? group.name : '';
    } else {
        UIUtils.showAlert('Please select a student group', 'warning');
        return;
    }
    
    // Create target object
    const target = {
        college_id: collegeId,
        custom_college_name: customCollege,
        college_name: collegeName,
        student_group_id: groupId,
        custom_student_group_name: customGroup,
        student_group_name: groupName,
        batch_year: batchYear.value.trim() || null,
        is_custom: isCustomCollege || isCustomGroup
    };
    
    // Check for duplicate
    const isDuplicate = selectedTargets.some(existing => 
        existing.college_name === target.college_name && 
        existing.student_group_name === target.student_group_name &&
        existing.batch_year === target.batch_year
    );
    
    if (isDuplicate) {
        UIUtils.showAlert('This target combination already exists', 'warning');
        return;
    }
    
    // Add to array
    selectedTargets.push(target);
    
    // Update UI
    updateTargetsList();
    clearTargetForm();
    
    UIUtils.showAlert('Target added successfully', 'success');
}

// Update targets list display
function updateTargetsList() {
    const container = document.getElementById('selected-targets-container');
    const noTargetsMsg = document.getElementById('no-targets-msg');
    
    if (selectedTargets.length === 0) {
        if (noTargetsMsg) {
            noTargetsMsg.style.display = 'block';
        } else {
            container.innerHTML = '<div class="alert alert-info" id="no-targets-msg">No targets selected. Please add at least one target.</div>';
        }
        return;
    }
    
    if (noTargetsMsg) {
        noTargetsMsg.style.display = 'none';
    }
    
    const targetsHtml = selectedTargets.map((target, index) => {
        const displayText = `${target.college_name} - ${target.student_group_name}${target.batch_year ? ` - ${target.batch_year}` : ''}`;
        const customClass = target.is_custom ? 'custom-entry' : '';
        return `
            <div class="target-item ${customClass}">
                <span>${displayText}</span>
                ${target.is_custom ? '<span title="Will be sent for admin approval">⚠️</span>' : ''}
                <button type="button" class="remove-target" onclick="removeTarget(${index})" title="Remove">×</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = targetsHtml;
}

// Remove target from list
function removeTarget(index) {
    selectedTargets.splice(index, 1);
    updateTargetsList();
    UIUtils.showAlert('Target removed', 'success');
}

// Clear target selection form
function clearTargetForm() {
    document.getElementById('college-select').value = '';
    document.getElementById('group-select').value = '';
    document.getElementById('custom-college-input').value = '';
    document.getElementById('custom-group-input').value = '';
    document.getElementById('batch-year').value = '';
    document.getElementById('custom-college-div').style.display = 'none';
    document.getElementById('custom-group-div').style.display = 'none';
}

// Drive management
async function loadDrives() {
    const tbody = document.getElementById('drives-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading...</td></tr>';
    
    try {
        const drives = await ApiService.getCompanyDrives();
        
        if (drives.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">No drives found. <a href="#" onclick="showSection(\'create-drive\')">Create your first drive</a></td></tr>';
            return;
        }
        
        tbody.innerHTML = drives.map(drive => `
            <tr>
                <td>${drive.id}</td>
                <td>${drive.title}</td>
                <td><span class="badge badge-secondary">${drive.question_type.toUpperCase()}</span></td>
                <td>${formatTargetsDisplay(drive.targets)}</td>
                <td>${UIUtils.getStatusBadge(drive.status)}</td>
                <td>${drive.is_approved ? '<span class="badge badge-success">Approved</span>' : drive.status === 'submitted' ? '<span class="badge badge-warning">Pending</span>' : drive.status === 'rejected' ? '<span class="badge badge-danger">Rejected</span>' : '<span class="badge badge-secondary">Draft</span>'}</td>
                <td>${UIUtils.formatDate(drive.scheduled_start)}</td>
                <td>${drive.duration_minutes} min</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="viewQuestions(${drive.id}, '${drive.title}')">
                        Questions
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="duplicateDrive(${drive.id})">
                        Duplicate
                    </button>
                    ${drive.status === 'draft' ? `
                        <button class="btn btn-warning btn-sm" onclick="editDrive(${drive.id})">
                            Edit
                        </button>
                        <button class="btn btn-success btn-sm" onclick="submitForApproval(${drive.id})">
                            Submit for Approval
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteDrive(${drive.id})">
                            Delete
                        </button>
                    ` : drive.is_approved ? `
                        <button class="btn btn-success btn-sm" onclick="previewDrive(${drive.id})">
                            Preview
                        </button>
                    ` : drive.status === 'submitted' ? `
                        <span class="badge badge-warning">Pending Admin Approval</span>
                    ` : drive.status === 'rejected' ? `
                        <span class="badge badge-danger">Rejected</span>
                        <button class="btn btn-warning btn-sm" onclick="editDrive(${drive.id})">
                            Edit & Resubmit
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading drives</td></tr>';
        UIUtils.showAlert('Error loading drives: ' + error.message, 'danger');
    }
}

// Format targets for display in table
function formatTargetsDisplay(targets) {
    if (!targets || targets.length === 0) {
        return '<span class="text-muted">No targets</span>';
    }
    
    if (targets.length === 1) {
        const target = targets[0];
        const display = `${target.college_name} - ${target.student_group_name}${target.batch_year ? ` - ${target.batch_year}` : ''}`;
        return `<small>${display}</small>`;
    } else {
        return `<small>${targets.length} targets<br/><span class="text-muted">Click to view details</span></small>`;
    }
}

// Form handlers
function setupFormHandlers() {
    // Create drive form
    const createDriveForm = document.getElementById('create-drive-form');
    if (createDriveForm) {
        createDriveForm.addEventListener('submit', handleCreateDrive);
    }
    
    // Add question form
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.addEventListener('submit', handleAddQuestion);
    }
}

async function handleCreateDrive(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    UIUtils.showLoading(submitBtn);
    
    const formData = new FormData(e.target);
    
    // Validate that at least one target is selected
    if (selectedTargets.length === 0) {
        UIUtils.showAlert('Please add at least one target for this drive.', 'danger');
        UIUtils.hideLoading(submitBtn);
        return;
    }
    
    const driveData = {
        title: formData.get('title'),
        description: formData.get('description'),
        question_type: formData.get('question_type'),
        duration_minutes: parseInt(formData.get('duration_minutes')),
        scheduled_start: formData.get('scheduled_start') || null,
        targets: selectedTargets
    };
    
    try {
        const drive = await ApiService.createDrive(driveData);
        UIUtils.showAlert('Drive created successfully!', 'success');
        showSection('drives');
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error creating drive: ' + error.message, 'danger');
    } finally {
        UIUtils.hideLoading(submitBtn);
    }
}

function resetCreateDriveForm() {
    const form = document.getElementById('create-drive-form');
    if (form) {
        form.reset();
        
        // Reset targeting system
        selectedTargets = [];
        const container = document.getElementById('selected-targets-container');
        if (container) {
            container.innerHTML = '<div class="alert alert-info" id="no-targets-msg">No targets selected. Please add at least one target.</div>';
        }
        clearTargetForm();
    }
}

async function submitForApproval(driveId) {
    if (!confirm('Are you sure you want to submit this drive for admin approval? You won\'t be able to edit it until it\'s approved or rejected.')) {
        return;
    }
    
    try {
        await ApiService.submitDriveForApproval(driveId);
        UIUtils.showAlert('Drive submitted for approval successfully!', 'success');
        loadDrives();
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error submitting drive: ' + error.message, 'danger');
    }
}

async function duplicateDrive(driveId) {
    if (!confirm('Are you sure you want to duplicate this drive?')) {
        return;
    }
    
    try {
        const newDrive = await ApiService.duplicateDrive(driveId);
        UIUtils.showAlert('Drive duplicated successfully!', 'success');
        loadDrives();
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error duplicating drive: ' + error.message, 'danger');
    }
}

async function deleteDrive(driveId) {
    if (!confirm('Are you sure you want to delete this drive? This action cannot be undone.')) {
        return;
    }
    
    try {
        await ApiService.deleteDrive(driveId);
        UIUtils.showAlert('Drive deleted successfully!', 'success');
        loadDrives();
        loadDashboardData();
    } catch (error) {
        UIUtils.showAlert('Error deleting drive: ' + error.message, 'danger');
    }
}

function editDrive(driveId) {
    UIUtils.showAlert('Edit drive functionality coming soon!', 'warning');
}

function previewDrive(driveId) {
    UIUtils.showAlert('Drive preview functionality coming soon!', 'warning');
}

// Question management
async function viewQuestions(driveId, driveTitle) {
    currentDriveId = driveId;
    document.getElementById('current-drive-title').textContent = driveTitle;
    document.getElementById('current-drive-id').value = driveId;
    
    showSection('questions');
    await loadQuestions(driveId);
}

async function loadQuestions(driveId) {
    const tbody = document.getElementById('questions-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    try {
        const questions = await ApiService.getDriveQuestions(driveId);
        
        if (questions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No questions added yet. <a href="#" onclick="showAddQuestionForm()">Add the first question</a></td></tr>';
            return;
        }
        
        tbody.innerHTML = questions.map(question => `
            <tr>
                <td>${question.id}</td>
                <td>${question.question_text.substring(0, 100)}${question.question_text.length > 100 ? '...' : ''}</td>
                <td>
                    ${question.option_a ? `A: ${question.option_a}<br>` : ''}
                    ${question.option_b ? `B: ${question.option_b}<br>` : ''}
                    ${question.option_c ? `C: ${question.option_c}<br>` : ''}
                    ${question.option_d ? `D: ${question.option_d}` : ''}
                </td>
                <td>${question.correct_answer || 'N/A'}</td>
                <td>
                    <span class="badge ${
                        question.difficulty === 'easy' ? 'badge-success' :
                        question.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                    }">
                        ${question.difficulty || 'N/A'}
                    </span>
                </td>
                <td>${question.points}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading questions</td></tr>';
        UIUtils.showAlert('Error loading questions: ' + error.message, 'danger');
    }
}

function showAddQuestionForm() {
    document.getElementById('add-question-form').style.display = 'block';
}

function hideAddQuestionForm() {
    document.getElementById('add-question-form').style.display = 'none';
    document.getElementById('question-form').reset();
}

async function handleAddQuestion(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    UIUtils.showLoading(submitBtn);
    
    const formData = new FormData(e.target);
    const driveId = formData.get('drive_id');
    
    const questionData = {
        question_text: formData.get('question_text'),
        option_a: formData.get('option_a') || null,
        option_b: formData.get('option_b') || null,
        option_c: formData.get('option_c') || null,
        option_d: formData.get('option_d') || null,
        correct_answer: formData.get('correct_answer') || null,
        difficulty: formData.get('difficulty') || 'medium',
        points: parseInt(formData.get('points')) || 1
    };
    
    try {
        await ApiService.addQuestion(driveId, questionData);
        UIUtils.showAlert('Question added successfully!', 'success');
        hideAddQuestionForm();
        await loadQuestions(driveId);
    } catch (error) {
        UIUtils.showAlert('Error adding question: ' + error.message, 'danger');
    } finally {
        UIUtils.hideLoading(submitBtn);
    }
}
