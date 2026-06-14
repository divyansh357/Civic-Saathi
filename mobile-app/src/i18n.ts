import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
};

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      // Get stored language from Async Storage
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          return callback(language);
        } else {
          // If no stored language, get device language
          const locales = Localization.getLocales();
          const deviceLang = locales[0]?.languageCode || 'en';
          return callback(deviceLang.startsWith('hi') ? 'hi' : 'en');
        }
      });
    } catch (error) {
      console.log('Error reading language', error);
      callback('en');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // react-native does not need escaping
    },
  });

export default i18n;
