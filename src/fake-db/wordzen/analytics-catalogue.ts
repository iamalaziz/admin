/**
 * The screens and controls the fixture generates traffic for.
 *
 * Every route here exists in the app (`app/src/app/router/AppRoutes.tsx`) and every control
 * names something a user can actually tap, so the tables read like a real report rather
 * than like placeholder rows. `weight` is the only invented number: it is a relative
 * popularity, and `analytics.ts` turns it into views and clicks per day.
 */
import type {
  CountryCode,
  ElementDefinition,
  ElementKind,
  ScreenArea,
  ScreenDefinition
} from '@/types/wordzen/analytics-types'

type ScreenSeed = ScreenDefinition & {
  /** Relative daily traffic. Home is the anchor at 100. */
  weight: number

  /** Mean seconds on screen — a drill sits far longer than a tab bar destination. */
  dwellSeconds: number

  /** Share of sessions that end here, 0..1. */
  exitRate: number
}

type ElementSeed = ElementDefinition & {
  /** Relative daily clicks, on the same scale as `ScreenSeed.weight`. */
  weight: number
}

const screen = (
  key: string,
  path: string,
  name: string,
  area: ScreenArea,
  weight: number,
  dwellSeconds: number,
  exitRate: number
): ScreenSeed => ({ key, path, name, area, weight, dwellSeconds, exitRate })

const element = (screenKey: string, slug: string, name: string, kind: ElementKind, weight: number): ElementSeed => ({
  id: `${screenKey}.${slug}`,
  screenKey,
  name,
  kind,
  weight
})

/* -------------------------------------------------------------------------- *
 * Screens
 * -------------------------------------------------------------------------- */

export const SCREEN_SEEDS: readonly ScreenSeed[] = [
  screen('home', '/home', 'Home', 'CORE', 100, 48, 0.11),
  screen('daily-tasks', '/daily-tasks', 'Daily tasks', 'CORE', 54, 71, 0.07),
  screen('pomodoro', '/pomodoro', 'Pomodoro', 'CORE', 11, 612, 0.19),

  screen('courses', '/courses', 'Courses', 'LEARN', 78, 39, 0.06),
  screen('course-detail', '/courses/:id', 'Course detail', 'LEARN', 64, 56, 0.05),
  screen('unit-detail', '/unit/:unitId', 'Unit detail', 'LEARN', 58, 44, 0.04),
  screen('flashcards', '/unit/:unitId/flashcards', 'Flashcards', 'LEARN', 92, 287, 0.21),
  screen('tests', '/unit/:unitId/test', 'Unit test', 'LEARN', 46, 214, 0.17),
  screen('match', '/unit/:unitId/match', 'Match drill', 'LEARN', 31, 163, 0.13),
  screen('write', '/unit/:unitId/write', 'Writing drill', 'LEARN', 24, 198, 0.15),
  screen('favorites', '/favorites', 'Favorites', 'LEARN', 27, 62, 0.09),

  screen('games', '/games', 'Games', 'GAMES', 38, 34, 0.08),
  screen('daily-challenge', '/games/daily-challenge', 'Daily challenge', 'GAMES', 29, 152, 0.18),
  screen('word-rush', '/games/word-rush', 'Word rush', 'GAMES', 22, 176, 0.22),
  screen('octo-memory', '/games/octo-memory', 'Octo memory', 'GAMES', 17, 141, 0.2),
  screen('pvp', '/pvp/:gameType', 'PvP duel', 'GAMES', 14, 203, 0.24),

  screen('rankings', '/rankings', 'Leaderboard', 'SOCIAL', 41, 57, 0.14),
  screen('friends', '/friends', 'Friends', 'SOCIAL', 33, 46, 0.1),
  screen('achievements', '/achievements', 'Achievements', 'SOCIAL', 23, 68, 0.12),
  screen('friend-detail', '/friends/:id', 'Friend detail', 'SOCIAL', 19, 41, 0.16),
  screen('public-profile', '/users/:uid', 'Public profile', 'SOCIAL', 16, 37, 0.23),

  screen('login', '/login', 'Sign in', 'ACCOUNT', 44, 29, 0.09),
  screen('profile', '/profile', 'Profile', 'ACCOUNT', 36, 52, 0.18),
  screen('statistics', '/statistics', 'Statistics', 'ACCOUNT', 21, 83, 0.21),
  screen('register', '/register', 'Sign up', 'ACCOUNT', 18, 94, 0.27),
  screen('onboarding', '/onboarding', 'Onboarding', 'ACCOUNT', 15, 128, 0.31),
  screen('settings', '/settings', 'Settings', 'ACCOUNT', 13, 64, 0.26),

  screen('subscription', '/subscription', 'Shop', 'COMMERCE', 26, 76, 0.33),
  screen('subscription-history', '/subscription/history', 'Purchase history', 'COMMERCE', 7, 48, 0.29)
]

