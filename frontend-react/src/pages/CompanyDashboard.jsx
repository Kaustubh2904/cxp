import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import companyApi from '../lib/companyApi';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

// Main component for the Company Dashboard, styled with Tailwind CSS
const CompanyDashboard = () => {
  const { logout, companyId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get section from URL query param or default to 'drives'
  const sectionParam = searchParams.get('section');
  const driveIdParam = searchParams.get('driveId');
  const [activeSection, setActiveSection] = useState(sectionParam || 'drives');

  const [drives, setDrives] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
  });
  const [colleges, setColleges] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [currentDriveId, setCurrentDriveId] = useState(driveIdParam || null);
  const [currentDrive, setCurrentDrive] = useState(null);
  const [currentDriveTitle, setCurrentDriveTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form data for create drive
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    question_type: '',
    duration_minutes: '',
    scheduled_start: '',
  });
  const [createTargets, setCreateTargets] = useState([
    {
      college_id: '',
      custom_college_name: '',
      student_group_id: '',
      custom_student_group_name: '',
      batch_year: '',
    },
  ]);

  // Drive details section
  const [driveStudents, setDriveStudents] = useState([]);

  // Email sending section
  const [emailConfig, setEmailConfig] = useState({
    subject_template: '',
    body_template: '',
    use_custom_template: true,
  });
  const [previewText, setPreviewText] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    loadDrives();
    loadTargetingData();

    // Load drive details if viewing a specific drive
    if (
      (activeSection === 'drive-detail' || activeSection === 'send-emails') &&
      driveIdParam
    ) {
      loadDriveData(driveIdParam);
    }
  }, []);

  // Update URL when section changes
  const handleSectionChange = (newSection, driveId = null) => {
    setActiveSection(newSection);
    if (driveId) {
      navigate(`?section=${newSection}&driveId=${driveId}`, { replace: true });
    } else {
      navigate(`?section=${newSection}`, { replace: true });
    }
  };

  // Load data when section changes
  useEffect(() => {
    if (activeSection === 'drives') {
      loadDrives();
    }
  }, [activeSection]);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      const response = await companyApi.getCompanyDrives();
      const drivesData = response.data;
      console.log('Dashboard data loaded:', drivesData);
      setDashboardStats({
        total: drivesData.length,
        active: drivesData.filter((d) =>
          ['live', 'ongoing', 'upcoming'].includes(d.status)
        ).length,
        completed: drivesData.filter((d) => d.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error?.response?.status === 401) {
        toast.error('Unauthorized - please login again');
        logout();
        navigate('/company/login');
      } else {
        toast.error('Error loading dashboard data');
      }
    }
  };

  const loadDrives = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getCompanyDrives();
      setDrives(response.data);
    } catch (error) {
      console.error('Error loading drives:', error);
      if (error?.response?.status === 401) {
        logout();
        navigate('/company/login');
      } else {
        toast.error('Error loading drives');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTargetingData = async () => {
    try {
      const [collegesRes, groupsRes] = await Promise.all([
        companyApi.getColleges(),
        companyApi.getStudentGroups(),
      ]);
      setColleges(collegesRes.data);
      setStudentGroups(groupsRes.data);
    } catch (error) {
      console.error('Error loading targeting data:', error);
      if (error?.response?.status === 401) {
        logout();
        navigate('/company/login');
      } else {
        toast.error('Error loading targeting data');
      }
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (selectedTargets.length === 0) {
      toast.error('Please add at least one target');
      return;
    }

    setLoading(true);
    const driveData = {
      title: createFormData.title,
      description: createFormData.description,
      question_type: createFormData.question_type,
      duration_minutes: parseInt(createFormData.duration_minutes),
      scheduled_start: createFormData.scheduled_start || null,
      targets: selectedTargets,
    };

    try {
      await companyApi.createDrive(driveData);
      toast.success('Drive created successfully');
      handleSectionChange('drives');
      loadDashboardData();
      loadDrives();
      resetCreateDriveForm();
    } catch (error) {
      toast.error(
        'Error creating drive: ' +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetCreateDriveForm = () => {
    setCreateFormData({
      title: '',
      description: '',
      question_type: '',
      duration_minutes: '',
      scheduled_start: '',
    });
    setSelectedTargets([
      {
        college_id: '',
        custom_college_name: '',
        student_group_id: '',
        custom_student_group_name: '',
        batch_year: '',
      },
    ]);
  };

  const addTarget = () => {
    const collegeSelect = document.getElementById('college-select');
    const groupSelect = document.getElementById('group-select');
    const customCollegeInput = document.getElementById('custom-college-input');
    const customGroupInput = document.getElementById('custom-group-input');
    const batchYear = document.getElementById('batch-year');

    let collegeId = null;
    let collegeName = '';
    let customCollege = null;
    let isCustomCollege = false;

    if (collegeSelect.value === 'other') {
      customCollege = customCollegeInput.value.trim();
      if (!customCollege) {
        toast.error('Please enter a custom college name');
        return;
      }
      collegeName = customCollege;
      isCustomCollege = true;
    } else if (collegeSelect.value) {
      collegeId = parseInt(collegeSelect.value);
      const college = colleges.find((c) => c.id === collegeId);
      collegeName = college ? college.name : '';
    } else {
      toast.error('Please select a college');
      return;
    }

    let groupId = null;
    let groupName = '';
    let customGroup = null;
    let isCustomGroup = false;

    if (groupSelect.value === 'other') {
      customGroup = customGroupInput.value.trim();
      if (!customGroup) {
        toast.error('Please enter a custom student group name');
        return;
      }
      groupName = customGroup;
      isCustomGroup = true;
    } else if (groupSelect.value) {
      groupId = parseInt(groupSelect.value);
      const group = studentGroups.find((g) => g.id === groupId);
      groupName = group ? group.name : '';
    } else {
      toast.error('Please select a student group');
      return;
    }

    const target = {
      college_id: collegeId,
      custom_college_name: customCollege,
      college_name: collegeName,
      student_group_id: groupId,
      custom_student_group_name: customGroup,
      student_group_name: groupName,
      batch_year: batchYear.value.trim() || null,
      is_custom: isCustomCollege || isCustomGroup,
    };

    const isDuplicate = selectedTargets.some(
      (existing) =>
        existing.college_name === target.college_name &&
        existing.student_group_name === target.student_group_name &&
        existing.batch_year === target.batch_year
    );

    if (isDuplicate) {
      toast.error('This target combination already exists');
      return;
    }

    setSelectedTargets((prev) => [...prev, target]);
    clearTargetForm();
    toast.success('Target added successfully');
  };

  const removeTarget = (index) => {
    setSelectedTargets((prev) => prev.filter((_, i) => i !== index));
    toast.success('Target removed');
  };

  const clearTargetForm = () => {
    const collegeSelect = document.getElementById('college-select');
    const groupSelect = document.getElementById('group-select');
    const customCollegeInput = document.getElementById('custom-college-input');
    const customGroupInput = document.getElementById('custom-group-input');
    const batchYear = document.getElementById('batch-year');

    if (collegeSelect) collegeSelect.value = '';
    if (groupSelect) groupSelect.value = '';
    if (customCollegeInput) customCollegeInput.value = '';
    if (customGroupInput) customGroupInput.value = '';
    if (batchYear) batchYear.value = '';

    const customCollegeDiv = document.getElementById('custom-college-div');
    const customGroupDiv = document.getElementById('custom-group-div');
    if (customCollegeDiv) customCollegeDiv.style.display = 'none';
    if (customGroupDiv) customGroupDiv.style.display = 'none';
  };

  // Email sending handlers
  const handleEmailConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSendEmails = async (e) => {
    e.preventDefault();
    if (!confirm('Send emails to all targeted students?')) return;

    setIsSendingEmails(true);
    try {
      await api.post(`/company/drives/${currentDriveId}/send-emails`, {
        subject_template: emailConfig.subject_template,
        body_template: emailConfig.body_template,
        use_custom_template: emailConfig.use_custom_template,
      });
      toast.success('Emails sent successfully');
      loadDrives();
    } catch (error) {
      toast.error(
        'Error sending emails: ' +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setIsSendingEmails(false);
    }
  };

  const viewQuestions = async (driveId, driveTitle) => {
    setCurrentDriveId(driveId);
    setCurrentDriveTitle(driveTitle);
    handleSectionChange('questions', driveId);
    await loadQuestions(driveId);
  };

  const viewDriveDetails = async (driveId) => {
    setCurrentDriveId(driveId);
    handleSectionChange('drive-detail', driveId);
    await loadDriveData(driveId);
  };

  const loadDriveData = async (driveId) => {
    setLoading(true);
    try {
      const [driveRes, questionsRes, studentsRes] = await Promise.all([
        api.get(`/company/drives/${driveId}`),
        api
          .get(`/company/drives/${driveId}/questions`)
          .catch(() => ({ data: [] })),
        api
          .get(`/company/drives/${driveId}/students`)
          .catch(() => ({ data: [] })),
      ]);

      setCurrentDrive(driveRes.data);
      setCurrentDriveTitle(driveRes.data.title);
      setQuestions(questionsRes.data || []);
      setDriveStudents(studentsRes.data || []);
    } catch (error) {
      toast.error('Error loading drive data');
    } finally {
      setLoading(false);
    }
  };

  const viewSendEmails = async (driveId) => {
    setCurrentDriveId(driveId);
    handleSectionChange('send-emails', driveId);
    await loadEmailData(driveId);
  };

  const loadEmailData = async (driveId) => {
    setLoading(true);
    try {
      const [driveRes, configRes] = await Promise.all([
        api.get(`/company/drives/${driveId}`),
        api.get(`/company/email-template?drive_id=${driveId}`).catch(() => ({
          data: {
            subject_template: '',
            body_template: '',
            use_custom_template: true,
          },
        })),
      ]);

      setCurrentDrive(driveRes.data);
      setCurrentDriveTitle(driveRes.data.title);
      setEmailConfig(
        configRes.data || {
          subject_template: '',
          body_template: '',
          use_custom_template: true,
        }
      );
    } catch (error) {
      toast.error('Error loading email data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (driveId) => {
    setLoading(true);
    try {
      const response = await companyApi.getDriveQuestions(driveId);
      setQuestions(response.data);
    } catch {
      toast.error('Error loading questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const questionData = {
      question_text: formData.get('question_text'),
      option_a: formData.get('option_a') || null,
      option_b: formData.get('option_b') || null,
      option_c: formData.get('option_c') || null,
      option_d: formData.get('option_d') || null,
      correct_answer: formData.get('correct_answer') || null,
      difficulty: formData.get('difficulty') || 'medium',
      points: parseInt(formData.get('points')) || 1,
    };

    try {
      await companyApi.addQuestion(currentDriveId, questionData);
      toast.success('Question added successfully');
      setShowQuestionForm(false);
      await loadQuestions(currentDriveId);
      e.target.reset();
    } catch (error) {
      toast.error(
        'Error adding question: ' +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const submitForApproval = async (driveId) => {
    if (
      !confirm('Are you sure you want to submit this drive for admin approval?')
    )
      return;

    try {
      await companyApi.submitDriveForApproval(driveId);
      toast.success('Drive submitted for approval');
      loadDrives();
      loadDashboardData();
    } catch (error) {
      toast.error(
        'Error submitting drive: ' +
          (error.response?.data?.detail || error.message)
      );
    }
  };

  const duplicateDrive = async (driveId) => {
    if (!confirm('Duplicate this drive?')) return;

    try {
      await companyApi.duplicateDrive(driveId);
      toast.success('Drive duplicated');
      loadDrives();
      loadDashboardData();
    } catch (error) {
      toast.error(
        'Error duplicating drive: ' +
          (error.response?.data?.detail || error.message)
      );
    }
  };

  const deleteDrive = async (driveId) => {
    if (!confirm('Delete this drive?')) return;

    try {
      await companyApi.deleteDrive(driveId);
      toast.success('Drive deleted');
      loadDrives();
      loadDashboardData();
    } catch (error) {
      toast.error(
        'Error deleting drive: ' +
          (error.response?.data?.detail || error.message)
      );
    }
  };

  const formatTargetsDisplay = (targets) => {
    if (!targets || targets.length === 0) return 'No targets';
    if (targets.length === 1) {
      const target = targets[0];
      return `${target.college_name} - ${target.student_group_name}${
        target.batch_year ? ` - ${target.batch_year}` : ''
      }`;
    }
    return `${targets.length} targets`;
  };

  const getStatusBadge = (status) => {
    const classes = {
      draft: 'bg-gray-500',
      submitted: 'bg-yellow-500',
      approved: 'bg-green-500',
      live: 'bg-blue-500',
      ongoing: 'bg-blue-500',
      upcoming: 'bg-purple-500',
      completed: 'bg-green-600',
      rejected: 'bg-red-500',
    };
    return `inline-block px-2 py-1 text-xs font-semibold rounded-full text-white ${
      classes[status] || 'bg-gray-500'
    }`;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu items
  const menuItems = [
    { label: 'Dashboard', section: 'drives', icon: '📊' },
    { label: 'Create Drive', section: 'create-drive', icon: '➕' },
  ];

  const handleNavigate = (section) => {
    handleSectionChange(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-gray-50 to-zinc-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-transparent to-purple-50/20"></div>
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-72 md:bg-linear-to-b md:from-slate-900 md:via-slate-800 md:to-slate-900 md:text-white md:flex-col md:sticky md:top-0 md:h-screen md:shadow-2xl md:border-r md:border-slate-700/50 md:backdrop-blur-xl md:bg-opacity-95">
        <div className="p-8 border-b border-slate-700/50 bg-linear-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-3xl font-bold science-gothic-fontstyle bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Company Exam Portal
              </h2>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                {useAuth().user?.name || useAuth().user?.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.section}
              onClick={() => handleNavigate(item.section)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 transform hover:scale-105 ${
                activeSection === item.section
                  ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'hover:bg-slate-700/50 text-slate-200 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold"
          >
            Logout
            <svg
              className="w-3 h-3 text-gray-800 dark:text-white ml-2 inline-block"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 16 16"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center z-40">
        <h2 className="text-lg font-bold">Company Portal</h2>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl"
        >
          ☰
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-800 text-white z-30 pt-16 md:hidden">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => handleNavigate(item.section)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                  activeSection === item.section
                    ? 'bg-slate-600 text-white'
                    : 'hover:bg-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:mt-0 mt-16">
        {/* Header Navigation */}
        <header className="bg-linear-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b border-gray-200/50 sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <h1 className="text-3xl font-bold science-gothic-fontstyle bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Company Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">
                    Manage your recruitment drives
                  </p>
                </div>
              </div>

              <nav className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => handleSectionChange('drives')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'drives'
                      ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/80 hover:shadow-md border border-gray-200'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => handleSectionChange('create-drive')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeSection === 'create-drive'
                      ? 'bg-linear-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/80 hover:shadow-md border border-gray-200'
                  }`}
                >
                  ➕ Create Drive
                </button>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  >
                    Logout
                    <svg
                      className="w-4 h-4 text-gray-800 dark:text-white ml-2"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"
                      />
                    </svg>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <DashboardOverview stats={dashboardStats} />

              {activeSection === 'drives' && (
                <DrivesSection
                  drives={drives}
                  loading={loading}
                  handleSectionChange={handleSectionChange}
                  loadDrives={loadDrives}
                  viewDriveDetails={viewDriveDetails}
                  viewSendEmails={viewSendEmails}
                  viewQuestions={viewQuestions}
                  submitForApproval={submitForApproval}
                  duplicateDrive={duplicateDrive}
                  deleteDrive={deleteDrive}
                  formatTargetsDisplay={formatTargetsDisplay}
                  getStatusBadge={getStatusBadge}
                />
              )}
              {activeSection === 'create-drive' && (
                <CreateDriveSection
                  handleCreateDrive={handleCreateDrive}
                  handleCreateFormChange={handleCreateFormChange}
                  createFormData={createFormData}
                  addTarget={addTarget}
                  removeTarget={removeTarget}
                  handleSectionChange={handleSectionChange}
                  selectedTargets={selectedTargets}
                  colleges={colleges}
                  studentGroups={studentGroups}
                  loading={loading}
                />
              )}
              {activeSection === 'questions' && (
                <QuestionsSection
                  currentDriveTitle={currentDriveTitle}
                  questions={questions}
                  showQuestionForm={showQuestionForm}
                  setShowQuestionForm={setShowQuestionForm}
                  handleAddQuestion={handleAddQuestion}
                  handleSectionChange={handleSectionChange}
                  loading={loading}
                />
              )}
              {activeSection === 'drive-detail' && currentDrive && (
                <DriveDetailSection
                  currentDrive={currentDrive}
                  questions={questions}
                  driveStudents={driveStudents}
                  handleSectionChange={handleSectionChange}
                  loading={loading}
                />
              )}
              {activeSection === 'send-emails' && currentDrive && (
                <SendEmailsSection
                  currentDrive={currentDrive}
                  emailConfig={emailConfig}
                  handleEmailConfigChange={handleEmailConfigChange}
                  handleSendEmails={handleSendEmails}
                  handleSectionChange={handleSectionChange}
                  isSendingEmails={isSendingEmails}
                  loading={loading}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components styled with Tailwind CSS ---

const DashboardOverview = ({ stats }) => (
  <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
    <div className="bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <span className="text-white text-xl">📊</span>
        </div>
        <h2 className="text-3xl font-bold bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">
          Dashboard Overview
        </h2>
      </div>
    </div>
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                Total Drives
              </p>
              <p className="text-5xl font-bold text-blue-900 group-hover:scale-110 transition-transform duration-300">
                {stats.total}
              </p>
            </div>
            <div className="text-6xl group-hover:animate-bounce">📋</div>
          </div>
        </div>
        <div className="bg-linear-to-br from-green-50 to-emerald-100 p-8 rounded-2xl border border-green-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
                Active Drives
              </p>
              <p className="text-5xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">
                {stats.active}
              </p>
            </div>
            <div className="text-6xl group-hover:animate-bounce">🚀</div>
          </div>
        </div>
        <div className="bg-linear-to-br from-purple-50 to-violet-100 p-8 rounded-2xl border border-purple-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-2 uppercase tracking-wide">
                Completed
              </p>
              <p className="text-5xl font-bold text-purple-900 group-hover:scale-110 transition-transform duration-300">
                {stats.completed}
              </p>
            </div>
            <div className="text-6xl group-hover:animate-bounce">✅</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DrivesSection = ({
  drives,
  loading,
  handleSectionChange,
  loadDrives,
  viewDriveDetails,
  viewSendEmails,
  viewQuestions,
  submitForApproval,
  duplicateDrive,
  deleteDrive,
  formatTargetsDisplay,
  getStatusBadge,
}) => (
  <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
    <div className="bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-xl">📋</span>
          </div>
          <h3 className="text-3xl font-bold bg-linear-to-r from-white to-blue-100 bg-clip-text text-transparent">
            My Drives
          </h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDrives}
            disabled={loading}
            className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 border border-white/30"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => handleSectionChange('create-drive')}
            className="px-6 py-2.5 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            ➕ New Drive
          </button>
        </div>
      </div>
    </div>

    {loading ? (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    ) : drives.length === 0 ? (
      <div className="p-12 text-center">
        <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">📭</span>
        </div>
        <h4 className="text-2xl font-bold text-gray-800 mb-3">No drives yet</h4>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Start your recruitment journey by creating your first drive
        </p>
        <button
          onClick={() => handleSectionChange('create-drive')}
          className="inline-flex items-center px-8 py-4 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <span className="text-xl mr-2">🚀</span>
          Create Your First Drive
        </button>
      </div>
    ) : (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => (
            <div
              key={drive.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                      {drive.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {formatTargetsDisplay(drive.targets)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        drive.status
                      )}`}
                    >
                      {drive.status.toUpperCase()}
                    </span>
                    {drive.is_approved ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✅ Approved
                      </span>
                    ) : drive.status === 'submitted' ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        ⏳ Pending
                      </span>
                    ) : drive.status === 'rejected' ? (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        ❌ Rejected
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        📝 Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {drive.question_type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">
                    {drive.duration_minutes} min
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => viewDriveDetails(drive.id)}
                    className="flex-1 px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    View
                  </button>
                  {drive.is_approved && (
                    <button
                      onClick={() => viewSendEmails(drive.id)}
                      className="flex-1 px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                       Emails
                    </button>
                  )}
                  <button
                    onClick={() => duplicateDrive(drive.id)}
                    className="px-4 py-2 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                     Duplicate
                  </button>
                  {drive.status === 'draft' && (
                    <>
                      <button
                        onClick={() => submitForApproval(drive.id)}
                        className="px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        📤 Submit
                      </button>
                      <button
                        onClick={() => deleteDrive(drive.id)}
                        className="px-4 py-2 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const CreateDriveSection = ({
  handleCreateDrive,
  handleCreateFormChange,
  createFormData,
  addTarget,
  removeTarget,
  handleSectionChange,
  selectedTargets,
  colleges,
  studentGroups,
  loading,
}) => {
  const [customCollegeVisible, setCustomCollegeVisible] = React.useState(false);
  const [customGroupVisible, setCustomGroupVisible] = React.useState(false);

  const handleCollegeChange = (e) => {
    setCustomCollegeVisible(e.target.value === 'other');
  };

  const handleGroupChange = (e) => {
    setCustomGroupVisible(e.target.value === 'other');
  };

  return (
    <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
      <div className="bg-linear-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-xl">➕</span>
          </div>
          <h3 className="text-3xl font-bold bg-linear-to-r from-white to-green-100 bg-clip-text text-transparent">
            Create New Drive
          </h3>
        </div>
      </div>

      <form onSubmit={handleCreateDrive} className="p-8 space-y-8">
        {/* Basic Information */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold">1</span>
            </span>
            Basic Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Drive Title *
              </label>
              <input
                type="text"
                name="title"
                value={createFormData.title}
                onChange={handleCreateFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter drive title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                name="question_type"
                value={createFormData.question_type}
                onChange={handleCreateFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Select Type</option>
                <option value="aptitude">📐 Aptitude</option>
                <option value="coding">💻 Coding</option>
                <option value="technical">🔧 Technical</option>
                <option value="hr">👥 HR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={createFormData.duration_minutes}
                onChange={handleCreateFormChange}
                min="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="60"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scheduled Start (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduled_start"
                value={createFormData.scheduled_start}
                onChange={handleCreateFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold">2</span>
            </span>
            Target Audience
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                College *
              </label>
              <select
                id="college-select"
                onChange={handleCollegeChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
                <option value="other">➕ Add Custom College</option>
              </select>
              {customCollegeVisible && (
                <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <input
                    type="text"
                    id="custom-college-input"
                    placeholder="Enter college name"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-amber-700 text-sm mt-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Will be sent for admin approval
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student Group *
              </label>
              <select
                id="group-select"
                onChange={handleGroupChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Student Group</option>
                {studentGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
                <option value="other">➕ Add Custom Group</option>
              </select>
              {customGroupVisible && (
                <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <input
                    type="text"
                    id="custom-group-input"
                    placeholder="Enter group name (e.g., CSE, ECE)"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-amber-700 text-sm mt-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Will be sent for admin approval
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch/Year (Optional)
              </label>
              <input
                type="text"
                id="batch-year"
                placeholder="e.g., 2025, 2026"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={addTarget}
                disabled={loading}
                className="w-full px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                ➕ Add Target
              </button>
            </div>
          </div>

          {selectedTargets.length === 0 ? (
            <div className="mt-6 p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                <div>
                  <p className="font-semibold text-blue-900">
                    No targets selected
                  </p>
                  <p className="text-blue-700 text-sm">
                    Please add at least one target audience
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <h5 className="font-semibold text-gray-800 flex items-center">
                <span className="mr-2">🎯</span>
                Selected Targets ({selectedTargets.length})
              </h5>
              {selectedTargets.map((target, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {target.college_name} - {target.student_group_name}
                      {target.batch_year ? ` - ${target.batch_year}` : ''}
                      {target.is_custom && (
                        <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                          ⚠️ Custom
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTarget(index)}
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold">3</span>
            </span>
            Additional Details
          </h4>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={createFormData.description}
              onChange={handleCreateFormChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Add any additional details about this drive..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => handleSectionChange('drives')}
            className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-300 transform hover:scale-105"
          >
            ← Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2">🚀</span>
                Create Drive
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const QuestionsSection = ({
  currentDriveTitle,
  questions,
  showQuestionForm,
  setShowQuestionForm,
  handleAddQuestion,
  handleSectionChange,
  loading,
}) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-2xl font-bold text-gray-800">
        Drive Questions - {currentDriveTitle}
      </h3>
      <div className="space-x-2">
        <button
          onClick={() => setShowQuestionForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Add Question
        </button>
        <button
          onClick={() => handleSectionChange('drives')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Back to Drives
        </button>
      </div>
    </div>

    {showQuestionForm && (
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-bold mb-4">Add New Question</h4>
        <form onSubmit={handleAddQuestion}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              name="question_text"
              className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option A
              </label>
              <input
                type="text"
                name="option_a"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option B
              </label>
              <input
                type="text"
                name="option_b"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option C
              </label>
              <input
                type="text"
                name="option_c"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option D
              </label>
              <input
                type="text"
                name="option_d"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer
              </label>
              <select
                name="correct_answer"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select Answer</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                name="points"
                defaultValue="1"
                min="1"
                className="w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowQuestionForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
            >
              {loading ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    )}

    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            {[
              'ID',
              'Question Text',
              'Options',
              'Correct Answer',
              'Difficulty',
              'Points',
            ].map((head) => (
              <th
                key={head}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="6" className="text-center py-10 text-gray-500">
                Loading...
              </td>
            </tr>
          ) : questions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-10 text-gray-500">
                No questions added yet
              </td>
            </tr>
          ) : (
            questions.map((question) => (
              <tr key={question.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {question.question_text.length > 50
                    ? question.question_text.substring(0, 50) + '...'
                    : question.question_text}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {question.option_a && `A: ${question.option_a}`}
                  <br />
                  {question.option_b && `B: ${question.option_b}`}
                  <br />
                  {question.option_c && `C: ${question.option_c}`}
                  <br />
                  {question.option_d && `D: ${question.option_d}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.correct_answer || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full text-white ${
                      question.difficulty === 'easy'
                        ? 'bg-green-500'
                        : question.difficulty === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {question.difficulty || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.points}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Drive Detail Section Component
const DriveDetailSection = ({
  currentDrive,
  questions,
  driveStudents,
  handleSectionChange,
  loading,
}) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
    <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
      <div>
        <h3 className="text-2xl font-bold text-white">{currentDrive.title}</h3>
        <p className="text-blue-100 text-sm mt-1">Drive Details & Questions</p>
      </div>
      <button
        onClick={() => handleSectionChange('drives')}
        className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-lg font-semibold transition"
      >
        ← Back to Drives
      </button>
    </div>

    <div className="p-6 space-y-6">
      {/* Drive Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 uppercase">Type</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {currentDrive.question_type}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Duration
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {currentDrive.duration_minutes} minutes
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Status
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {currentDrive.status}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Approval
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {currentDrive.is_approved ? '✅ Approved' : '⏳ Pending'}
          </p>
        </div>
      </div>

      {/* Questions Table */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Questions ({questions.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No questions added yet
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{q.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {q.question_text.substring(0, 60)}...
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          q.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800'
                            : q.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {q.points}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Registered Students ({driveStudents.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {driveStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No students registered yet
                  </td>
                </tr>
              ) : (
                driveStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {s.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {s.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Send Emails Section Component
const SendEmailsSection = ({
  currentDrive,
  emailConfig,
  handleEmailConfigChange,
  handleSendEmails,
  handleSectionChange,
  isSendingEmails,
  loading,
}) => {
  const templateVariables = [
    '{{student_name}}',
    '{{roll_number}}',
    '{{drive_title}}',
    '{{company_name}}',
    '{{password}}',
    '{{login_url}}',
    '{{start_time}}',
    '{{duration}}',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Send Emails</h3>
          <p className="text-blue-100 text-sm mt-1">
            Configure and send emails to {currentDrive.title}
          </p>
        </div>
        <button
          onClick={() => handleSectionChange('drives')}
          className="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-lg font-semibold transition"
        >
          ← Back to Drives
        </button>
      </div>

      <form onSubmit={handleSendEmails} className="p-6 space-y-6">
        {/* Use Custom Template */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <input
            type="checkbox"
            id="use_custom"
            name="use_custom_template"
            checked={emailConfig.use_custom_template}
            onChange={handleEmailConfigChange}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label
            htmlFor="use_custom"
            className="text-sm font-medium text-gray-700"
          >
            Use Custom Email Template
          </label>
        </div>

        {emailConfig.use_custom_template && (
          <>
            {/* Subject Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                name="subject_template"
                value={emailConfig.subject_template}
                onChange={handleEmailConfigChange}
                placeholder="e.g., Invitation for {{drive_title}} - {{company_name}}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {templateVariables.join(', ')}
              </p>
            </div>

            {/* Body Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
              </label>
              <textarea
                name="body_template"
                value={emailConfig.body_template}
                onChange={handleEmailConfigChange}
                placeholder="Dear {{student_name}}, You are invited to participate in {{drive_title}} by {{company_name}}..."
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {templateVariables.join(', ')}
              </p>
            </div>
          </>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => handleSectionChange('drives')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSendingEmails || loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
          >
            {isSendingEmails ? 'Sending Emails...' : 'Send Emails'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyDashboard;
