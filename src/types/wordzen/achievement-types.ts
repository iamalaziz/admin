/**
 * Mirrors account-api's achievement model: `model/Achievement`, `model/AchievementGroup`,
 * `model/UserAchievement` and the `dto/response/Achievement*Response` shapes.
 *
 * Unlike the content tools, most of this has no endpoint behind it. What exists today:
 *
 *   GET  /api/v1/achievements                  the active catalogue, without grant state
 *   GET  /api/v1/users/{uid}/achievements       one user's grants
 *   GET  /api/v1/users/{uid}/achievements/all   the catalogue plus this user's grant state
 *   POST /api/v1/users/{uid}/achievements       grant one, by `achievementCode`
 *
 * The catalogue rows are seeded from Java on boot — `service/AchievementCatalog` applied by
 * `AchievementCatalogSeeder` — so editing a row, reordering it, deactivating it, deleting
 * it and revoking a grant have nothing to call. The grant endpoint does exist, but it is
 * guarded by the client-key scheme: it is there for the services that award achievements,
 * not for an admin JWT. See the gaps list in README.md.
 */

import type { UserStatusCode } from './user-types'

export const ACHIEVEMENT_GROUP_CODES = [
  'start',
  'progress',
  'tests',
  'games',
  'streak',
  'pomodoro',
  'rating',
  'levels',
  'unique'
] as const

export type AchievementGroupCode = (typeof ACHIEVEMENT_GROUP_CODES)[number]

/** `dto/response/AchievementGroupResponse` (table `achievement_groups`). */
export type AchievementGroup = {
  id: number
  code: AchievementGroupCode
  title: string
  displayOrder: number
}

/**
 * The `achievement_groups` rows `AchievementCatalog.GROUPS` seeds.
 *
 * The titles are Russian because the catalogue ships one language — the group and
 * achievement text is stored, not translated, so the tools show it as the API serves it.
 */
export const SEED_ACHIEVEMENT_GROUPS: readonly AchievementGroup[] = [
  { id: 1, code: 'start', title: 'Стартовые', displayOrder: 1 },
  { id: 2, code: 'progress', title: 'Прогресс', displayOrder: 2 },
  { id: 3, code: 'tests', title: 'Тесты', displayOrder: 3 },
  { id: 4, code: 'games', title: 'Игры', displayOrder: 4 },
  { id: 5, code: 'streak', title: 'Streak', displayOrder: 5 },
  { id: 6, code: 'pomodoro', title: 'Помодоро', displayOrder: 6 },
  { id: 7, code: 'rating', title: 'Рейтинг', displayOrder: 7 },
  { id: 8, code: 'levels', title: 'Уровни', displayOrder: 8 },
  { id: 9, code: 'unique', title: 'Уникальные', displayOrder: 9 }
]

export const achievementGroupByCode = (code: AchievementGroupCode): AchievementGroup =>
  SEED_ACHIEVEMENT_GROUPS.find(group => group.code === code) ?? SEED_ACHIEVEMENT_GROUPS[0]

/**
 * `dto/response/AchievementResponse` minus its per-user fields, plus two extras:
 * `active` from `model/Achievement` (the DTO omits it because the endpoints filter on it)
 * and `receivedCount`, which is on no DTO at all — it is the number of `user_achievements`
 * rows, the way `Module.cardCount` stands in for a count the API does not send.
 *
 * `code` is a free-form unique column. `model/AchievementCode` enumerates the seeded ones
 * and the services award by those constants, so a code invented here has nothing granting
 * it until the enum catches up.
 */
export type Achievement = {
  id: number
  code: string
  group: AchievementGroup
  title: string
  description: string
  displayOrder: number
  active: boolean
  receivedCount: number
}

/**
 * No `dto/request/*` backs this one — the catalogue is seeded from `AchievementCatalog`.
 * The fields are the writable columns of `model/Achievement`; `displayOrder` is left to
 * the reorder call, as it is for courses.
 *
 * `code` is only read when creating: it is the key grants are made against, so an edit
 * cannot change it.
 */
export type AchievementPayload = {
  code: string
  groupCode: AchievementGroupCode
  title: string
  description: string
  active: boolean
}

/** `model/UserAchievement` — one `user_achievements` row. */
export type AchievementGrant = {
  uid: string
  achievementCode: string
  receivedAt: string
}

/**
 * `dto/response/AchievementResponse` as `/users/{uid}/achievements/all` returns it: the
 * catalogue row with this user's grant state folded in.
 */
export type UserAchievement = Achievement & {
  received: boolean
  receivedAt: string | null
}

/** `dto/request/GrantAchievementRequest` */
export type GrantAchievementPayload = {
  achievementCode: string
}

/** One holder of an achievement: a `user_achievements` row joined with its `auth_user`. */
export type AchievementRecipient = {
  uid: string
  username: string
  email: string
  status: UserStatusCode
  receivedAt: string
}
