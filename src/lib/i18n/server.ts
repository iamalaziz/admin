// Next Imports
import { cookies } from 'next/headers'

// Config Imports
import { FALLBACK_LANGUAGE, LANGUAGE_COOKIE_KEY, isUILanguage, type UILanguage } from '@/configs/i18nConfig'

/**
 * Server-only: the language the first HTML should be rendered in. Reading the cookie here
 * makes the layout dynamic, which is what lets the page arrive already translated.
 */
export const getInitialLanguage = async (): Promise<UILanguage> => {
  const stored = (await cookies()).get(LANGUAGE_COOKIE_KEY)?.value

  return isUILanguage(stored) ? stored : FALLBACK_LANGUAGE
}
