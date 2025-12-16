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
        api
          .get(`/company/drives/${driveId}/questions`)
          .catch(() => ({ data: [] })),
        api
          .get(`/company/drives/${driveId}/students`)
          .catch(() => ({ data: [] })),
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
          `/company/drives/${driveId}/upload-questions`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        toast.success('Questions uploaded successfully!');
      } else if (type === 'students') {
        await api.post(`/company/drives/${driveId}/upload-students`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Students uploaded successfully!');
      }

      await loadDriveData();
      event.target.value = '';
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to upload file');
    } finally {
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
          <p className="text-gray-600 text-lg">
            Drive not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-blue-600">
                🏢 Company Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/company-dashboard')}
                className="text-gray-600 hover:text-gray-900 font-semibold"
              >
                Drives
              </button>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Drive Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {drive.title}
            </h1>
            <button
              onClick={() => navigate('/company-dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Back
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">
                Description
              </p>
              <p className="font-semibold text-gray-900">
                {drive.description || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold text-gray-900">
                {drive.question_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Duration
              </p>
              <p className="font-semibold text-gray-900">
                {drive.duration_minutes} minutes
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div>{getStatusBadge(drive.status)}</div>
            </div>
          </div>

          {drive.is_approved ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ Drive is approved by admin
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ Drive is not yet approved. Approval status: {drive.status}
              </p>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Questions
          </h2>

          <div className="flex gap-4 mb-6">
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
                onClick={() => document.getElementById('questionsFile').click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {isUploading ? 'Uploading...' : 'Upload Questions (CSV)'}
              </button>
            </div>
            <a
              href="/sample_questions.csv"
              download
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Download Sample CSV
            </a>
          </div>

          {questions.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                No questions yet. Upload a CSV file to add questions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {questions.map((q, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-gray-900">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 text-gray-900">
                        {q.question_text}
                      </td>
                      <td className="px-6 py-3 text-gray-900">
                        {q.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-sm text-gray-600">
                <strong>Total Questions:</strong> {questions.length}
              </p>
            </div>
          )}
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Students
          </h2>

          <div className="flex gap-4 mb-6">
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
                onClick={() => document.getElementById('studentsFile').click()}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {isUploading ? 'Uploading...' : 'Upload Students (CSV)'}
              </button>
            </div>
            <a
              href="/sample_students.csv"
              download
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Download Sample CSV
            </a>
          </div>

          {students.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-800">
                No students yet. Upload a CSV file to add students.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-gray-900">
                        {s.roll_number}
                      </td>
                      <td className="px-6 py-3 text-gray-900">
                        {s.name || 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-gray-900">
                        {s.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-sm text-gray-600">
                <strong>Total Students:</strong> {students.length}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
