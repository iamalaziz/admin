/**
 * Faker-backed fixtures for the content and user tools.
 *
 * Every generator seeds faker before it runs, for two reasons:
 *   - the same seed always yields the same rows, so reloading does not reshuffle the tables;
 *   - these pages render on the server and hydrate on the client, and both passes must
 *     produce identical data or React reports a hydration mismatch.
 *
 * Cards are generated per module on demand rather than up front: 54 courses x ~22 modules
 * x ~33 cards is roughly 39k cards, which is slow and pointless to build when the UI only
 * ever shows one module's worth at a time.
 */
import { faker, fakerRU, fakerUZ_UZ_latin as fakerUZ } from '@faker-js/faker'

import type {
  Card,
  Course,
  CourseCategory,
  CourseCategoryCode,
  CourseDescription,
  LocaleCode,
  Module,
  PhraseCard,
  PhraseExplanation,
  Sample,
  Translation
} from '@/types/wordzen/content-types'
import {
  COURSE_ACCESS_CODES,
  COURSE_CATEGORY_CODES,
  categoryByCode,
  LOCALE_CODES,
  SEED_COURSE_CATEGORIES
} from '@/types/wordzen/content-types'
import type { Achievement, AchievementGrant, AchievementGroupCode } from '@/types/wordzen/achievement-types'
import { achievementGroupByCode } from '@/types/wordzen/achievement-types'
import type { AdminUser, RoleCode, SubscriptionCode } from '@/types/wordzen/user-types'

/** Fixed clock. Dates are relative to this, never to `Date.now()`, to stay reproducible. */
export const MOCK_REF_DATE = new Date('2026-10-01T09:00:00.000Z')

export const COURSE_COUNT = 54
export const USER_COUNT = 220

const MODULES_PER_COURSE = { min: 20, max: 24 }
const CARDS_PER_MODULE = { min: 30, max: 36 }
const PHRASE_CARDS_PER_MODULE = { min: 4, max: 8 }
const AUTHOR_COUNT = 6

/* -------------------------------------------------------------------------- *
 * Seeds and id spaces
 *
 * Ids follow a formula instead of a running counter so that a lazily generated
 * module keeps the same card ids however the user navigated to it.
 * -------------------------------------------------------------------------- */

const COURSE_SEED = 110_011
const USER_SEED = 220_022
const moduleSeed = (courseId: number) => 330_000 + courseId
const cardSeed = (moduleId: number) => 440_000 + moduleId
const phraseCardSeed = (moduleId: number) => 550_000 + moduleId
const grantSeed = (userId: number) => 660_000 + userId

/** Module ids are `courseId * 100 + index`; a course never holds 100 modules. */
const buildModuleId = (courseId: number, index: number) => courseId * 100 + index
const buildCardId = (moduleId: number, index: number) => moduleId * 1000 + index
const buildPhraseCardId = (moduleId: number, index: number) => 10_000_000 + moduleId * 100 + index

/** Ids for rows the user creates, kept clear of every generated range. */
let nextCreatedId = 90_000_000

export const allocateId = () => ++nextCreatedId

/** Seeds every locale instance together, so one generator's output never depends on another's. */
const seedAll = (seed: number) => {
  faker.seed(seed)
  fakerRU.seed(seed)
  fakerUZ.seed(seed)
}

const iso = (date: Date) => date.toISOString()

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

/* -------------------------------------------------------------------------- *
 * Localized words
 *
 * faker's `ru` locale has a real word list; `uz_UZ_latin` does not - its `lorem`
 * dictionary is Latin placeholder text, while `commerce` and `color` are genuinely
 * Uzbek. So Uzbek strings are drawn from those instead of from lorem.
 * -------------------------------------------------------------------------- */

const localizedWord = (locale: LocaleCode): string => {
  switch (locale) {
    case 'RU':
      return fakerRU.lorem.word()
    case 'UZ':
      return fakerUZ.commerce.department().toLowerCase()
    default:
      return faker.word.noun()
  }
}

