import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function CompanyCreateDrive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyId } = useAuth();

  const isEditMode = !!searchParams.get('id');
  const driveId = searchParams.get('id');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    question_type: '',
    duration_minutes: '',
    scheduled_start: '',
  });

  const [targets, setTargets] = useState([
    {
      college_id: '',
      custom_college_name: '',
      student_group_id: '',
      custom_student_group_name: '',
      batch_year: '',
    },
  ]);

  const [colleges, setColleges] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReferenceData();
    if (isEditMode && driveId) {
      loadDriveData();
    }
  }, []);

  const loadReferenceData = async () => {
    try {
      const [collegesRes, groupsRes] = await Promise.all([
        api.get('/company/colleges'),
        api.get('/company/student-groups'),
      ]);
      setColleges(collegesRes.data || []);
      setStudentGroups(groupsRes.data || []);
    } catch (err) {
      toast.error('Failed to load reference data');
    }
  };

  const loadDriveData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/company/drives/${driveId}`);
      const drive = res.data;

      setFormData({
        title: drive.title || '',
        description: drive.description || '',
        question_type: drive.question_type || '',
        duration_minutes: drive.duration_minutes || '',
        scheduled_start: drive.scheduled_start
          ? drive.scheduled_start.slice(0, 16)
          : '',
      });

      if (drive.targets && drive.targets.length > 0) {
        setTargets(
          drive.targets.map((t) => ({
            college_id: t.college_id || '',
            custom_college_name: t.custom_college_name || '',
            student_group_id: t.student_group_id || '',
            custom_student_group_name: t.custom_student_group_name || '',
            batch_year: t.batch_year || '',
          }))
        );
      }
    } catch (err) {
      toast.error('Failed to load drive data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTargetChange = (index, field, value) => {
    const newTargets = [...targets];
    newTargets[index][field] = value;
    setTargets(newTargets);
  };

  const addTarget = () => {
    setTargets([
      ...targets,
      {
        college_id: '',
        custom_college_name: '',
        student_group_id: '',
        custom_student_group_name: '',
        batch_year: '',
      },
    ]);
  };

  const removeTarget = (index) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        targets: targets.map((t) => ({
          college_id: t.college_id ? parseInt(t.college_id) : null,
          custom_college_name: t.custom_college_name || null,
          student_group_id: t.student_group_id
            ? parseInt(t.student_group_id)
            : null,
          custom_student_group_name: t.custom_student_group_name || null,
          batch_year: t.batch_year || null,
        })),
      };

      if (isEditMode) {
        await api.put(`/company/drives/${driveId}`, payload);
        toast.success('Drive updated successfully!');
      } else {
        const res = await api.post('/company/drives', payload);
        toast.success('Drive created successfully!');
        navigate(`/company/drive-detail?id=${res.data.id}`);
        return;
      }

      navigate('/company-dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50   flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
                className="text-gray-600   hover:text-gray-900   font-semibold"
              >
                Drives
              </button>
              <button
                onClick={() => navigate('/company-dashboard')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Drive' : 'Create New Drive'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700   mb-2">
                Drive Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700   mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700   mb-2">
                  Question Type *
                </label>
                <select
                  name="question_type"
                  value={formData.question_type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="mcqs">Multiple Choice Questions</option>
                  <option value="aptitude">Aptitude</option>
                  <option value="technical">Technical</option>
                  <option value="coding">Coding</option>
                  <option value="hr">HR Round</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700   mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleFormChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700   mb-2">
                Scheduled Start (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduled_start"
                value={formData.scheduled_start}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Target Students */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Target Students
            </h3>{' '}
            {targets.map((target, index) => (
              <div
                key={index}
                className="border border-gray-200   rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">
                    Target Group {index + 1}
                  </h4>
                  {targets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTarget(index)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700   mb-2">
                      College
                    </label>
                    <select
                      value={target.college_id}
                      onChange={(e) =>
                        handleTargetChange(index, 'college_id', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select or enter custom...</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700   mb-2">
                      Or Enter Custom College
                    </label>
                    <input
                      type="text"
                      value={target.custom_college_name}
                      onChange={(e) =>
                        handleTargetChange(
                          index,
                          'custom_college_name',
                          e.target.value
                        )
                      }
                      placeholder="Custom college name"
                      className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700   mb-2">
                      Student Group
                    </label>
                    <select
                      value={target.student_group_id}
                      onChange={(e) =>
                        handleTargetChange(
                          index,
                          'student_group_id',
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select or enter custom...</option>
                      {studentGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700   mb-2">
                      Or Enter Custom Group
                    </label>
                    <input
                      type="text"
                      value={target.custom_student_group_name}
                      onChange={(e) =>
                        handleTargetChange(
                          index,
                          'custom_student_group_name',
                          e.target.value
                        )
                      }
                      placeholder="Custom group name"
                      className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700   mb-2">
                    Batch Year (Optional)
                  </label>
                  <input
                    type="text"
                    value={target.batch_year}
                    onChange={(e) =>
                      handleTargetChange(index, 'batch_year', e.target.value)
                    }
                    placeholder="e.g., 2025"
                    className="w-full px-4 py-2 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTarget}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300   rounded-lg text-gray-700   hover:border-blue-500 hover:text-blue-600   font-semibold transition"
            >
              + Add Another Target
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              type="button"
              onClick={() => navigate('/company-dashboard')}
              className="px-6 py-2 border border-gray-300   rounded-lg text-gray-900   hover:bg-gray-50   font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                ? 'Update Drive'
                : 'Create Drive'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
