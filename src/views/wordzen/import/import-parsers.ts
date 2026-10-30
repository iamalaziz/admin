/**
 * Reads a CSV or JSON file into the modules `importModules` takes, and lists what is wrong
 * with it. No React here: an issue carries a translation key and its values, and the view
 * turns that into text.
 *
 * CSV is one row per card, the shape of `seed_card` in `docker/seed/learning.sql`; JSON is
 * `ModuleRequest` with its nested `CardRequest`s. The rules match `createCardFormSchema` in
 * `cards/card-form-sheet.tsx` — a term, at least one translation, and samples whose sentence
 * and translation are both filled — so an imported card is one the form would have saved.
 */
import Papa from 'papaparse'
import * as z from 'zod'

import type { TranslationKey } from '@/lib/i18n'
import type { CardImportPayload, LocaleCode, ModuleImportPayload } from '@/types/wordzen/content-types'
import { LOCALE_CODES } from '@/types/wordzen/content-types'

export type ImportFormat = 'csv' | 'json'

export const MAX_IMPORT_MEGABYTES = 5

export type ImportIssue = {
  key: TranslationKey
  values?: Record<string, string | number>

  /** An error blocks the import; a warning is something the import drops or works around. */
  severity: 'error' | 'warning'

  /** The CSV line, counting the header as line 1. */
  line?: number

  /** Where in a JSON file, e.g. `modules[0].cards[3].term`. */
  path?: string
}

export type ImportDraft = {
  modules: ModuleImportPayload[]
  issues: ImportIssue[]
}

const CSV_REQUIRED_COLUMNS = ['module', 'term'] as const

const csvTranslationColumn = (locale: LocaleCode) => locale.toLowerCase()

const csvSampleColumn = (locale: LocaleCode) => `sample_${locale.toLowerCase()}`

/** Every column the CSV reader knows, in the order the template writes them. */
const CSV_COLUMNS = [
  'module',
  'module_public',
  'term',
  'image',
  ...LOCALE_CODES.map(csvTranslationColumn),
  'sample',
  ...LOCALE_CODES.map(csvSampleColumn)
]

const normaliseText = (value: string) => value.trim().toLocaleLowerCase()

const stripBom = (text: string) => text.replace(/^﻿/, '')

const fail = (key: TranslationKey, values?: ImportIssue['values']): ImportDraft => ({
  modules: [],
  issues: [{ severity: 'error', key, values }]
})

/**
 * Groups cards under their module title as they arrive. Titles match the way the store
 * matches them, so a title repeated further down the file — or differing only in case —
 * adds to the module it already started rather than starting a second one.
 */
class ModuleCollector {
  private modules = new Map<string, ModuleImportPayload>()

  private terms = new Map<string, Set<string>>()

  /** Returns false when the module already holds the term, so the caller can warn. */
  add(title: string, isPublic: boolean, card: CardImportPayload | null): boolean {
    const key = normaliseText(title)
    let moduleRow = this.modules.get(key)

    if (!moduleRow) {
      moduleRow = { title: title.trim(), isPublic, cards: [] }
      this.modules.set(key, moduleRow)
      this.terms.set(key, new Set())
    }

    if (!card) {
      return true
    }

    const terms = this.terms.get(key)!
    const term = normaliseText(card.term)
    const isNew = !terms.has(term)

    terms.add(term)
    moduleRow.cards.push(card)

    return isNew
  }

  list = (): ModuleImportPayload[] => [...this.modules.values()]
}

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

const parseBoolean = (value: string): boolean | null => {
  switch (normaliseText(value)) {
    case 'true':
    case 'yes':
    case '1':
      return true
    case 'false':
    case 'no':
    case '0':
      return false
    default:
      return null
  }
}

