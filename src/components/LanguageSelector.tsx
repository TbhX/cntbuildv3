import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = {
  en: {
    name: 'English',
    flag: 'https://flagcdn.com/w80/gb.png',
    flagAlt: 'UK flag',
    locale: 'en-US'
  },
  fr: {
    name: 'Français',
    flag: 'https://flagcdn.com/w80/fr.png',
    flagAlt: 'French flag',
    locale: 'fr-FR'
  },
  es: {
    name: 'Español',
    flag: 'https://flagcdn.com/w80/es.png',
    flagAlt: 'Spanish flag',
    locale: 'es-ES'
  },
  ko: {
    name: '한국어',
    flag: 'https://flagcdn.com/w80/kr.png',
    flagAlt: 'South Korean flag',
    locale: 'ko-KR'
  }
} as const;

export type SupportedLanguage = keyof typeof languages;

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = languages[lng].locale;
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages[i18n.language as SupportedLanguage] || languages.en;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#1E2328]/80 px-3 py-2 rounded-lg border border-[#785A28] hover:border-[#C8AA6E] transition-colors"
      >
        <img 
          src={currentLanguage.flag}
          alt={currentLanguage.flagAlt}
          className="w-6 h-4 rounded object-cover"
        />
        <span className="text-[#F0E6D2] text-sm hidden md:inline">{currentLanguage.name}</span>
        <Globe className="w-4 h-4 text-[#C8AA6E]" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#1E2328]/95 border border-[#785A28] rounded-lg shadow-lg py-2 z-50 min-w-[160px]">
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code as SupportedLanguage)}
              className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-[#785A28]/20 transition-colors ${
                i18n.language === code ? 'bg-[#0AC8B9]/10' : ''
              }`}
            >
              <img 
                src={lang.flag}
                alt={lang.flagAlt}
                className={`w-6 h-4 rounded object-cover ${
                  i18n.language === code ? 'ring-2 ring-[#0AC8B9] ring-offset-1 ring-offset-[#1E2328]' : ''
                }`}
              />
              <span className={`text-sm ${
                i18n.language === code ? 'text-[#0AC8B9]' : 'text-[#F0E6D2]'
              }`}>
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}