/**
 * Sentence frames so a sample actually demonstrates its card's term. faker picks the
 * frame; the `{term}` slot keeps the example on topic.
 */
const SAMPLE_FRAMES: Record<LocaleCode, readonly string[]> = {
  EN: [
    'We talked about {term} during the lesson.',
    'Her {term} surprised everyone on the team.',
    'This is a good example of {term}.',
    'Nobody explained the {term} to us.',
    'The {term} became clear only later.'
  ],
  RU: [
    'Мы говорили про {term} на уроке.',
    'Это хороший пример {term}.',
    'Никто не объяснил нам {term}.',
    'Слово {term} стало понятно только позже.'
  ],
  UZ: [
    'Darsda {term} haqida gaplashdik.',
    'Bu {term} uchun yaxshi misol.',
    'Bizga {term} ni hech kim tushuntirmadi.',
    '{term} faqat keyinroq tushunarli boldi.'
  ]
}

const sampleSentence = (locale: LocaleCode, term: string) =>
  faker.helpers.arrayElement(SAMPLE_FRAMES[locale]).replace('{term}', term)

/* -------------------------------------------------------------------------- *
 * Authors
 * -------------------------------------------------------------------------- */

export type AuthorRef = {
  uid: string
  username: string
}

/** The pool a course's author is drawn from. Seeded off the course seed so it is stable. */
export const generateAuthors = (): AuthorRef[] => {
  seedAll(COURSE_SEED - 1)

  const authors: AuthorRef[] = [{ uid: '11111111-1111-4111-8111-111111111111', username: 'author' }]

  for (let i = 1; i < AUTHOR_COUNT; i++) {
    authors.push({ uid: faker.string.uuid(), username: faker.internet.username().toLowerCase() })
  }

  return authors
}

/* -------------------------------------------------------------------------- *
 * Categories
 * -------------------------------------------------------------------------- */

/**
 * `course_category` as the SQL seed holds it, copied so the store can edit the rows.
 *
 * Not faker-generated: the codes are a Java enum and the names are fixed, so the fixture
 * is the seed itself.
 */
export const generateCategories = (): CourseCategory[] => SEED_COURSE_CATEGORIES.map(category => ({ ...category }))

/* -------------------------------------------------------------------------- *
 * Courses
 * -------------------------------------------------------------------------- */

const courseTitle = () => capitalize(`${faker.word.adjective()} ${faker.word.noun()} ${faker.word.noun()}`)

const generateDescriptions = (courseId: number): CourseDescription[] => {
  const locales = faker.helpers.arrayElements(LOCALE_CODES, faker.number.int({ min: 1, max: 3 }))

  return locales.map((locale, index) => ({
    id: courseId * 10 + index + 1,
    locale,
    value:
      locale === 'RU'
        ? fakerRU.lorem.sentences({ min: 1, max: 2 })
        : locale === 'UZ'
          ? `${fakerUZ.commerce.productDescription()} ${fakerUZ.commerce.department()}.`
          : faker.lorem.sentences({ min: 1, max: 2 })
  }))
}

export const generateCourses = (authors: AuthorRef[]): Course[] => {
  seedAll(COURSE_SEED)

  return Array.from({ length: COURSE_COUNT }, (_, index) => {
    const id = index + 1
    const author = faker.helpers.arrayElement(authors)
    const category: CourseCategoryCode = faker.helpers.arrayElement(COURSE_CATEGORY_CODES)
    const isPublic = faker.datatype.boolean({ probability: 0.72 })

    return {
      id,
      createdAt: iso(faker.date.past({ years: 2, refDate: MOCK_REF_DATE })),
      title: courseTitle(),
      category: categoryByCode(category),
      isPublic,

      // Matches the API: `cover` is a path produced by the manager file service, not a URL.
      cover: faker.datatype.boolean({ probability: 0.65 }) ? `/courses/${faker.string.uuid()}.webp` : null,
      displayOrder: id,
      accessCode: faker.helpers.arrayElement(COURSE_ACCESS_CODES),
      authorUid: author.uid,
      authorUsername: author.username,
      descriptions: generateDescriptions(id),
      moduleCount: faker.number.int(MODULES_PER_COURSE)
    } satisfies Course
  })
}