export function parseCsv(input: string): ImportDraft {
  const parsed = Papa.parse<Record<string, string | undefined>>(stripBom(input), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.trim().toLowerCase()
  })

  const issues: ImportIssue[] = []

  for (const error of parsed.errors) {
    // A one-column file has no delimiter to find; the missing-column check says it better.
    if (error.type === 'Delimiter') {
      continue
    }

    issues.push({
      severity: error.type === 'Quotes' ? 'error' : 'warning',
      key: error.type === 'Quotes' ? 'manage.import.issues.csvMalformed' : 'manage.import.issues.csvFieldCount',
      values: { message: error.message },
      line: error.row === undefined ? undefined : error.row + 2
    })
  }

  const columns = parsed.meta.fields ?? []

  for (const column of CSV_REQUIRED_COLUMNS) {
    if (!columns.includes(column)) {
      issues.push({ severity: 'error', key: 'manage.import.issues.missingColumn', values: { column } })
    }
  }

  if (!LOCALE_CODES.some(locale => columns.includes(csvTranslationColumn(locale)))) {
    issues.push({
      severity: 'error',
      key: 'manage.import.issues.missingTranslationColumns',
      values: { columns: LOCALE_CODES.map(csvTranslationColumn).join(', ') }
    })
  }

  if (issues.some(issue => issue.severity === 'error')) {
    return { modules: [], issues }
  }

  for (const column of columns) {
    if (column && !CSV_COLUMNS.includes(column)) {
      issues.push({ severity: 'warning', key: 'manage.import.issues.unknownColumn', values: { column } })
    }
  }

  if (parsed.data.length === 0) {
    return { modules: [], issues: [...issues, { severity: 'error', key: 'manage.import.issues.empty' }] }
  }

  const collector = new ModuleCollector()

  parsed.data.forEach((row, index) => {
    const line = index + 2
    const cell = (column: string) => (row[column] ?? '').trim()

    const title = cell('module')
    const term = cell('term')

    if (!title) {
      issues.push({ severity: 'error', key: 'manage.import.issues.moduleRequired', line })

      return
    }

    let isPublic = false

    if (cell('module_public')) {
      const parsedBoolean = parseBoolean(cell('module_public'))

      if (parsedBoolean === null) {
        issues.push({
          severity: 'warning',
          key: 'manage.import.issues.invalidBoolean',
          values: { value: cell('module_public') },
          line
        })
      }

      isPublic = parsedBoolean ?? false
    }

    if (!term) {
      issues.push({ severity: 'error', key: 'manage.import.issues.termRequired', line })
      collector.add(title, isPublic, null)

      return
    }

    const translations = LOCALE_CODES.filter(locale => cell(csvTranslationColumn(locale))).map(locale => ({
      locale,
      value: cell(csvTranslationColumn(locale))
    }))

    if (translations.length === 0) {
      issues.push({ severity: 'error', key: 'manage.import.issues.translationsMin', values: { term }, line })
    }

    const sentence = cell('sample')
    const sampleLocales = LOCALE_CODES.filter(locale => cell(csvSampleColumn(locale)))

    if (sentence && sampleLocales.length === 0) {
      issues.push({ severity: 'warning', key: 'manage.import.issues.sampleWithoutTranslation', line })
    }

    if (!sentence && sampleLocales.length > 0) {
      issues.push({
        severity: 'warning',
        key: 'manage.import.issues.sampleWithoutSentence',
        values: { columns: sampleLocales.map(csvSampleColumn).join(', ') },
        line
      })
    }

    const samples = sentence
      ? sampleLocales.map(locale => ({ locale, value: sentence, translation: cell(csvSampleColumn(locale)) }))
      : []

    const card: CardImportPayload = { term, image: cell('image') || null, translations, samples }

    if (!collector.add(title, isPublic, card)) {
      issues.push({
        severity: 'warning',
        key: 'manage.import.issues.duplicateTerm',
        values: { term, module: title },
        line
      })
    }
  })

  return { modules: collector.list(), issues }
}

/* ------------------------------------------------------------------ *
 * JSON
 * ------------------------------------------------------------------ */

// zod is told the translation key as its message, so an issue can be handed straight on.
const issueKey = (key: TranslationKey) => ({ message: key })

