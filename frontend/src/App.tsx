import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import TimelinePage from "@/pages/TimelinePage";
import SourcesPage from "@/pages/SourcesPage";
import EvidencePage from "@/pages/EvidencePage";
import HistoryPage from "@/pages/HistoryPage";
import MethodologyPage from "@/pages/MethodologyPage";
import DisclaimerPage from "@/pages/DisclaimerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="disclaimer" element={<DisclaimerPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