/* -------------------------------------------------------------------------- *
 * Modules
 * -------------------------------------------------------------------------- */

export const generateModules = (course: Course): Module[] => {
  seedAll(moduleSeed(course.id))

  return Array.from({ length: course.moduleCount }, (_, index) => {
    const order = index + 1

    return {
      id: buildModuleId(course.id, order),
      createdAt: iso(faker.date.between({ from: course.createdAt, to: MOCK_REF_DATE })),
      title: capitalize(`${faker.word.adjective()} ${faker.word.noun()}`),

      // An unpublished course keeps its modules unpublished too.
      isPublic: course.isPublic && faker.datatype.boolean({ probability: 0.85 }),
      displayOrder: order,
      courseId: course.id,
      cardCount: faker.number.int(CARDS_PER_MODULE),
      phraseCardCount: faker.number.int(PHRASE_CARDS_PER_MODULE)
    } satisfies Module
  })
}

/* -------------------------------------------------------------------------- *
 * Cards and phrase cards
 * -------------------------------------------------------------------------- */

const generateTranslations = (cardId: number, term: string): Translation[] => {
  const locales = faker.helpers.arrayElements(LOCALE_CODES, faker.number.int({ min: 1, max: 3 }))

  // A card always carries at least one non-English gloss; an English-only card teaches nothing.
  const withGloss: LocaleCode[] = locales.includes('RU') || locales.includes('UZ') ? [...locales] : [...locales, 'RU']

  return withGloss.map((locale, index) => ({
    id: cardId * 10 + index + 1,
    locale,
    value: locale === 'EN' ? `${term} (synonym: ${faker.word.noun()})` : localizedWord(locale)
  }))
}

const generateSamples = (cardId: number, term: string): Sample[] =>
  Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, (_, index) => {
    const locale = faker.helpers.arrayElement(LOCALE_CODES)

    return {
      id: cardId * 10 + 5 + index,
      locale,
      value: sampleSentence('EN', term),
      translation: sampleSentence(locale, locale === 'EN' ? term : localizedWord(locale))
    } satisfies Sample
  })

export const generateCards = (module: Module): Card[] => {
  seedAll(cardSeed(module.id))

  return Array.from({ length: module.cardCount }, (_, index) => {
    const order = index + 1
    const id = buildCardId(module.id, order)
    const term = faker.word.noun()

    return {
      id,
      createdAt: iso(faker.date.between({ from: module.createdAt, to: MOCK_REF_DATE })),
      term,
      image: faker.datatype.boolean({ probability: 0.4 }) ? `/cards/${faker.string.uuid()}.webp` : null,
      displayOrder: order,
      moduleId: module.id,
      translations: generateTranslations(id, term),
      samples: generateSamples(id, term)
    } satisfies Card
  })
}

const generateExplanations = (phraseCardId: number): PhraseExplanation[] => {
  const locales = faker.helpers.arrayElements(LOCALE_CODES, faker.number.int({ min: 1, max: 2 }))

  return locales.map((locale, index) => ({
    id: phraseCardId * 10 + index + 1,
    locale,
    text:
      locale === 'RU'
        ? fakerRU.lorem.sentence({ min: 6, max: 12 })
        : locale === 'UZ'
          ? fakerUZ.commerce.productDescription()
          : faker.lorem.sentence({ min: 6, max: 12 })
  }))
}

export const generatePhraseCards = (module: Module): PhraseCard[] => {
  seedAll(phraseCardSeed(module.id))

  return Array.from({ length: module.phraseCardCount }, (_, index) => {
    const order = index + 1
    const id = buildPhraseCardId(module.id, order)

    return {
      id,
      createdAt: iso(faker.date.between({ from: module.createdAt, to: MOCK_REF_DATE })),
      text: faker.word.words({ count: { min: 2, max: 4 } }),
      displayOrder: order,
      moduleId: module.id,
      explanations: generateExplanations(id)
    } satisfies PhraseCard
  })
}

