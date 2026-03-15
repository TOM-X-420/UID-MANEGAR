import { useLanguage } from '../i18n'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      aria-label={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
      title={language === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '6px',
        color: '#e6edf3',
        padding: '4px 12px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {language === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
    </button>
  )
}
