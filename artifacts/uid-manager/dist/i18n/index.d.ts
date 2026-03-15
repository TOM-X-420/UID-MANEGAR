import React from 'react';
import type { TranslationKey } from './translations';
export { translations } from './translations';
export type { Language, TranslationKey } from './translations';
export { LanguageContext, useLanguage, useLanguageState, getStoredLanguage } from './useLanguage';
export type { LanguageContextValue } from './useLanguage';
export declare function LanguageProvider({ children }: {
    children: React.ReactNode;
}): React.FunctionComponentElement<React.ProviderProps<import("./useLanguage").LanguageContextValue>>;
/** Convenience hook: returns a t() translation function scoped to the current language. */
export declare function useT(): (key: TranslationKey) => string;
//# sourceMappingURL=index.d.ts.map