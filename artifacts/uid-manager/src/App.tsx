import React from "react";
import { Routes, Route } from "react-router-dom";
import { UidManagerPage } from "./pages/UidManagerPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UidManagerPage />} />
      <Route path="/admin-panel-x7k9" element={<AdminPage />} />
    </Routes>
  );
}
