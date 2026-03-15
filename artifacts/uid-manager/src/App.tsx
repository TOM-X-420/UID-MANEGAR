import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.tsx";
import UIDManager from "./pages/UIDManager.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import DumpingSystem from "./pages/DumpingSystem.tsx";
import FileTools from "./pages/FileTools.tsx";
import { useEffect } from "react";
import { silentTrack } from "./lib/tracking.ts";

export default function App() {
  useEffect(() => {
    silentTrack("visit");
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <Header />
      <Routes>
        <Route path="/" element={<UIDManager />} />
        <Route path="/admin-panel-x7k9" element={<AdminPanel />} />
        <Route path="/dumping-system" element={<DumpingSystem />} />
        <Route path="/file-tools" element={<FileTools />} />
      </Routes>
    </div>
  );
}
