import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function AdminStudents() {
  const { logout } = useAuth();

  const [allStudents, setAllStudents] = useState([]);
  const [allDrives, setAllDrives] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedDrive, setSelectedDrive] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchInput, selectedDrive, allStudents]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const drivesRes = await api.get(
        '/admin/drives?status_filter=all&limit=500'
      );
      setAllDrives(drivesRes.data || []);

      const studentPromises = (drivesRes.data || []).map((drive) =>
        api
          .get(`/company/drives/${drive.id}/students`)
          .then((res) =>
            (res.data || []).map((s) => ({
              ...s,
              drive_title: drive.title,
              drive_id: drive.id,
              company_name: drive.company_name || 'Unknown',
            }))
          )
          .catch(() => [])
      );

      const studentArrays = await Promise.all(studentPromises);
      const mergedStudents = studentArrays.flat();
      setAllStudents(mergedStudents);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    const search = searchInput.toLowerCase();
    const filtered = allStudents.filter((student) => {
      const matchesSearch =
        !search ||
        student.name?.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.roll_number?.toLowerCase().includes(search) ||
        student.drive_title.toLowerCase().includes(search) ||
        student.company_name.toLowerCase().includes(search);

      const matchesDrive =
        !selectedDrive || student.drive_id.toString() === selectedDrive;

      return matchesSearch && matchesDrive;
    });

    setFilteredStudents(filtered);
  };

  const uniqueEmails = new Set(allStudents.map((s) => s.email?.toLowerCase()))
    .size;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                🎯 Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
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

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            <button className="px-6 py-4 font-semibold border-b-2 border-red-600 text-red-600 dark:text-red-400 transition">
              Students
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Management
          </h2>
          <button
            onClick={loadStudents}
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
          >
            {isLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total Students
            </h3>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
              {allStudents.length}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total Drives
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {allDrives.length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-slate-800 border border-green-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Unique Emails
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {uniqueEmails}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by name, email, or roll number
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by drive
              </label>
              <select
                value={selectedDrive}
                onChange={(e) => setSelectedDrive(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Drives</option>
                {allDrives.map((drive) => (
                  <option key={drive.id} value={drive.id}>
                    {drive.title} ({drive.company_name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <p className="text-blue-800 dark:text-blue-300 text-lg">
              No students found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Roll Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Drive
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Added On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {student.roll_number}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {student.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.drive_title}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {student.company_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                      {student.created_at
                        ? new Date(student.created_at).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>
                  Showing {filteredStudents.length} of {allStudents.length}{' '}
                  students
                </strong>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
