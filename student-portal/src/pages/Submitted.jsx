import { useNavigate } from "react-router-dom";

const Submitted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 fade-in">
      <div className="w-full max-w-md card p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-linear-to-r from-green-400 to-blue-500 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl mb-3">
          Exam Submitted Successfully
        </h1>

        <p className="text-sm text-gray-600 mb-8">
          Your responses have been recorded. You may now close this window or wait for the results.
        </p>

        {/* Info Box */}
        <div className="bg-linear-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 text-left text-sm text-gray-700 mb-8">
          <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              Make sure you do not refresh or re-login.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              Results will be shared by the company.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              Any further instructions will be communicated via email.
            </li>
          </ul>
        </div>

        {/* Action */}
        <button
          onClick={() => navigate("/login")}
          className="btn-primary w-full"
        >
          Exit Exam
        </button>
      </div>
    </div>
  );
};

export default Submitted;
