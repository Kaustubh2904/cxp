import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Exam = () => {
  const navigate = useNavigate();

  // frontend-only state (backend later replace karega)
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // mock questions (shape backend-ready hai)
  const questions = [
    {
      id: 1,
      type: "MCQ",
      question: "What is the capital of India?",
      options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    },
    {
      id: 2,
      type: "MCQ",
      question: "Which language runs in the browser?",
      options: ["Java", "C", "Python", "JavaScript"],
    },
  ];

  const handleSubmitExam = () => {
    // backend later yahin submission confirm karega
    navigate("/submitted");
  };

  return (
    <div className="min-h-screen flex flex-col fade-in">
      {/* Top Bar */}
      <div className="exam-header px-6 py-4 flex justify-between items-center">
        <div className="pl-10 flex flex-col">
          <h1 className="text-xl font-bold">Aptitude Test</h1>
          <p className="text-xs opacity-90">Company Exam Portal</p>
        </div>

        {/* Timer UI only */}
        <div className="timer">
          Time Left: 59:32
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Palette */}
        <div className="w-64 question-palette border-r p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Questions</h2>
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`question-button h-10 w-10 text-sm ${
                  index === currentQuestion
                    ? "active"
                    : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-linear-to-r from-white to-blue-50">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-4 font-medium">
              Question {currentQuestion + 1} of {questions.length}
            </p>

            <h2 className="text-xl font-semibold mb-8 text-gray-800 leading-relaxed">
              {questions[currentQuestion].question}
            </h2>

            {/* MCQ UI */}
            <div className="space-y-4">
              {questions[currentQuestion].options.map((opt, idx) => (
                <label
                  key={idx}
                  className="option-label flex items-center gap-4 cursor-pointer"
                >
                  <input type="radio" name="option" className="mr-2" />
                  <span className="text-gray-700 font-medium">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="action-bar flex justify-between items-center">
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-4">
          <button
            onClick={() =>
              setCurrentQuestion((prev) =>
                Math.min(prev + 1, questions.length - 1)
              )
            }
            className="btn-primary"
          >
            Save & Next
          </button>

          <button
            onClick={handleSubmitExam}
            className="btn-danger"
          >
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default Exam;
