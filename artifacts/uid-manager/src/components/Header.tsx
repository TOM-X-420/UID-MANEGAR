import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../hooks/useLang";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const { t } = useTranslation();
  const { dark, toggle: toggleTheme } = useTheme();
  const { toggle: toggleLang } = useLang();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-950 text-white shadow-md">
      <div>
        <h1 className="text-lg font-bold">{t("appTitle")}</h1>
        <p className="text-xs text-gray-400">{t("tagline")}</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600 transition-colors"
          aria-label={t("langToggle")}
          title={t("langToggle")}
        >
          {t("langToggle")}
        </button>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={t("themeToggle")}
          title={t("themeToggle")}
        >
          {dark ? "☀️" : "🌙"}
        </button>
        {/* Hamburger Menu */}
        <button
          onClick={onMenuOpen}
          className="px-2 py-1 text-lg rounded hover:bg-gray-700 transition-colors"
          aria-label={t("hamburgerMenu")}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
