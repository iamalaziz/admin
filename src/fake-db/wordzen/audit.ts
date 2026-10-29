/**
 * Faker-backed audit trail for the content and user tools.
 *
 * The entries point at rows that really exist in the mock store, so the targets are the
 * courses, modules, achievements and users the rest of the panel shows and every link in
 * the drawer opens the page it names. That is the whole reason this reads from the store
 * rather than inventing names: an audit trail whose targets lead nowhere teaches nothing
 * about whether the drawer is useful.
 *
 * Reproducible on both sides of hydration, like the other fixtures: faker is seeded, and
 * the clock is `MOCK_REF_DATE` rather than `Date.now()`.
 */
import { faker } from '@faker-js/faker'

import type { AuditAction, AuditActor, AuditChange, AuditEntry, AuditTarget } from '@/types/wordzen/audit-types'
import { primaryRole } from '@/types/wordzen/user-types'
import type { AdminUser } from '@/types/wordzen/user-types'

import { MOCK_REF_DATE } from './generate'
import { mockStore } from './store'

/** The trail's "now". Relative timestamps in the drawer are measured from here. */
export const AUDIT_REF_DATE = MOCK_REF_DATE

const AUDIT_SEED = 990_099

/** How far back the trail goes, and how many entries fill it. */
const AUDIT_SPAN_DAYS = 12
const AUDIT_ENTRY_COUNT = 140

const DAY_MS = 86_400_000

const AVATAR_COUNT = 20

/* -------------------------------------------------------------------------- *
 * Actors
 * -------------------------------------------------------------------------- */

const actorFrom = (user: AdminUser): AuditActor => ({
  uid: user.uid,
  username: user.username,
  initials: user.username.slice(0, 2).toUpperCase(),

  // `AdminUser` has no avatar — the API does not serve one — so the fixture assigns a
  // stable image per account rather than a random one per entry.
  avatar: `/images/avatars/avatar-${(user.id % AVATAR_COUNT) + 1}.webp`,
  role: primaryRole(user.roles)
})

/**
 * The staff who appear as actors: everyone holding more than ROLE_USER.
 *
 * Authors edit content and admins do everything, which is the split the entries below
 * respect — an author never shows up blocking an account.
 */
