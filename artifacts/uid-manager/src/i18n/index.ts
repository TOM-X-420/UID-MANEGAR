import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import bn from "./locales/bn.json";

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: localStorage.getItem("lang") ?? "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
