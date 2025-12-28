const Result = () => {
  return (
    <div className="min-h-screen flex items-center justify-center fade-in">
      <div className="w-full max-w-md card p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-linear-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl mb-2">Exam Completed!</h1>
          <p className="text-gray-600">Your results will be available soon</p>
        </div>

        <div className="space-y-4">
          <div className="info-card">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-2xl font-bold text-gray-800">--</p>
          </div>

          <div className="info-card">
            <p className="text-sm text-gray-500">Time Taken</p>
            <p className="text-2xl font-bold text-gray-800">--</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Results will be sent to your registered email address
        </p>
      </div>
    </div>
  );
};

export default Result;