/* -------------------------------------------------------------------------- *
 * Users
 * -------------------------------------------------------------------------- */

const generateRoles = (): RoleCode[] => {
  const roll = faker.number.int({ min: 1, max: 100 })

  if (roll <= 3) {
    return ['ROLE_USER', 'ROLE_ADMIN']
  }

  if (roll <= 14) {
    return ['ROLE_USER', 'ROLE_AUTHOR']
  }

  return ['ROLE_USER']
}

const BLOCK_REASONS = [
  'Spam in friend requests',
  'Payment chargeback',
  'Abusive messages',
  'Shared account credentials',
  'Automated farming of coins'
] as const

export const generateUsers = (authors: AuthorRef[]): AdminUser[] => {
  seedAll(USER_SEED)

  // The accounts seeded by docker/postgres/seed-learning.sql come first, so the users the
  // rest of the stack documents are present and findable here too.
  const seeded: { username: string; uid: string; roles: RoleCode[] }[] = [
    { username: 'admin', uid: '77777777-7777-4777-8777-777777777777', roles: ['ROLE_USER', 'ROLE_ADMIN'] },
    { username: 'author', uid: authors[0].uid, roles: ['ROLE_USER', 'ROLE_AUTHOR'] },
    { username: 'dev', uid: '33333333-3333-4333-8333-333333333333', roles: ['ROLE_USER'] },
    { username: 'anna', uid: '22222222-2222-4222-8222-222222222222', roles: ['ROLE_USER'] },
    { username: 'bek', uid: '44444444-4444-4444-8444-444444444444', roles: ['ROLE_USER'] },
    { username: 'chris', uid: '55555555-5555-4555-8555-555555555555', roles: ['ROLE_USER'] },
    { username: 'dana', uid: '66666666-6666-4666-8666-666666666666', roles: ['ROLE_USER'] }
  ]

  const buildUser = (
    id: number,
    username: string,
    uid: string,
    roles: RoleCode[],
    blockedChance: number
  ): AdminUser => {
    const createdAt = faker.date.past({ years: 2, refDate: MOCK_REF_DATE })
    const updatedAt = faker.date.between({ from: createdAt, to: MOCK_REF_DATE })
    const isBlocked = faker.datatype.boolean({ probability: blockedChance })
    const hasSubscription = faker.datatype.boolean({ probability: 0.45 })
    const subscriptionCode: SubscriptionCode = faker.helpers.arrayElement(['BASIC', 'PRO'])

    return {
      id,
      uid,
      username,
      email: `${username}@local.test`,
      roles,
      status: isBlocked ? 'BLOCKED' : 'ACTIVE',

      // The API bumps `authVersion` on every block/unblock; that is how it revokes tokens.
      authVersion: faker.number.int({ min: 0, max: 4 }),
      createdAt: iso(createdAt),
      updatedAt: iso(updatedAt),
      lastReset: faker.datatype.boolean({ probability: 0.25 })
        ? iso(faker.date.between({ from: createdAt, to: MOCK_REF_DATE }))
        : null,
      blockedAt: isBlocked ? iso(faker.date.between({ from: updatedAt, to: MOCK_REF_DATE })) : null,
      blockedReason: isBlocked ? faker.helpers.arrayElement(BLOCK_REASONS) : null,
      blockedBy: isBlocked ? seeded[0].uid : null,
      subscription: hasSubscription
        ? {
            code: subscriptionCode,
            endSubscriptionDate: iso(faker.date.future({ years: 1, refDate: MOCK_REF_DATE })),
            updatedAt: iso(updatedAt)
          }
        : null
    }
  }

  const users = seeded.map((entry, index) => buildUser(index + 1, entry.username, entry.uid, entry.roles, 0))

  for (let id = seeded.length + 1; id <= USER_COUNT; id++) {
    const username = `${faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')}${id}`

    users.push(buildUser(id, username, faker.string.uuid(), generateRoles(), 0.08))
  }

  return users
}

/* -------------------------------------------------------------------------- *
 * Achievements
 * -------------------------------------------------------------------------- */

