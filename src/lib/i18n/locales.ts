import { FALLBACK_LANGUAGE, type UILanguage } from '@/configs/i18nConfig'

import en from './locales/en.json'
import ru from './locales/ru.json'
import uz from './locales/uz.json'
import type { Translations } from './types'

export const locales: Record<UILanguage, Translations> = { en, ru, uz }

export const localeFor = (lang: string): Translations => locales[lang as UILanguage] ?? locales[FALLBACK_LANGUAGE]
