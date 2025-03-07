import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = {
  en: {
    flag: 'https://flagcdn.com/w40/gb.png',
    flagAlt: 'UK flag'
  },
  fr: {
    flag: 'https://flagcdn.com/w40/fr.png',
    flagAlt: 'French flag'
  },
  es: {
    flag: 'https://flagcdn.com/w40/es.png',
    flagAlt: 'Spanish flag'
  },
  ko: {
    flag: 'https://flagcdn.com/w40/kr.png',
    flagAlt: 'South Korean flag'
  }
};

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLanguage = languages[i18n.language as keyof typeof languages];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 bg-[#1E2328]/80 rounded-full border border-[#785A28] hover:border-[#C8AA6E] transition-colors"
      >
        <img 
          src={currentLanguage?.flag || languages.en.flag} 
          alt={currentLanguage?.flagAlt || languages.en.flagAlt}
          className="w-6 h-4 rounded object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#1E2328]/95 border border-[#785A28] rounded-lg shadow-lg py-2 z-50">
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`w-full px-4 py-2 flex items-center justify-center hover:bg-[#785A28]/20 ${
                i18n.language === code ? 'bg-[#0AC8B9]/10' : ''
              }`}
            >
              <img 
                src={lang.flag} 
                alt={lang.flagAlt}
                className={`w-8 h-6 rounded object-cover transition-transform hover:scale-110 ${
                  i18n.language === code ? 'ring-2 ring-[#0AC8B9] ring-offset-1 ring-offset-[#1E2328]' : ''
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}