/**
 * `AchievementCatalog.ACHIEVEMENTS`, copied: code, group, title, description and the
 * `active` flag, in catalogue order. Not faker-generated — this is the list the Java
 * seeder writes on boot, so a fixture that invented its own rows would be describing an
 * app that does not exist.
 */
const SEED_ACHIEVEMENTS: readonly {
  code: string
  group: AchievementGroupCode
  title: string
  description: string
  active: boolean
}[] = [
  { code: 'first_step', group: 'start', title: 'Первый шаг', description: 'Завершить первый юнит', active: true },
  {
    code: 'first_course',
    group: 'start',
    title: 'Первый курс',
    description: 'Открыть первый юнит любого курса',
    active: true
  },
  { code: 'first_test', group: 'start', title: 'Первый тест', description: 'Пройти любой тест до конца', active: true },
  { code: 'first_game', group: 'start', title: 'Первая игра', description: 'Завершить любую игру', active: false },
  {
    code: 'first_pomodoro',
    group: 'start',
    title: 'Первое помодоро',
    description: 'Завершить первую помодоро-сессию',
    active: true
  },
  { code: 'ten_units', group: 'progress', title: 'Десять юнитов', description: '10 юнитов суммарно', active: true },
  {
    code: 'fifty_units',
    group: 'progress',
    title: 'Пятьдесят юнитов',
    description: '50 юнитов суммарно',
    active: true
  },
  { code: 'hundred_units', group: 'progress', title: 'Сто юнитов', description: '100 юнитов суммарно', active: true },
  {
    code: 'first_completed_course',
    group: 'progress',
    title: 'Первый завершённый курс',
    description: 'Полностью пройти любой курс',
    active: true
  },
  { code: 'five_courses', group: 'progress', title: 'Пять курсов', description: '5 курсов полностью', active: true },
  { code: 'perfect_test', group: 'tests', title: 'Отличник', description: 'Тест 100%', active: true },
  {
    code: 'five_tests_over_80',
    group: 'tests',
    title: 'Стабильный результат',
    description: '5 тестов подряд > 80%',
    active: true
  },
  { code: 'five_tests_over_90', group: 'tests', title: 'Снайпер', description: '5 тестов подряд > 90%', active: true },
  { code: 'twenty_tests', group: 'tests', title: 'Двадцать тестов', description: '20 тестов суммарно', active: true },
  { code: 'hundred_tests', group: 'tests', title: 'Сто тестов', description: '100 тестов суммарно', active: true },
  { code: 'five_games', group: 'games', title: 'Игровой старт', description: '5 игр суммарно', active: false },
  {
    code: 'twenty_five_games',
    group: 'games',
    title: 'Постоянный игрок',
    description: '25 игр суммарно',
    active: false
  },
  {
    code: 'record_holder',
    group: 'games',
    title: 'Рекордсмен',
    description: 'Побить рекорд 3 раза подряд',
    active: false
  },
  {
    code: 'all_game_modes',
    group: 'games',
    title: 'Все режимы',
    description: 'Сыграть в каждый тип игры',
    active: false
  },
  {
    code: 'first_daily_task',
    group: 'streak',
    title: 'Первое задание',
    description: 'Первое ежедневное задание',
    active: true
  },
  { code: 'streak_7', group: 'streak', title: 'Неделя подряд', description: 'Streak 7 дней', active: true },
  { code: 'streak_30', group: 'streak', title: 'Месяц подряд', description: 'Streak 30 дней', active: true },
  { code: 'streak_60', group: 'streak', title: 'Два месяца подряд', description: 'Streak 60 дней', active: true },
  { code: 'ten_pomodoro', group: 'pomodoro', title: 'Помодоро-практик', description: '10 сессий', active: true },
  { code: 'fifty_pomodoro', group: 'pomodoro', title: 'Помодоро-фанат', description: '50 сессий', active: true },
  {
    code: 'three_pomodoro_day',
    group: 'pomodoro',
    title: 'Помодоро-марафон',
    description: '3 сессии за один день',
    active: true
  },
  { code: 'top_100', group: 'rating', title: 'В рейтинге', description: 'Топ-100', active: false },
  { code: 'top_50', group: 'rating', title: 'Топ-50', description: 'Топ-50', active: false },
  { code: 'top_10', group: 'rating', title: 'Топ-10', description: 'Топ-10', active: false },
  {
    code: 'first_place',
    group: 'rating',
    title: 'Первое место',
    description: '1-е место хотя бы на день',
    active: false
  },
  { code: 'level_5', group: 'levels', title: 'Пятый уровень', description: 'Уровень 5', active: true },
  { code: 'level_15', group: 'levels', title: 'Пятнадцатый уровень', description: 'Уровень 15', active: true },
  { code: 'wordzen_master', group: 'levels', title: 'WordZen Master', description: 'Уровень 32', active: true },
  {
    code: 'thousand_xp_day',
    group: 'unique',
    title: 'Тысяча за день',
    description: '1 000 XP за один день',
    active: true
  },
  {
    code: 'three_units_ten_days',
    group: 'unique',
    title: '3 юнита x 10 дней',
    description: '3+ юнита в день - 10 раз',
    active: true
  },
  {
    code: 'perfect_week',
    group: 'unique',
    title: 'Идеальная неделя',
    description: '7 дней: юнит+тест+задание каждый день',
    active: true
  },
  { code: 'ascent', group: 'unique', title: 'Восхождение', description: 'Один тест 5 раз с улучшением', active: true },
  { code: 'sprinter', group: 'unique', title: 'Спринтер', description: '10 000 XP за 30 дней', active: true },
  { code: 'no_mistakes', group: 'unique', title: 'Без ошибок', description: '10 тестов подряд 100%', active: true },
  {
    code: 'two_hundred_pomodoro',
    group: 'unique',
    title: 'Двести помодоро',
    description: '200 помодоро-сессий',
    active: true
  },
  {
    code: 'full_collection_v1',
    group: 'unique',
    title: 'Полная коллекция v1',
    description: 'Получить все достижения первой версии',
    active: false
  },
  { code: 'wordzen_legend', group: 'unique', title: 'WordZen Legend', description: '50 000 XP суммарно', active: true },
  { code: 'continuous_flow', group: 'unique', title: 'Непрерывный поток', description: '100 дней подряд', active: true }
]

