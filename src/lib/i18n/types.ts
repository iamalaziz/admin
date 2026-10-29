import type en from './locales/en.json'

/** The English locale is the schema: every other locale must match its shape. */
export type Translations = typeof en
