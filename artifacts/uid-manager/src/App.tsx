import { Routes, Route } from 'react-router-dom';
import UIDManagerPage from './pages/UIDManagerPage';
import DumpingSystemPage from './pages/DumpingSystemPage';
import FileToolsPage from './pages/FileToolsPage';
import AdminPanelPage from './pages/AdminPanelPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UIDManagerPage />} />
      <Route path="/dumping-system" element={<DumpingSystemPage />} />
      <Route path="/file-tools" element={<FileToolsPage />} />
      <Route path="/admin-panel-x7k9" element={<AdminPanelPage />} />
    </Routes>
  );
}
