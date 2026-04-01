import { createI18n } from 'vue-i18n'
import { messages, type AppLocale } from './messages'

export const DEFAULT_LOCALE: AppLocale = 'en'
export const LOCALE_STORAGE_KEY = 'portfolio-locale'
export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'pt-BR', 'es']

const getStartingLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale | null

  if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
    return storedLocale
  }

  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: getStartingLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export type { AppLocale }