const jsonCardSchema = z.object({
  term: z.string().trim().min(1, issueKey('manage.import.issues.termRequired')),
  image: z.string().trim().nullish(),
  translations: z
    .array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        value: z.string().trim().min(1, issueKey('manage.import.issues.translationRequired'))
      })
    )
    .min(1, issueKey('manage.import.issues.translationsMin')),
  samples: z
    .array(
      z.object({
        locale: z.enum(LOCALE_CODES),
        value: z.string().trim().min(1, issueKey('manage.import.issues.sentenceRequired')),
        translation: z.string().trim().min(1, issueKey('manage.import.issues.sentenceTranslationRequired'))
      })
    )
    .default([])
})

/** The module's own fields; its cards are checked one at a time so one bad card stays one issue. */
const jsonModuleSchema = z.object({
  title: z.string().trim().min(1, issueKey('manage.import.issues.moduleRequired')),
  isPublic: z.boolean().default(false),
  cards: z.array(z.unknown())
})

const formatPath = (path: (string | number)[]) =>
  path.reduce<string>((result, part) => (typeof part === 'number' ? `${result}[${part}]` : `${result}.${part}`), '')

const toIssues = (error: z.ZodError, prefix: (string | number)[], term?: string): ImportIssue[] =>
  error.issues.map((issue): ImportIssue => {
    const path = formatPath([...prefix, ...issue.path])

    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        severity: 'error',
        key: 'manage.import.issues.invalidLocale',
        values: { value: String(issue.received), locales: LOCALE_CODES.join(', ') },
        path
      }
    }

    if (issue.code === z.ZodIssueCode.invalid_type) {
      return {
        severity: 'error',
        key: 'manage.import.issues.invalidType',
        values: { expected: issue.expected, received: issue.received },
        path
      }
    }

    if (issue.message.startsWith('manage.import.issues.')) {
      return { severity: 'error', key: issue.message as TranslationKey, values: { term: term ?? '' }, path }
    }

    return { severity: 'error', key: 'manage.import.issues.invalidValue', values: { message: issue.message }, path }
  })

export function parseJson(input: string): ImportDraft {
  let root: unknown

  try {
    root = JSON.parse(stripBom(input))
  } catch (error) {
    return fail('manage.import.issues.invalidJson', { message: error instanceof Error ? error.message : String(error) })
  }

  const isWrapped = typeof root === 'object' && root !== null && !Array.isArray(root) && 'modules' in root
  const modules = isWrapped ? (root as { modules: unknown }).modules : root

  if (!Array.isArray(modules)) {
    return fail('manage.import.issues.jsonShape')
  }

  if (modules.length === 0) {
    return fail('manage.import.issues.empty')
  }

  const prefix = isWrapped ? ['modules'] : []
  const issues: ImportIssue[] = []
  const collector = new ModuleCollector()

  modules.forEach((rawModule, moduleIndex) => {
    const parsedModule = jsonModuleSchema.safeParse(rawModule)

    if (!parsedModule.success) {
      issues.push(...toIssues(parsedModule.error, [...prefix, moduleIndex]))

      return
    }

    const { title, isPublic, cards } = parsedModule.data

    collector.add(title, isPublic, null)

    cards.forEach((rawCard, cardIndex) => {
      const cardPrefix = [...prefix, moduleIndex, 'cards', cardIndex]
      const parsedCard = jsonCardSchema.safeParse(rawCard)

      if (!parsedCard.success) {
        const term = typeof rawCard === 'object' && rawCard !== null ? (rawCard as { term?: unknown }).term : undefined

        issues.push(...toIssues(parsedCard.error, cardPrefix, typeof term === 'string' ? term : undefined))

        return
      }

      const { term, image, translations, samples } = parsedCard.data

      if (!collector.add(title, isPublic, { term, image: image || null, translations, samples })) {
        issues.push({
          severity: 'warning',
          key: 'manage.import.issues.duplicateTerm',
          values: { term, module: title },
          path: formatPath(cardPrefix)
        })
      }
    })
  })

  return { modules: collector.list(), issues }
}