/** `displayOrder` is the position in the catalogue, the way the seeder assigns it. */
export const generateAchievements = (): Achievement[] =>
  SEED_ACHIEVEMENTS.map((row, index) => ({
    id: index + 1,
    code: row.code,
    group: achievementGroupByCode(row.group),
    title: row.title,
    description: row.description,
    displayOrder: index + 1,
    active: row.active,

    // Filled in by the store once the grants below are built.
    receivedCount: 0
  }))

/**
 * `user_achievements`, one set per user.
 *
 * The probability decays along the catalogue, so the result looks like a real player base:
 * nearly everyone has "Первый шаг" and a handful have "Непрерывный поток". Only active
 * rows are granted, because `AchievementService.grant` refuses an inactive code.
 */
export const generateGrants = (users: AdminUser[], achievements: Achievement[]): Map<string, AchievementGrant[]> => {
  const grantable = achievements.filter(achievement => achievement.active)

  return new Map(
    users.map(user => {
      seedAll(grantSeed(user.id))

      const earned = grantable.filter((_, index) =>
        faker.datatype.boolean({ probability: Math.max(0.04, 0.92 - index * 0.02) })
      )

      // The dates are drawn first and then sorted, so a learner earns the catalogue in
      // order instead of unlocking "Сто юнитов" the day before "Десять юнитов".
      const dates = earned
        .map(() => faker.date.between({ from: user.createdAt, to: MOCK_REF_DATE }))
        .sort((a, b) => a.getTime() - b.getTime())

      const grants = earned.map((achievement, index) => ({
        uid: user.uid,
        achievementCode: achievement.code,
        receivedAt: iso(dates[index])
      }))

      return [user.uid, grants] as const
    })
  )
}
