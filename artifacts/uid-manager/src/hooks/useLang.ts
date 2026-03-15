import { useTranslation } from "react-i18next";
import i18next from "../i18n";

export function useLang() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const toggle = () => {
    const next = current === "en" ? "bn" : "en";
    void i18next.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return { lang: current, toggle };
}
