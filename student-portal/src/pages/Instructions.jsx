import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Instructions = () => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleStartExam = () => {
    if (!accepted) return;
    // 🔹 Backend later yahin se exam start confirm karega
    navigate("/exam");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 fade-in">
      <div className="w-full max-w-4xl card p-8">
        <h1 className="text-3xl mb-3">
          Exam Instructions
        </h1>

        <p className="text-sm text-gray-600 mb-8">
          Please read the following instructions carefully before starting the exam.
        </p>

        {/* Exam Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="info-card">
            <p className="text-xs text-gray-500 font-medium">Exam Name</p>
            <p className="font-semibold text-lg text-gray-800">Aptitude Test</p>
          </div>
          <div className="info-card">
            <p className="text-xs text-gray-500 font-medium">Duration</p>
            <p className="font-semibold text-lg text-gray-800">60 Minutes</p>
          </div>
          <div className="info-card">
            <p className="text-xs text-gray-500 font-medium">Total Questions</p>
            <p className="font-semibold text-lg text-gray-800">30</p>
          </div>
        </div>

        {/* Instructions List */}
        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Important Guidelines:</h3>
          <ul className="list-disc list-inside space-y-3 text-sm text-gray-700">
            <li>The exam is time-bound. Timer will start immediately.</li>
            <li>Do not refresh or close the browser during the exam.</li>
            <li>Each question must be answered within the given time.</li>
            <li>Tab switching may lead to warnings or auto-submission.</li>
            <li>Your responses are auto-saved.</li>
          </ul>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <input
            type="checkbox"
            id="accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="checkbox-custom"
          />
          <label htmlFor="accept" className="text-sm text-gray-700 font-medium cursor-pointer">
            I have read and understood all the instructions
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate("/login")}
            className="btn-secondary"
          >
            Back
          </button>

          <button
            onClick={handleStartExam}
            disabled={!accepted}
            className={`btn-primary ${!accepted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
