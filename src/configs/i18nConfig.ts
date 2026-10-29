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

/**
 * The choice is kept in a cookie so the server renders the first HTML in the right
 * language. localStorage cannot do that: the server never sees it, so the page would
 * come back in English and only switch after hydration.
 */
export const LANGUAGE_COOKIE_KEY = 'wordzen-admin.language'

export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Written on every switch purely to wake other tabs through the `storage` event. */
export const LANGUAGE_BROADCAST_KEY = 'wordzen-admin.language'

export const isUILanguage = (value: unknown): value is UILanguage =>
  typeof value === 'string' && (UI_LANGUAGES as readonly string[]).includes(value)
