'use client'

// React Imports
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

// Config Imports
import { FALLBACK_LANGUAGE, type UILanguage } from '@/configs/i18nConfig'

import { I18nContext } from './i18nContext'
import { getSnapshot, setStoredLanguage, subscribe } from './languageStore'
import { locales } from './locales'
import type { TranslationKey } from './translationKeys'

const getNestedValue = (obj: unknown, path: string): unknown => {
  let value: unknown = obj

  for (const key of path.split('.')) {
    if (value == null || typeof value !== 'object') {
      return undefined
    }

    value = (value as Record<string, unknown>)[key]
  }

  return value
}

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) {
    return template
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

type Props = {
  children: ReactNode

  /**
   * Read from the language cookie by the root layout. It is what the server renders and
   * what React hydrates against, so it has to match the cookie the client store reads —
   * that match is what keeps the first paint from flashing the fallback language.
   */
  initialLanguage?: UILanguage
}

export const I18nProvider = ({ children, initialLanguage = FALLBACK_LANGUAGE }: Props) => {
  const getServerSnapshot = useCallback(() => initialLanguage, [initialLanguage])

  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: UILanguage) => setStoredLanguage(next), [])

  const t = useMemo(() => {
    const translations = locales[language] ?? locales[FALLBACK_LANGUAGE]

    return (key: TranslationKey, params?: Record<string, string | number>): string => {
      let value = getNestedValue(translations, key)

      if (typeof value !== 'string') {
        value = getNestedValue(locales[FALLBACK_LANGUAGE], key)
      }

      return typeof value === 'string' ? interpolate(value, params) : key
    }
  }, [language])

  const value = useMemo(() => ({ t, language, setLanguage }), [t, language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export default I18nProvider