const buildActors = (users: AdminUser[]) => {
  const staff = users.filter(user => user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_AUTHOR'))

  const admins = staff.filter(user => user.roles.includes('ROLE_ADMIN')).map(actorFrom)
  const authors = staff.filter(user => !user.roles.includes('ROLE_ADMIN')).map(actorFrom)

  return {
    // Falling back to the first accounts keeps the fixture working if the user generator
    // ever stops handing out staff roles.
    admins: admins.length > 0 ? admins : users.slice(0, 2).map(actorFrom),
    contentAuthors: authors.length > 0 ? authors : users.slice(0, 4).map(actorFrom)
  }
}

/* -------------------------------------------------------------------------- *
 * Targets
 * -------------------------------------------------------------------------- */

const courseTarget = (course: { id: number; title: string; category: { name: string } }): AuditTarget => ({
  type: 'COURSE',
  id: String(course.id),
  name: course.title,
  href: `/manage/courses/${course.id}`,
  context: course.category.name
})

const moduleTarget = (module: { id: number; title: string }, courseTitle: string): AuditTarget => ({
  type: 'MODULE',
  id: String(module.id),
  name: module.title,
  href: `/manage/modules/${module.id}`,
  context: courseTitle
})

/** Cards have no page of their own: they are edited inside their module. */
const cardTarget = (term: string, moduleId: number, moduleTitle: string): AuditTarget => ({
  type: 'CARD',
  id: `${moduleId}-${term}`,
  name: term,
  href: `/manage/modules/${moduleId}`,
  context: moduleTitle
})

const phraseCardTarget = (text: string, moduleId: number, moduleTitle: string): AuditTarget => ({
  type: 'PHRASE_CARD',
  id: `${moduleId}-phrase-${text.slice(0, 12)}`,
  name: text,
  href: `/manage/modules/${moduleId}`,
  context: moduleTitle
})

const userTarget = (user: AdminUser): AuditTarget => ({
  type: 'USER',
  id: user.uid,
  name: user.username,
  href: `/manage/users/${user.uid}`,
  context: user.email
})

const achievementTarget = (achievement: { code: string; title: string; group: { title: string } }): AuditTarget => ({
  type: 'ACHIEVEMENT',
  id: achievement.code,
  name: achievement.title,
  href: `/manage/achievements/${achievement.code}`,
  context: achievement.group.title
})

/* -------------------------------------------------------------------------- *
 * Entries
 * -------------------------------------------------------------------------- */

const change = (field: string, from: string | null, to: string | null): AuditChange => ({ field, from, to })

const bool = (value: boolean) => (value ? 'true' : 'false')

type Draft = {
  action: AuditAction
  target: AuditTarget
  changes: AuditChange[]
  summary?: string | null

  /** Only an admin may do it — a block, a role change, a catalogue delete. */
  adminOnly?: boolean
}

type Sources = {
  courses: ReturnType<typeof mockStore.listCourses>
  users: AdminUser[]
  achievements: ReturnType<typeof mockStore.listAchievements>
  categories: ReturnType<typeof mockStore.listCategories>
}

/** The modules of a randomly picked course, with the course for context. */
const pickModule = (courses: Sources['courses']) => {
  const course = faker.helpers.arrayElement(courses)
  const modules = mockStore.listModules(course.id)

  return { course, module: faker.helpers.arrayElement(modules) }
}

const ACCESS_LADDER = ['FREE', 'BASIC', 'PRO'] as const

const BLOCK_REASONS = [
  'Repeated abuse reports from the leaderboard',
  'Shared account credentials',
  'Payment charged back',
  'Spam in friend requests',
  'Requested by the account owner'
]

const DELETE_NOTES = [
  'Duplicate of an existing row',
  'Replaced by the reworked version',
  'Imported by mistake',
  'Empty after the content review'
]

/**
 * The draft pool, weighted the way a real trail is shaped: a lot of editing, some
 * publishing and reordering, and comparatively few deletes and account actions.
 */
const DRAFT_BUILDERS: readonly { weight: number; build: (sources: Sources) => Draft }[] = [
  {
    weight: 14,
    build: ({ courses }) => {
      const course = faker.helpers.arrayElement(courses)

      return {
        action: 'UPDATE',
        target: courseTarget(course),
        changes: [change('title', `${course.title} (draft)`, course.title)]
      }
    }
  },
  {
    weight: 8,
    build: ({ courses, categories }) => {
      const course = faker.helpers.arrayElement(courses)
      const others = categories.filter(category => category.code !== course.category.code)
      const previous = faker.helpers.arrayElement(others.length > 0 ? others : categories)

      return {
        action: 'UPDATE',
        target: courseTarget(course),
        changes: [change('category', previous.code, course.category.code)]
      }
    }
  },
  {
    weight: 7,
    build: ({ courses }) => {
      const course = faker.helpers.arrayElement(courses)
      const previous = faker.helpers.arrayElement(ACCESS_LADDER.filter(code => code !== course.accessCode))

      return {
        action: 'UPDATE',
        target: courseTarget(course),
        changes: [change('accessCode', previous, course.accessCode)]
      }
    }
  },
  {
    weight: 9,
    build: ({ courses }) => {
      const course = faker.helpers.arrayElement(courses)

      return {
        action: course.isPublic ? 'PUBLISH' : 'UNPUBLISH',
        target: courseTarget(course),
        changes: [change('isPublic', bool(!course.isPublic), bool(course.isPublic))]
      }
    }
  },
  {
    weight: 5,
    build: ({ courses }) => {
      const course = faker.helpers.arrayElement(courses)
      const from = faker.number.int({ min: 1, max: courses.length })

      return {
        action: 'REORDER',
        target: courseTarget(course),
        changes: [change('displayOrder', String(from), String(course.displayOrder))]
      }
    }
  },
  {
    weight: 6,
    build: ({ courses }) => {
      const course = faker.helpers.arrayElement(courses)

      return {
        action: 'CREATE',
        target: courseTarget(course),
        changes: [
          change('title', null, course.title),
          change('category', null, course.category.code),
          change('accessCode', null, course.accessCode)
        ]
      }
    }
  },
  {
    weight: 12,
    build: ({ courses }) => {
      const { course, module } = pickModule(courses)

      return {
        action: 'UPDATE',
        target: moduleTarget(module, course.title),
        changes: [change('title', `Unit ${module.displayOrder}`, module.title)]
      }
    }
  },
  {
    weight: 7,
    build: ({ courses }) => {
      const { course, module } = pickModule(courses)

      return {
        action: module.isPublic ? 'PUBLISH' : 'UNPUBLISH',
        target: moduleTarget(module, course.title),
        changes: [change('isPublic', bool(!module.isPublic), bool(module.isPublic))]
      }
    }
  },
  {
    weight: 6,
    build: ({ courses }) => {
      const { course, module } = pickModule(courses)

      return {
        action: 'CREATE',
        target: moduleTarget(module, course.title),
        changes: [change('title', null, module.title), change('courseId', null, String(course.id))]
      }
    }
  },
  {
    weight: 4,
    build: ({ courses }) => {
      const { course, module } = pickModule(courses)

      return {
        action: 'DELETE',
        target: { ...moduleTarget(module, course.title), href: null },
        changes: [],
        summary: `Removed with ${module.cardCount} cards and ${module.phraseCardCount} phrase cards`,
        adminOnly: true
      }
    }
  },
  {
    weight: 16,
    build: ({ courses }) => {
      const { module } = pickModule(courses)
      const cards = mockStore.listCards(module.id)
      const card = faker.helpers.arrayElement(cards)
      const translation = card.translations[0]

      return {
        action: 'UPDATE',
        target: cardTarget(card.term, module.id, module.title),
        changes: translation
          ? [change(`translations[${translation.locale}]`, `${translation.value} ?`, translation.value)]
          : [change('term', `${card.term} ?`, card.term)]
      }
    }
  },
  {
    weight: 10,
    build: ({ courses }) => {
      const { module } = pickModule(courses)
      const cards = mockStore.listCards(module.id)
      const card = faker.helpers.arrayElement(cards)

      return {
        action: 'CREATE',
        target: cardTarget(card.term, module.id, module.title),
        changes: [
          change('term', null, card.term),
          change('translations', null, `${card.translations.length} locale(s)`),
          change('samples', null, String(card.samples.length))
        ]
      }
    }
  },
  {
    weight: 5,
    build: ({ courses }) => {
      const { module } = pickModule(courses)
      const cards = mockStore.listCards(module.id)
      const card = faker.helpers.arrayElement(cards)

      return {
        action: 'DELETE',
        target: { ...cardTarget(card.term, module.id, module.title), href: null },
        changes: [],
        summary: faker.helpers.arrayElement(DELETE_NOTES)
      }
    }
  },
  {
    weight: 5,
    build: ({ courses }) => {
      const { module } = pickModule(courses)
      const phraseCards = mockStore.listPhraseCards(module.id)
      const phraseCard = faker.helpers.arrayElement(phraseCards)

      return {
        action: 'UPDATE',
        target: phraseCardTarget(phraseCard.text, module.id, module.title),
        changes: [change('explanations', String(phraseCard.explanations.length - 1), String(phraseCard.explanations.length))]
      }
    }
  },
  {
    weight: 3,
    build: ({ categories }) => {
      const category = faker.helpers.arrayElement(categories)

      return {
        action: 'UPDATE',
        target: {
          type: 'CATEGORY',
          id: category.code,
          name: category.name,
          href: '/manage/categories',
          context: category.code
        },
        changes: [change('name', `${category.name} level`, category.name)]
      }
    }
  },
  {
    weight: 7,
    build: ({ achievements }) => {
      const achievement = faker.helpers.arrayElement(achievements)

      return {
        action: 'UPDATE',
        target: achievementTarget(achievement),
        changes: [change('description', `${achievement.description.slice(0, 24)}…`, achievement.description)]
      }
    }
  },
  {
    weight: 4,
    build: ({ achievements }) => {
      const achievement = faker.helpers.arrayElement(achievements)

      return {
        action: 'UPDATE',
        target: achievementTarget(achievement),
        changes: [change('active', bool(!achievement.active), bool(achievement.active))],
        adminOnly: true
      }
    }
  },
  {
    weight: 3,
    build: ({ achievements }) => {
      const achievement = faker.helpers.arrayElement(achievements)

      return {
        action: 'CREATE',
        target: achievementTarget(achievement),
        changes: [
          change('code', null, achievement.code),
          change('groupCode', null, achievement.group.code),
          change('title', null, achievement.title)
        ],
        adminOnly: true
      }
    }
  },
  {
    weight: 6,
    build: ({ users, achievements }) => {
      const user = faker.helpers.arrayElement(users)
      const achievement = faker.helpers.arrayElement(achievements)

      return {
        action: 'GRANT',
        target: userTarget(user),
        changes: [change('achievementCode', null, achievement.code)],
        summary: achievement.title,
        adminOnly: true
      }
    }
  },
  {
    weight: 2,
    build: ({ users, achievements }) => {
      const user = faker.helpers.arrayElement(users)
      const achievement = faker.helpers.arrayElement(achievements)

      return {
        action: 'REVOKE',
        target: userTarget(user),
        changes: [change('achievementCode', achievement.code, null)],
        summary: `${achievement.title} · granted in error`,
        adminOnly: true
      }
    }
  },
  {
    // An account's current state has to be the one the entry left it in, or the trail
    // contradicts the page it links to: blocks are drawn from the accounts that are
    // blocked today, unblocks from the ones that are not.
    weight: 5,
    build: ({ users }) => {
      const blocked = users.filter(user => user.status === 'BLOCKED')
      const user = faker.helpers.arrayElement(blocked.length > 0 ? blocked : users)

      return {
        action: 'BLOCK',
        target: userTarget(user),
        changes: [change('status', 'ACTIVE', 'BLOCKED')],
        summary: user.blockedReason ?? faker.helpers.arrayElement(BLOCK_REASONS),
        adminOnly: true
      }
    }
  },
  {
    weight: 3,
    build: ({ users }) => {
      const user = faker.helpers.arrayElement(users.filter(candidate => candidate.status === 'ACTIVE'))

      return {
        action: 'UNBLOCK',
        target: userTarget(user),
        changes: [change('status', 'BLOCKED', 'ACTIVE')],
        summary: 'Appeal accepted',
        adminOnly: true
      }
    }
  },
  {
    weight: 4,
    build: ({ users }) => {
      // Likewise for roles: the entry grants a role the account actually holds now.
      const elevated = users.filter(candidate => primaryRole(candidate.roles) !== 'ROLE_USER')
      const user = faker.helpers.arrayElement(elevated.length > 0 ? elevated : users)
      const granted = primaryRole(user.roles)

      return {
        action: 'ROLES',
        target: userTarget(user),
        changes: [change('roles', 'ROLE_USER', `ROLE_USER, ${granted}`)],
        adminOnly: true
      }
    }
  }
]

const DRAFT_WEIGHT_TOTAL = DRAFT_BUILDERS.reduce((total, builder) => total + builder.weight, 0)

const pickBuilder = () => {
  let threshold = faker.number.float({ min: 0, max: DRAFT_WEIGHT_TOTAL })

  for (const builder of DRAFT_BUILDERS) {
    threshold -= builder.weight

    if (threshold <= 0) {
      return builder
    }
  }

  return DRAFT_BUILDERS[DRAFT_BUILDERS.length - 1]
}

/**
 * The audit trail, newest first.
 *
 * Entries are spread back over `AUDIT_SPAN_DAYS` with the gaps widening as they go: a few
 * dozen from today and yesterday, thinning out into last week, which is what makes the day
 * groups in the drawer worth having.
 */
export const listAuditEntries = (): AuditEntry[] => {
  faker.seed(AUDIT_SEED)

  const sources: Sources = {
    courses: mockStore.listCourses(),
    users: mockStore.listUsers(),
    achievements: mockStore.listAchievements(),
    categories: mockStore.listCategories()
  }

  const { admins, contentAuthors } = buildActors(sources.users)

  return Array.from({ length: AUDIT_ENTRY_COUNT }, (_, index) => {
    const draft = pickBuilder().build(sources)

    // Squared, so the trail is dense at the top and sparse a week back.
    const progress = (index / AUDIT_ENTRY_COUNT) ** 2

    const at = new Date(
      AUDIT_REF_DATE.getTime() -
        Math.round(progress * AUDIT_SPAN_DAYS * DAY_MS) -
        faker.number.int({ min: 0, max: 20 * 60_000 })
    )

    return {
      id: `audit-${index}`,
      at: at.toISOString(),
      actor: faker.helpers.arrayElement(draft.adminOnly ? admins : [...contentAuthors, ...admins]),
      action: draft.action,
      target: draft.target,
      summary: draft.summary ?? null,
      changes: draft.changes
    }
  }).sort((a, b) => b.at.localeCompare(a.at))
}
