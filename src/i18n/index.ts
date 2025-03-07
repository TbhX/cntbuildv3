import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import translations directly
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ko from './locales/ko.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  ko: { translation: ko }
};

i18n
  // Load translations using HTTP backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'es', 'ko'],
    
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    
    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    
    // Detection configuration
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;