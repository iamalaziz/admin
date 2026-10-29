'use client'

import { createContext } from 'react'

import type { UILanguage } from '@/configs/i18nConfig'

import type { TranslationKey } from './translationKeys'

/**
 * `t` looks a key up in the active locale, falling back to English, then to the key
 * itself — so a missing translation shows the key rather than an empty string.
 */
export interface I18nContextValue {
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  language: UILanguage
  setLanguage: (language: UILanguage) => void
}

export const I18nContext = createContext<I18nContextValue | null>(null)