export const screenByKey = new Map(SCREEN_SEEDS.map(seed => [seed.key, seed]))

/* -------------------------------------------------------------------------- *
 * Controls
 * -------------------------------------------------------------------------- */

export const ELEMENT_SEEDS: readonly ElementSeed[] = [
  element('home', 'continue', 'Continue learning', 'button', 88),
  element('home', 'daily-task', 'Daily task card', 'card', 42),
  element('home', 'quick-games', 'Quick action: Games', 'card', 26),
  element('home', 'streak-freeze', 'Streak freeze', 'button', 12),
  element('home', 'quick-pomodoro', 'Quick action: Pomodoro', 'card', 9),

  element('courses', 'course-card', 'Course card', 'card', 71),
  element('courses', 'search', 'Search courses', 'form', 22),
  element('courses', 'filter-level', 'Filter by level', 'filter', 18),

  element('course-detail', 'start-unit', 'Start unit', 'button', 63),
  element('course-detail', 'favorite', 'Add to favorites', 'icon', 24),
  element('course-detail', 'share', 'Share course', 'icon', 6),

  element('unit-detail', 'flashcards', 'Practice: Flashcards', 'button', 57),
  element('unit-detail', 'test', 'Practice: Test', 'button', 34),
  element('unit-detail', 'match', 'Practice: Match', 'button', 21),
  element('unit-detail', 'write', 'Practice: Write', 'button', 16),

  element('flashcards', 'flip', 'Flip card', 'button', 240),
  element('flashcards', 'know-it', 'I know it', 'button', 131),
  element('flashcards', 'repeat', 'Repeat later', 'button', 86),
  element('flashcards', 'audio', 'Play audio', 'icon', 74),
  element('flashcards', 'favorite-word', 'Favorite word', 'icon', 29),

  element('tests', 'submit-answer', 'Submit answer', 'form', 98),
  element('tests', 'finish', 'Finish test', 'button', 38),
  element('tests', 'skip', 'Skip question', 'button', 23),

  element('daily-tasks', 'claim', 'Claim reward', 'button', 44),

  element('games', 'daily-challenge', 'Open daily challenge', 'card', 27),
  element('games', 'word-rush', 'Open Word rush', 'card', 21),
  element('games', 'octo-memory', 'Open Octo memory', 'card', 15),

  element('rankings', 'tab-weekly', 'Tab: This week', 'tab', 31),
  element('rankings', 'tab-all-time', 'Tab: All time', 'tab', 12),

  element('friends', 'add-friend', 'Add friend', 'button', 27),
  element('friends', 'accept-request', 'Accept request', 'button', 18),
  element('friends', 'invite-link', 'Copy invite link', 'button', 9),

  element('achievements', 'tile', 'Achievement tile', 'card', 20),

  element('profile', 'edit', 'Edit profile', 'button', 14),
  element('profile', 'avatar', 'Change avatar', 'icon', 11),

  element('login', 'submit', 'Sign in form', 'form', 41),
  element('login', 'google', 'Sign in with Google', 'button', 23),
  element('login', 'forgot', 'Forgot password', 'link', 7),

  element('settings', 'dark-mode', 'Dark mode', 'toggle', 16),
  element('settings', 'sign-out', 'Sign out', 'button', 12),
  element('settings', 'language', 'Interface language', 'toggle', 9),
  element('settings', 'notifications', 'Push notifications', 'toggle', 7),

  element('subscription', 'buy-yearly', 'Buy PRO — yearly', 'button', 19),
  element('subscription', 'buy-monthly', 'Buy PRO — monthly', 'button', 14),
  element('subscription', 'compare', 'Tab: Compare plans', 'tab', 11),
  element('subscription', 'restore', 'Restore purchase', 'link', 4)
]