/* ------------------------------------------------------------------ *
 * Files
 * ------------------------------------------------------------------ */

export const detectFormat = (file: File): ImportFormat | null => {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv') || file.type === 'text/csv') {
    return 'csv'
  }

  if (name.endsWith('.json') || file.type === 'application/json') {
    return 'json'
  }

  return null
}

export async function parseImportFile(file: File): Promise<ImportDraft> {
  const format = detectFormat(file)

  if (!format) {
    return fail('manage.import.issues.unsupportedFormat')
  }

  if (file.size > MAX_IMPORT_MEGABYTES * 1024 * 1024) {
    return fail('manage.import.issues.tooLarge', { max: MAX_IMPORT_MEGABYTES })
  }

  const text = stripBom(await file.text())

  // Said once here: otherwise a blank CSV reports every missing column, and blank JSON a syntax error.
  if (!text.trim()) {
    return fail('manage.import.issues.empty')
  }

  return format === 'csv' ? parseCsv(text) : parseJson(text)
}

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

/** A few rows of `docker/seed/learning.sql`, so the template is real content rather than lorem. */
const TEMPLATE_MODULES: ModuleImportPayload[] = [
  {
    title: 'Greetings',
    isPublic: true,
    cards: [
      {
        term: 'hello',
        image: null,
        translations: [
          { locale: 'RU', value: 'привет' },
          { locale: 'UZ', value: 'salom' }
        ],
        samples: [
          { locale: 'RU', value: 'Hello, how are you?', translation: 'Привет, как дела?' },
          { locale: 'UZ', value: 'Hello, how are you?', translation: 'Salom, ishlaringiz qalay?' }
        ]
      },
      {
        term: 'thank you',
        image: null,
        translations: [
          { locale: 'RU', value: 'спасибо' },
          { locale: 'UZ', value: 'rahmat' }
        ],
        samples: [
          { locale: 'RU', value: 'Thank you for your help.', translation: 'Спасибо за помощь.' },
          { locale: 'UZ', value: 'Thank you for your help.', translation: 'Yordamingiz uchun rahmat.' }
        ]
      }
    ]
  },
  {
    title: 'Family',
    isPublic: false,
    cards: [
      {
        term: 'mother',
        image: null,
        translations: [
          { locale: 'RU', value: 'мама' },
          { locale: 'UZ', value: 'ona' }
        ],
        samples: [
          { locale: 'RU', value: 'My mother is a teacher.', translation: 'Моя мама — учитель.' },
          { locale: 'UZ', value: 'My mother is a teacher.', translation: 'Mening onam oʻqituvchi.' }
        ]
      },
      {
        term: 'father',
        image: null,
        translations: [{ locale: 'RU', value: 'отец' }],
        samples: []
      }
    ]
  }
]

/**
 * One CSV row per card. A row has a single `sample` column, so only a card's first
 * sentence makes it in, with every rendering of that sentence alongside.
 */
const toCsv = (modules: ModuleImportPayload[]): string =>
  Papa.unparse({
    fields: CSV_COLUMNS,
    data: modules.flatMap(moduleRow =>
      moduleRow.cards.map(card => {
        const sentence = card.samples[0]?.value ?? ''

        return [
          moduleRow.title,
          String(moduleRow.isPublic),
          card.term,
          card.image ?? '',
          ...LOCALE_CODES.map(locale => card.translations.find(item => item.locale === locale)?.value ?? ''),
          sentence,
          ...LOCALE_CODES.map(
            locale =>
              card.samples.find(sample => sample.locale === locale && sample.value === sentence)?.translation ?? ''
          )
        ]
      })
    )
  })

export const buildTemplate = (format: ImportFormat): string =>
  format === 'csv' ? toCsv(TEMPLATE_MODULES) : JSON.stringify({ modules: TEMPLATE_MODULES }, null, 2)
