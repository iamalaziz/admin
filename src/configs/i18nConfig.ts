export const UI_LANGUAGES = ['en', 'ru', 'uz'] as const

export type UILanguage = (typeof UI_LANGUAGES)[number]

/** English, never Russian: an untranslated string should read as the source copy. */
export const FALLBACK_LANGUAGE: UILanguage = 'en'

/** Each language named in itself — a switcher is read by someone who cannot read the current one. */
export const LANGUAGE_LABELS: Record<UILanguage, string> = {
  en: 'English',
  ru: 'Русский',
  uz: 'O‘zbekcha'
}

export const LANGUAGE_STORAGE_KEY = 'wordzen-admin.language'

export const isUILanguage = (value: unknown): value is UILanguage =>
  typeof value === 'string' && (UI_LANGUAGES as readonly string[]).includes(value)