/* -------------------------------------------------------------------------- *
 * Lesson funnel
 *
 * The one journey worth a funnel: opening the app through to a finished drill. Each step
 * names the event that marks it, and `retention` is the share carried over from the step
 * before — the generator applies them in order so the steps can never grow.
 * -------------------------------------------------------------------------- */

export const FUNNEL_SEEDS: readonly { key: string; name: string; retention: number }[] = [
  { key: 'session', name: 'Opened the app', retention: 1 },
  { key: 'course', name: 'Opened a course', retention: 0.72 },
  { key: 'unit', name: 'Opened a unit', retention: 0.81 },
  { key: 'drill', name: 'Started a drill', retention: 0.76 },
  { key: 'complete', name: 'Finished the drill', retention: 0.64 },
  { key: 'repeat', name: 'Started a second drill', retention: 0.37 }
]

/* -------------------------------------------------------------------------- *
 * Shapes
 * -------------------------------------------------------------------------- */

/**
 * Hour-of-day traffic, 24 multipliers from 00:00 local. Two peaks, because that is what a
 * study habit looks like: a commute-sized one in the morning and a much larger evening one.
 */
export const HOUR_FACTORS: readonly number[] = [
  0.14, 0.08, 0.05, 0.04, 0.05, 0.11, 0.28, 0.54, 0.72, 0.61, 0.49, 0.44, 0.47, 0.42, 0.38, 0.41, 0.52, 0.68, 0.88, 1.0,
  0.97, 0.83, 0.56, 0.31
]

/** Weekday traffic, Monday first. Study drops over the weekend and peaks on Monday. */
export const WEEKDAY_FACTORS: readonly number[] = [1.08, 1.05, 1.02, 1.0, 0.94, 0.79, 0.85]

/** Share of sessions per platform. The app is a PWA first, so web leads. */
export const PLATFORM_SHARES: readonly { platform: 'WEB' | 'ANDROID' | 'IOS'; share: number }[] = [
  { platform: 'WEB', share: 0.52 },
  { platform: 'ANDROID', share: 0.31 },
  { platform: 'IOS', share: 0.17 }
]

/**
 * Where the sessions come from.
 *
 * `share` is the country's slice of sessions at the midpoint of the series, and `drift` is
 * how that slice moves across it: +0.3 means the share ends the series 30% above where it
 * started, which is what makes one country's trend pill differ from another's. The shares
 * are renormalised per day, so they stay a split however the drifts pull — a country can
 * only grow its share at the expense of the rest.
 *
 * The list is the app's own geography: Uzbek-first, with the rest of the CIS behind it and
 * a long diaspora tail folded into `OTHER`.
 */
export const COUNTRY_SHARES: readonly { code: CountryCode; share: number; drift: number }[] = [
  { code: 'UZ', share: 0.41, drift: 0.06 },
  { code: 'RU', share: 0.17, drift: -0.14 },
  { code: 'KZ', share: 0.09, drift: 0.22 },
  { code: 'KG', share: 0.055, drift: 0.18 },
  { code: 'TJ', share: 0.04, drift: 0.11 },
  { code: 'TR', share: 0.035, drift: 0.34 },
  { code: 'US', share: 0.03, drift: -0.05 },
  { code: 'DE', share: 0.025, drift: 0.09 },
  { code: 'KR', share: 0.02, drift: 0.41 },
  { code: 'GB', share: 0.015, drift: -0.08 },
  { code: 'AE', share: 0.012, drift: 0.27 },
  { code: 'OTHER', share: 0.098, drift: 0.02 }
]

/** Event mix, as a share of all events. Views and clicks dominate; errors are the tail. */
export const EVENT_MIX_SHARES: readonly { type: string; share: number }[] = [
  { type: 'SCREEN_VIEW', share: 0.38 },
  { type: 'CLICK', share: 0.34 },
  { type: 'SWIPE', share: 0.11 },
  { type: 'SUBMIT', share: 0.09 },
  { type: 'TOGGLE', share: 0.04 },
  { type: 'SEARCH', share: 0.027 },
  { type: 'ERROR', share: 0.013 }
]
