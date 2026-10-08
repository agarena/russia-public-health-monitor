import { Navigate, Route, Routes } from "react-router-dom";
import BriefingPage from "@/pages/BriefingPage";

export default function App() {
  return (
    <Routes>
      <Route index element={<BriefingPage />} />
      {/* 单页设计：其余路径一律回到首页（旧多页链接自动归位） */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
