/**
 * Product analytics over the WordZen app's own users — the feature behind the dashboards.
 *
 * There is no endpoint for any of this yet. The three services each own a slice of the
 * truth (learning-api holds lessons and cards, account-api holds users and achievements,
 * payment-api holds the shop) and none of them records a screen view or a tap, so a real
 * implementation needs an event-ingest path first. The shapes below are written as the
 * aggregates such a service would hand back, one per widget, so that swapping the fixture
 * for HTTP is a change of data source and nothing else:
 *
 *   getSummary(range)        GET /analytics/summary?range=
 *   getScreenStats(range)    GET /analytics/screens?range=
 *   getElementStats(range)   GET /analytics/elements?range=
 *   getTimeline(range)       GET /analytics/timeline?range=
 *   getEventMix(range)       GET /analytics/event-mix?range=
 *   getHourMatrix(range)     GET /analytics/interactions/by-hour?range=
 *   getFunnel(range)         GET /analytics/funnels/lesson?range=
 *   getPlatformSplit(range)  GET /analytics/platforms?range=
 *   getCountrySplit(range)   GET /analytics/countries?range=
 *   listActivity(filter)     GET /analytics/activity?filter=&cursor=
 *
 * The screen keys and paths are the app's real routes (`app/src/app/router/AppRoutes.tsx`)
 * and the element ids name real controls, so the catalogue stays meaningful once events
 * start arriving: an aggregate keyed on anything else would not join to anything.
 */

/* -------------------------------------------------------------------------- *
 * Range
 * -------------------------------------------------------------------------- */

export const ANALYTICS_RANGES = ['24h', '7d', '30d', '90d'] as const

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

/** How many days of the daily series each range covers. */
export const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90
}

/* -------------------------------------------------------------------------- *
 * Events
 * -------------------------------------------------------------------------- */

/**
 * The event taxonomy. `SCREEN_VIEW` is the only passive one; everything else is an action
 * the user took, which is what "interactions" counts throughout the dashboards.
 */
export const EVENT_TYPES = ['SCREEN_VIEW', 'CLICK', 'SUBMIT', 'SEARCH', 'TOGGLE', 'SWIPE', 'ERROR'] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const INTERACTION_EVENT_TYPES: readonly EventType[] = ['CLICK', 'SUBMIT', 'SEARCH', 'TOGGLE', 'SWIPE']

/** What the user actually touched. Drives the icon and the badge in the element tables. */
export const ELEMENT_KINDS = ['button', 'card', 'tab', 'icon', 'link', 'toggle', 'form', 'filter'] as const

export type ElementKind = (typeof ELEMENT_KINDS)[number]

/** Groups the app's routes into the journeys worth reading separately. */
export const SCREEN_AREAS = ['CORE', 'LEARN', 'GAMES', 'SOCIAL', 'ACCOUNT', 'COMMERCE'] as const

export type ScreenArea = (typeof SCREEN_AREAS)[number]

export const PLATFORMS = ['WEB', 'ANDROID', 'IOS'] as const

export type Platform = (typeof PLATFORMS)[number]

/**
 * The countries reported separately, ISO-3166 alpha-2. `OTHER` is the residual: everything
 * outside the list, and everything the event's IP could not be resolved to. It is always
 * drawn last rather than in rank order, because it is a leftover and not a place.
 */
export const COUNTRIES = ['UZ', 'RU', 'KZ', 'KG', 'TJ', 'TR', 'US', 'DE', 'KR', 'GB', 'AE', 'OTHER'] as const

export type CountryCode = (typeof COUNTRIES)[number]

/* -------------------------------------------------------------------------- *
 * Catalogue
 * -------------------------------------------------------------------------- */

/** A route the app can show, as the event stream would identify it. */
export type ScreenDefinition = {
  key: string
  path: string
  name: string
  area: ScreenArea
}

/** A control on a screen. `id` is `<screenKey>.<slug>`, which is how events name it. */
export type ElementDefinition = {
  id: string
  name: string
  screenKey: string
  kind: ElementKind
}

/* -------------------------------------------------------------------------- *
 * Aggregates
 * -------------------------------------------------------------------------- */

/** A metric with the previous equal-length window alongside it, for the trend pills. */
export type MetricDelta = {
  value: number
  previous: number

  /** Percent change against `previous`; 0 when the previous window was empty. */
  changePct: number
}

export type AnalyticsSummary = {
  screenViews: MetricDelta
  interactions: MetricDelta
  activeUsers: MetricDelta
  sessions: MetricDelta

  /** Mean session length in seconds. */
  avgSessionSeconds: MetricDelta

  /** Interactions per session — the engagement number the other four do not show. */
  interactionsPerSession: MetricDelta

  /** Share of events of type `ERROR`, 0..1. */
  errorRate: MetricDelta
}

export type ScreenStat = ScreenDefinition & {
  views: number
  uniqueUsers: number

  /** Mean seconds on screen. */
  avgSeconds: number

  /** Share of sessions whose last screen this was, 0..1. */
  exitRate: number

  changePct: number

  /** One point per bucket of the active range, oldest first, for the sparklines. */
  trend: number[]
}

export type ElementStat = ElementDefinition & {

  /** The screen's display name, so a flat element table needs no second lookup. */
  screenName: string

  clicks: number
  uniqueUsers: number

  /** Clicks divided by the host screen's views — above 1 where users tap repeatedly. */
  clickRate: number

  changePct: number
  trend: number[]
}

/** One bucket of the headline chart: a day, or an hour when the range is `24h`. */
export type TimelinePoint = {

  /** ISO timestamp at the start of the bucket. */
  at: string

  /** Pre-formatted axis label, so the chart never formats a date during render. */
  label: string

  views: number
  interactions: number
  sessions: number
}

export type EventMixSlice = {
  type: EventType
  count: number

  /** Share of all events in the range, 0..1. */
  share: number
}

/** A cell of the weekday x hour interaction matrix. `weekday` is 0 = Monday. */
export type HourCell = {
  weekday: number
  hour: number
  interactions: number
}

export type FunnelStep = {
  key: string
  name: string
  users: number

  /** Share of the first step's users still present, 0..1. */
  share: number

  /** Share lost from the step before, 0..1; 0 on the first step. */
  dropOff: number
}

export type PlatformSplit = {
  platform: Platform
  sessions: number
  share: number
}

export type CountrySplit = {
  code: CountryCode

  /** Distinct users in the range, the country's slice of `AnalyticsSummary.activeUsers`. */
  users: number

  sessions: number

  /** Share of the range's sessions, 0..1 — and, since users are derived from it, of users. */
  share: number

  /** Percent change in sessions against the previous equal-length window. */
  changePct: number
}
