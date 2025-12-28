import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Instructions from "../pages/Instructions";
import Exam from "../pages/Exam";
import Submitted from "../pages/Submitted";
import Result from "../pages/Result";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/exam" element={<Exam />} />
      <Route path="/submitted" element={<Submitted />} />
      <Route path="/result" element={<Result />} />

      <Route path="*" element={<h1 className="text-center mt-20">Page Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;
