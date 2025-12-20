import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function CompanyDriveDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();

  const driveId = searchParams.get('id');

  const [drive, setDrive] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!driveId) {
      navigate('/company-dashboard');
      return;
    }
    loadDriveData();
  }, [driveId]);

  const loadDriveData = async () => {
    setIsLoading(true);
    try {
      const [driveRes, questionsRes, studentsRes] = await Promise.all([
        api.get(`/company/drives/${driveId}`),
        api.get(`/company/drives/${driveId}/questions`).catch((err) => {
          console.error('Failed to load questions:', err);
          return { data: [] };
        }),
        api.get(`/company/drives/${driveId}/students`).catch((err) => {
          console.error('Failed to load students:', err);
          return { data: [] };
        }),
      ]);

      setDrive(driveRes.data);
      setQuestions(questionsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load drive data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'questions') {
        await api.post(
          `/company/drives/${driveId}/questions/csv-upload`,
          formData,
          {
            headers: { 'Content-Type': undefined },
          }
        );
        toast.success('Questions uploaded successfully!');
      } else if (type === 'students') {
        await api.post(
          `/company/drives/${driveId}/students/csv-upload`,
          formData,
          {
            headers: { 'Content-Type': undefined },
          }
        );
        toast.success('Students uploaded successfully!');
      }

      // Wait a moment for backend to process, then reload data
      setTimeout(() => {
        loadDriveData();
        event.target.value = '';
        setIsUploading(false);
      }, 500);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to upload file');
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      approved: 'bg-green-100 text-green-800 border border-green-300',
      rejected: 'bg-red-100 text-red-800 border border-red-300',
      suspended: 'bg-orange-100 text-orange-800 border border-orange-300',
      submitted: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Drive not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-72 md:bg-linear-to-b md:from-slate-900 md:via-slate-800 md:to-slate-900 md:text-white md:flex-col md:sticky md:top-0 md:h-screen md:shadow-2xl">
        <div className="p-8 border-b border-slate-700/50">
          <h2 className="text-2xl font-bold science-gothic-fontstyle bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Company Exam Portal
          </h2>
          <p className="text-sm text-slate-300 mt-2">Recruitment Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/company-dashboard')}
            className="w-full text-left px-4 py-3 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg font-medium flex items-center gap-3"
          >
            <span>📊</span> Dashboard
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => {
              logout();
              navigate('/company/login');
            }}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105"
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
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center z-40">
        <h2 className="text-lg font-bold science-gothic-fontstyle">
          Company Exam Portal
        </h2>
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
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => {
                logout();
                navigate('/company/login');
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105"
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:mt-0 mt-16">
        {/* Header */}
        <header className="bg-linear-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="hidden sm:block">
                <h1 className="text-3xl font-bold science-gothic-fontstyle bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Drive Details
                </h1>
                <p className="text-sm text-gray-600">
                  Manage questions, students, and send emails
                </p>
              </div>

              <nav className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => navigate('/company-dashboard')}
                  className="text-white bg-linear-to-br from-purple-600 to-blue-500 hover:bg-linear-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-xl text-sm px-4 py-2.5 text-center leading-5"
                >
                  ← Back to Dashboard
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <main className="py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              {/* Drive Overview */}
              <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50">
                <div className="bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-2xl">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span>📋</span> {drive.title}
                  </h2>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        Description
                      </p>
                      <p className="text-gray-900 font-medium">
                        {drive.description || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        Type
                      </p>
                      <p className="text-gray-900 font-medium">
                        {drive.question_type}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        Duration
                      </p>
                      <p className="text-gray-900 font-medium">
                        {drive.duration_minutes} minutes
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50">
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        Status
                      </p>
                      <div>{getStatusBadge(drive.status)}</div>
                    </div>
                  </div>

                  {drive.is_approved ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <p className="text-green-800 flex items-center gap-2">
                        <span>✅</span> Drive is approved by admin
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                      <p className="text-yellow-800 flex items-center gap-2">
                        <span>⚠️</span> Drive is not yet approved. Approval
                        status: {drive.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Management */}
              <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50">
                <div className="bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6 rounded-t-2xl">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span>❓</span> Questions Management
                  </h3>
                </div>

                <div className="p-8">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div>
                      <input
                        type="file"
                        id="questionsFile"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'questions')}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <button
                        onClick={() =>
                          document.getElementById('questionsFile').click()
                        }
                        disabled={isUploading}
                        className="px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition shadow-lg"
                      >
                        {isUploading
                          ? '📤 Uploading...'
                          : '📤 Upload Questions (CSV)'}
                      </button>
                    </div>
                    <a
                      href="/sample_questions.csv"
                      download
                      className="px-6 py-3 bg-linear-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition shadow-lg inline-flex items-center gap-2"
                    >
                      <span>📥</span> Download Sample CSV
                    </a>
                  </div>

                  {questions.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❓</span>
                      </div>
                      <h4 className="text-xl font-bold text-blue-900 mb-2">
                        No questions yet
                      </h4>
                      <p className="text-blue-700">
                        Upload a CSV file to add questions to this drive.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                #
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Question
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {questions.map((q, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 transition"
                              >
                                <td className="px-6 py-4 text-gray-900 font-medium">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-4 text-gray-900">
                                  {q.question_text}
                                </td>
                                <td className="px-6 py-4 text-gray-900 font-semibold">
                                  {q.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 font-semibold">
                          <span className="text-blue-600">📊</span> Total
                          Questions: {questions.length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Students Management */}
              <div className="bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl shadow-xl border border-gray-200/50">
                <div className="bg-linear-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span>👥</span> Students Management
                  </h3>
                </div>

                <div className="p-8">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div>
                      <input
                        type="file"
                        id="studentsFile"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'students')}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <button
                        onClick={() =>
                          document.getElementById('studentsFile').click()
                        }
                        disabled={isUploading}
                        className="px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition shadow-lg"
                      >
                        {isUploading
                          ? '📤 Uploading...'
                          : '📤 Upload Students (CSV)'}
                      </button>
                    </div>
                    <a
                      href="/sample_students.csv"
                      download
                      className="px-6 py-3 bg-linear-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition shadow-lg inline-flex items-center gap-2"
                    >
                      <span>📥</span> Download Sample CSV
                    </a>
                  </div>

                  {students.length === 0 ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👥</span>
                      </div>
                      <h4 className="text-xl font-bold text-purple-900 mb-2">
                        No students yet
                      </h4>
                      <p className="text-purple-700">
                        Upload a CSV file to add students to this drive.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Roll Number
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Name
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {students.map((s, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 transition"
                              >
                                <td className="px-6 py-4 text-gray-900 font-medium">
                                  {s.roll_number}
                                </td>
                                <td className="px-6 py-4 text-gray-900">
                                  {s.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-gray-900">
                                  {s.email}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 font-semibold">
                          <span className="text-purple-600">📊</span> Total
                          Students: {students.length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
