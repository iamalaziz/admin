/**
 * Mirrors the learning-api content model: `entity/Course`, `entity/Module`, `entity/Card`,
 * `entity/PhraseCard` and the `dto/response/*View` shapes the manager endpoints return.
 * Keep the field names aligned with the API — the mock store stands in for
 * `/api/v1/manager/**` and should be swappable for a real client.
 */

export const LOCALE_CODES = ['RU', 'UZ', 'EN'] as const

export type LocaleCode = (typeof LOCALE_CODES)[number]

export const COURSE_ACCESS_CODES = ['FREE', 'BASIC', 'PRO'] as const

export type CourseAccessCode = (typeof COURSE_ACCESS_CODES)[number]

export const COURSE_CATEGORY_CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'SPEAKING', 'READING', 'WRITING'] as const

export type CourseCategoryCode = (typeof COURSE_CATEGORY_CODES)[number]

/** `dto/response/CourseCategoryView`. Names match `docker/postgres/seed-learning.sql`. */
export type CourseCategory = {
  name: string
  code: CourseCategoryCode
}

/**
 * The `course_category` rows `docker/postgres/seed-learning.sql` inserts.
 *
 * This is the fixture the mock store starts from, not the catalogue: categories are
 * editable now, so read the live list from the store (`listCategories()`) and keep this
 * for seeding and for naming a code the store no longer holds.
 */
export const SEED_COURSE_CATEGORIES: readonly CourseCategory[] = [
  { code: 'A1', name: 'Beginner' },
  { code: 'A2', name: 'Elementary' },
  { code: 'B1', name: 'Intermediate' },
  { code: 'B2', name: 'Upper Intermediate' },
  { code: 'C1', name: 'Advanced' },
  { code: 'C2', name: 'Proficiency' },
  { code: 'SPEAKING', name: 'Speaking' },
  { code: 'READING', name: 'Reading' },
  { code: 'WRITING', name: 'Writing' }
]

/** The seed name for a code. The store resolves against its own rows first. */
export const categoryByCode = (code: CourseCategoryCode): CourseCategory =>
  SEED_COURSE_CATEGORIES.find(category => category.code === code) ?? SEED_COURSE_CATEGORIES[0]

/** `dto/response/TranslationView` */
export type Translation = {
  id: number
  value: string
  locale: LocaleCode
}

/** `dto/response/SampleView` — `value` is the sentence, `translation` its rendering. */
export type Sample = {
  id: number
  value: string
  translation: string
  locale: LocaleCode
}

/** `dto/response/PhraseExplanationView` */
export type PhraseExplanation = {
  id: number
  text: string
  locale: LocaleCode
}

/** `dto/response/CourseDescriptionView` (the column is `val`, the DTO exposes `value`). */
export type CourseDescription = {
  id: number
  value: string
  locale: LocaleCode
}

/** `dto/response/CardView` plus the `moduleId` that `dto/query/ManagerCardRow` carries. */
export type Card = {
  id: number
  createdAt: string
  term: string
  image: string | null
  displayOrder: number
  moduleId: number
  translations: Translation[]
  samples: Sample[]
}

/** `dto/response/PhraseCardView` plus its owning module. */
export type PhraseCard = {
  id: number
  createdAt: string
  text: string
  displayOrder: number
  moduleId: number
  explanations: PhraseExplanation[]
}

/**
 * `dto/response/ModuleView`. `cardCount`/`phraseCardCount` are not on the DTO: the API
 * serves cards through `/manager/modules/{id}/cards`, so a real client would either
 * count that response or wait for the counts to be added to ModuleView.
 */
export type Module = {
  id: number
  createdAt: string
  title: string
  isPublic: boolean
  displayOrder: number
  courseId: number
  cardCount: number
  phraseCardCount: number
}

/**
 * `dto/response/CourseView`, minus the learner-only fields (`inLibrary`, `purchased`,
 * `tag`) and plus the author, which `entity/Course` holds and the manager list is scoped by.
 */
export type Course = {
  id: number
  createdAt: string
  title: string
  category: CourseCategory
  isPublic: boolean
  cover: string | null
  displayOrder: number
  accessCode: CourseAccessCode
  authorUid: string
  authorUsername: string
  descriptions: CourseDescription[]
  moduleCount: number
}

/* ------------------------------------------------------------------ *
 * Request payloads — `dto/request/*Request`
 * ------------------------------------------------------------------ */

/** `dto/request/TranslationRequest` */
export type TranslationPayload = {
  value: string
  locale: LocaleCode
}

/** `dto/request/SampleRequest` */
export type SamplePayload = {
  value: string
  translation: string
  locale: LocaleCode
}

/** `dto/request/PhraseExplanationRequest` */
export type PhraseExplanationPayload = {
  text: string
  locale: LocaleCode
}

/** `dto/request/CourseDescriptionRequest` */
export type CourseDescriptionPayload = {
  value: string
  locale: LocaleCode
}

/**
 * No `dto/request/*` backs this one: `course_category` is seeded SQL and no manager
 * endpoint writes it yet. `code` is the enum column `CourseRequest.category` refers to,
 * so the name is the only free-form field a category has.
 */
export type CourseCategoryPayload = {
  name: string
  code: CourseCategoryCode
}

/** `dto/request/CourseRequest` (nested `modules` are omitted: modules are created on their own endpoint). */
export type CoursePayload = {
  title: string
  category: CourseCategoryCode
  isPublic: boolean
  cover: string | null
  displayOrder: number
  accessCode: CourseAccessCode
  descriptions: CourseDescriptionPayload[]
}

/** `dto/request/ModuleRequest` */
export type ModulePayload = {
  title: string
  isPublic: boolean
  courseId: number
  displayOrder: number
}

/** `dto/request/CardRequest` */
export type CardPayload = {
  term: string
  image: string | null
  moduleId: number
  displayOrder: number
  translations: TranslationPayload[]
  samples: SamplePayload[]
}

/**
 * A card inside a `ModuleImportPayload`. `ModuleRequest.cards` nests `CardRequest`s the
 * same way: the module id is the parent's and the order is the position in the list.
 */
export type CardImportPayload = Omit<CardPayload, 'moduleId' | 'displayOrder'>

/** `dto/request/ModuleRequest` with its nested `cards`, minus what the target course decides. */
export type ModuleImportPayload = {
  title: string
  isPublic: boolean
  cards: CardImportPayload[]
}

/** What `importModules` did. No DTO backs it: there is no bulk endpoint to answer with one. */
export type ImportResult = {
  createdModules: number
  appendedModules: number
  createdCards: number
  skippedCards: number
}

/** `dto/request/PhraseCardRequest` */
export type PhraseCardPayload = {
  text: string
  moduleId: number
  displayOrder: number
  explanations: PhraseExplanationPayload[]
}
