import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function CompanySendEmails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();

  const driveId = searchParams.get('id');

  const [driveInfo, setDriveInfo] = useState(null);
  const [emailConfig, setEmailConfig] = useState({
    subject_template: '',
    body_template: '',
    use_custom_template: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [previewText, setPreviewText] = useState('');

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

  useEffect(() => {
    if (!driveId) {
      navigate('/company-dashboard');
      return;
    }
    loadData();
  }, [driveId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [driveRes, configRes] = await Promise.all([
        api.get(`/company/drives/${driveId}`),
        api.get(`/company/email-template?drive_id=${driveId}`).catch(() => ({
          data: {
            subject_template: 'Invitation to {{drive_title}}',
            body_template:
              'Dear {{student_name}}, You are invited to participate in {{drive_title}}. Password: {{password}}',
            use_custom_template: true,
          },
        })),
      ]);

      setDriveInfo(driveRes.data);
      setEmailConfig(configRes.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setEmailConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitConfig = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.put(`/company/email-template?drive_id=${driveId}`, emailConfig);
      toast.success('Email template updated successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePreview = () => {
    let preview = emailConfig.body_template;
    const sampleData = {
      '{{student_name}}': 'John Doe',
      '{{roll_number}}': '2024001',
      '{{drive_title}}': driveInfo?.title || 'Drive',
      '{{company_name}}': driveInfo?.company_name || 'Company',
      '{{password}}': 'temp123456',
      '{{login_url}}': 'https://exam.example.com',
      '{{start_time}}': new Date().toLocaleString(),
      '{{duration}}': driveInfo?.duration_minutes || '60',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value);
    });

    setPreviewText(preview);
  };

  const handleSendEmails = async () => {
    if (
      !window.confirm('Are you sure you want to send emails to all students?')
    ) {
      return;
    }

    setIsSendingEmails(true);
    try {
      const res = await api.post(`/company/send-emails?drive_id=${driveId}`, {
        use_custom_template: emailConfig.use_custom_template,
      });

      toast.success(
        `Emails sent successfully to ${res.data?.emails_sent || 0} students!`
      );
      setTimeout(() => navigate('/company-dashboard'), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to send emails');
    } finally {
      setIsSendingEmails(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!driveInfo) {
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

  const canSendEmails = driveInfo.is_approved && driveInfo.student_count > 0;

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Send Email Invitations
          </h2>
          <button
            onClick={() => navigate('/company-dashboard')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
          >
            Back
          </button>
        </div>

        {/* Drive Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {driveInfo.title}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                Approval Status
              </p>
              <p className="font-semibold text-gray-900">
                {driveInfo.is_approved ? '✅ Approved' : '❌ Not Approved'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Students
              </p>
              <p className="font-semibold text-gray-900">
                {driveInfo.student_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Questions
              </p>
              <p className="font-semibold text-gray-900">
                {driveInfo.question_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">
                {driveInfo.status}
              </p>
            </div>
          </div>

          {!canSendEmails && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ Cannot send emails yet. Please ensure:
              </p>
              <ul className="mt-2 space-y-1 text-yellow-800 text-sm">
                {!driveInfo.is_approved && (
                  <li>✗ Drive must be approved by admin</li>
                )}
                {driveInfo.student_count === 0 && (
                  <li>✗ Drive must have at least one student</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Email Template Configuration */}
        <form
          onSubmit={handleSubmitConfig}
          className="bg-white rounded-lg shadow p-6 mb-8 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Email Template Configuration
          </h3>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Available Variables:
            </p>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((variable) => (
                <code
                  key={variable}
                  className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-mono"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              value={emailConfig.subject_template}
              onChange={(e) =>
                handleConfigChange('subject_template', e.target.value)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body *
            </label>
            <textarea
              value={emailConfig.body_template}
              onChange={(e) =>
                handleConfigChange('body_template', e.target.value)
              }
              rows="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustom"
              checked={emailConfig.use_custom_template}
              onChange={(e) =>
                handleConfigChange('use_custom_template', e.target.checked)
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="useCustom"
              className="text-sm text-gray-700"
            >
              Use custom template
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
            >
              {isSubmitting ? 'Updating...' : 'Update Template'}
            </button>
            <button
              type="button"
              onClick={generatePreview}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Generate Preview
            </button>
          </div>
        </form>

        {/* Preview */}
        {previewText && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Email Preview
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap wrap-break-words text-gray-900 text-sm">
              {previewText}
            </div>
          </div>
        )}

        {/* Send Emails Button */}
        <button
          onClick={handleSendEmails}
          disabled={isSendingEmails || !canSendEmails}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg transition"
        >
          {isSendingEmails
            ? '📧 Sending Emails...'
            : '📧 Send Emails to All Students'}
        </button>

        {!canSendEmails && (
          <div className="mt-4 text-center text-gray-600 text-sm">
            Send emails button is disabled. Please ensure drive is approved and
            has students.
          </div>
        )}
      </main>
    </div>
  );
}
