import React from 'react'
import { translations } from './translations'
import type { TranslationKey } from './translations'
import { LanguageContext, useLanguage, useLanguageState } from './useLanguage'

export { translations } from './translations'
export type { Language, TranslationKey } from './translations'
export { LanguageContext, useLanguage, useLanguageState, getStoredLanguage } from './useLanguage'
export type { LanguageContextValue } from './useLanguage'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const value = useLanguageState()
  return React.createElement(LanguageContext.Provider, { value }, children)
}

/** Convenience hook: returns a t() translation function scoped to the current language. */
export function useT() {
  const { language } = useLanguage()
  return function t(key: TranslationKey): string {
    return translations[language][key] ?? translations['en'][key] ?? key
  }
}
