import i18n from 'i18next';
import ar from '../public/locales/ar.json';
import en from '../public/locales/en.json';

if (!i18n.isInitialized) {
  i18n.init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: 'ar',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n; 