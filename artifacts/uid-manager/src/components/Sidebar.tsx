import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <aside className="fixed top-0 right-0 h-full w-72 bg-gray-900 dark:bg-gray-950 text-white z-50 shadow-xl p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">{t("hamburgerMenu")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        <nav className="space-y-2">
          <Link
            to="/"
            onClick={onClose}
            className="block px-3 py-2 rounded hover:bg-gray-700"
          >
            {t("appTitle")}
          </Link>
          <Link
            to="/admin-panel-x7k9"
            onClick={onClose}
            className="block px-3 py-2 rounded hover:bg-gray-700 text-yellow-400"
          >
            {t("adminPanel")}
          </Link>
        </nav>
      </aside>
    </>
  );
}
