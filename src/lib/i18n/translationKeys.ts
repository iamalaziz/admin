import type { Translations } from './types'

type FlattenKeys<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? FlattenKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
      }[keyof T & string]
    : never

/** Every dotted path in `locales/en.json`, so a typo in `t('…')` is a type error. */
export type TranslationKey = FlattenKeys<Translations>
