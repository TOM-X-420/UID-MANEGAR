import { createContext, useContext, useState, useCallback } from 'react'
import type { Language } from './translations'

const STORAGE_KEY = 'uid-manager-language'

export interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
})

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'bn') return stored
  } catch {
    // ignore
  }
  return 'en'
}

export function useLanguageState(): LanguageContextValue {
  const [language, setLangState] = useState<Language>(getStoredLanguage)

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
    setLangState(lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'bn' : 'en')
  }, [language, setLanguage])

  return { language, setLanguage, toggleLanguage }
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
