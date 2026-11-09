import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enUS from './locales/en-US';
import esES from './locales/es-ES';
import ptBR from './locales/pt-BR';

export type Translation = typeof enUS;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Translation };
  }
}

export const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'es-ES', name: 'Español (España)' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export function toSupportedLanguage(detected: string): string {
  const base = detected.toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.find(({ code }) => code.toLowerCase().startsWith(`${base}-`))?.code ?? detected;
}

export async function initI18n() {
  await i18next.use(LanguageDetector).init({
    resources: {
      'en-US': { translation: enUS },
      'pt-BR': { translation: ptBR },
      'es-ES': { translation: esES },
    },
    supportedLngs: LANGUAGES.map(({ code }) => code),
    fallbackLng: 'en-US',
    load: 'currentOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'pdf-helpers.language',
      caches: ['localStorage'],
      convertDetectedLanguage: toSupportedLanguage,
    },
  });
}

export const currentLanguage = () => i18next.resolvedLanguage as Language;

export const formatBytes = (bytes: number) => {
  const units = ['byte', 'kilobyte', 'megabyte'] as const;
  const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
  return new Intl.NumberFormat(currentLanguage(), {
    style: 'unit',
    unit: units[exponent],
    unitDisplay: 'short',
    maximumFractionDigits: exponent === 2 ? 2 : exponent === 1 ? 1 : 0,
  }).format(bytes / 1024 ** exponent);
};

export { i18next };
