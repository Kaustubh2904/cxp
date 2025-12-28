import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    examId: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔹 Backend yahin connect hoga later
    // Abhi sirf flow simulate kar rahe hain
    navigate("/instructions");
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-in">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-3xl text-center mb-2">
          Student Login
        </h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Enter your details to access the exam
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Roll No / Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roll Number / Email
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="e.g. 21CS101 or student@email.com"
              className="input-field w-full"
              required
            />
          </div>

          {/* Exam / Drive ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exam ID / Drive Name
            </label>
            <input
              type="text"
              name="examId"
              value={formData.examId}
              onChange={handleChange}
              placeholder="e.g. DRIVE_2025"
              className="input-field w-full"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Login to Exam
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-8">
          Make sure you are logging in during the scheduled exam time.
        </p>
      </div>
    </div>
  );
};

export default Login;
