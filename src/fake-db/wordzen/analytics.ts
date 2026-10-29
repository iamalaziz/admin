/**
 * Faker-backed product analytics, derived from one daily series per screen and per control.
 *
 * Everything the dashboards read comes out of those two series, which is the point: the
 * summary, the timeline, the rankings, the funnel and the heatmap all agree because they
 * are projections of the same numbers rather than four independent piles of random data.
 * Change a weight in `analytics-catalogue.ts` and every widget moves together.
 *
 * The series is 180 days long so that a 90-day range still has a 90-day window behind it
 * to compare against — every metric carries its previous window, which is what the trend
 * pills show.
 *
 * As with the content fixtures, the clock is `MOCK_REF_DATE` rather than `Date.now()` and
 * faker is seeded before each pass: these pages render on the server and hydrate on the
 * client, and the two have to produce byte-identical numbers.
 */
import { faker } from '@faker-js/faker'

import type {
  AnalyticsRange,
  AnalyticsSummary,
  ElementStat,
  EventMixSlice,
  EventType,
  FunnelStep,
  HourCell,
  MetricDelta,
  Platform,
  PlatformSplit,
  ScreenArea,
  ScreenStat,
  TimelinePoint
} from '@/types/wordzen/analytics-types'
import { RANGE_DAYS } from '@/types/wordzen/analytics-types'

import {
  ELEMENT_SEEDS,
  EVENT_MIX_SHARES,
  FUNNEL_SEEDS,
  HOUR_FACTORS,
  PLATFORM_SHARES,
  SCREEN_SEEDS,
  WEEKDAY_FACTORS,
  screenByKey
} from './analytics-catalogue'
import { MOCK_REF_DATE } from './generate'

/** The fixture's clock. Every date in the series is relative to this, never to now. */
const ANALYTICS_REF_DATE = MOCK_REF_DATE

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

/** 90 days of range plus 90 days of comparison window. */
const SERIES_DAYS = 180

const ANALYTICS_SEED = 770_077

/** Turns a catalogue weight into events per day. Home, at weight 100, sees ~4.2k views. */
const WEIGHT_SCALE = 42

/** Compounding daily growth, so the 90-day chart slopes the way a healthy app does. */
const DAILY_GROWTH = 0.0022

/** Sessions per daily active user. */
const SESSIONS_PER_USER = 1.6

/** Share of all events that are failures. Fixed, so the error-rate tile has a baseline. */
const ERROR_SHARE = 0.013

/** Midnight UTC of the series' last day — the day `ANALYTICS_REF_DATE` falls in. */
const SERIES_END = Date.UTC(
  ANALYTICS_REF_DATE.getUTCFullYear(),
  ANALYTICS_REF_DATE.getUTCMonth(),
  ANALYTICS_REF_DATE.getUTCDate()
)

const SERIES_START = SERIES_END - (SERIES_DAYS - 1) * DAY_MS

/** Midnight UTC of day `index`, 0 being the oldest day of the series. */
const dayAt = (index: number) => new Date(SERIES_START + index * DAY_MS)

/** Monday-first weekday index, which is how the heatmap rows are ordered. */
const weekdayOf = (date: Date) => (date.getUTCDay() + 6) % 7

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/* -------------------------------------------------------------------------- *
 * The series
 * -------------------------------------------------------------------------- */

type Series = Map<string, number[]>

/** Day-shape multiplier: weekday seasonality times the slow growth trend. */
const dayFactor = (index: number) => WEEKDAY_FACTORS[weekdayOf(dayAt(index))] * (1 + DAILY_GROWTH * index)

/**
 * `weight` scaled into a daily count, with per-day jitter so the charts are not smooth.
 * Faker is already seeded by the caller: the draw order across all series is what makes
 * the output reproducible, so no generator here may reseed.
 */
const buildSeries = (seeds: readonly { weight: number }[], keys: readonly string[]): Series => {
  const series: Series = new Map()

  seeds.forEach((seed, seedIndex) => {
    const days = Array.from({ length: SERIES_DAYS }, (_, index) =>
      Math.round(seed.weight * WEIGHT_SCALE * dayFactor(index) * faker.number.float({ min: 0.82, max: 1.18 }))
    )

    series.set(keys[seedIndex], days)
  })

  return series
}

/** Per-screen share of monthly users who ever reach it, from the screen's own weight. */
const buildReach = (): Map<string, number> => {
  const reach = new Map<string, number>()

  SCREEN_SEEDS.forEach(seed => {
    reach.set(seed.key, clamp((seed.weight / 100) * faker.number.float({ min: 0.62, max: 0.94 }), 0.05, 0.96))
  })

  return reach
}

const built = (() => {
  faker.seed(ANALYTICS_SEED)

  const screenViews = buildSeries(
    SCREEN_SEEDS,
    SCREEN_SEEDS.map(seed => seed.key)
  )

  const elementClicks = buildSeries(
    ELEMENT_SEEDS,
    ELEMENT_SEEDS.map(seed => seed.id)
  )

  const reachByScreen = buildReach()

  // Totals per day, so the summary and the timeline never re-walk every screen.
  const viewsPerDay = Array.from({ length: SERIES_DAYS }, (_, index) =>
    sum(SCREEN_SEEDS.map(seed => screenViews.get(seed.key)![index]))
  )

  const interactionsPerDay = Array.from({ length: SERIES_DAYS }, (_, index) =>
    sum(ELEMENT_SEEDS.map(seed => elementClicks.get(seed.id)![index]))
  )

  // Home is the anchor for population: a user opens it a handful of times a day.
  const homeViews = screenViews.get('home')!
  const usersPerDay = homeViews.map(views => Math.round(views * 0.62))
  const sessionsPerDay = usersPerDay.map(users => Math.round(users * SESSIONS_PER_USER))

  // Seconds of attention per day, from each screen's dwell time.
  const secondsPerDay = Array.from({ length: SERIES_DAYS }, (_, index) =>
    sum(SCREEN_SEEDS.map(seed => screenViews.get(seed.key)![index] * seed.dwellSeconds))
  )

  return { screenViews, elementClicks, reachByScreen, viewsPerDay, interactionsPerDay, usersPerDay, sessionsPerDay, secondsPerDay }
})()

/* -------------------------------------------------------------------------- *
 * Windows
 * -------------------------------------------------------------------------- */

type Window = {

  /** Inclusive day indices of the range itself. */
  from: number
  to: number

  /** Inclusive day indices of the equal-length window before it. */
  prevFrom: number
  prevTo: number
  days: number
}

const windowFor = (range: AnalyticsRange): Window => {
  const days = RANGE_DAYS[range]
  const to = SERIES_DAYS - 1
  const from = to - days + 1

  return { from, to, prevFrom: from - days, prevTo: from - 1, days }
}

const sliceSum = (values: number[], from: number, to: number) => sum(values.slice(from, to + 1))

const delta = (value: number, previous: number): MetricDelta => ({
  value,
  previous,
  changePct: previous === 0 ? 0 : ((value - previous) / previous) * 100
})

/**
 * Unique users over a window. Summing daily actives would double-count the people who come
 * back every day, so the daily mean is stretched by a sublinear factor instead — the usual
 * shape of a DAU-to-MAU curve.
 */
const uniqueUsersOver = (from: number, to: number, days: number) => {
  const mean = sliceSum(built.usersPerDay, from, to) / days

  return Math.round(mean * days ** 0.42)
}

/* -------------------------------------------------------------------------- *
 * Bucketing
 *
 * Sparklines and the headline chart share one bucket layout per range, so a tile's
 * sparkline lines up with the big chart above it. `24h` is the only hourly one: its
 * buckets split the last day by `HOUR_FACTORS`.
 * -------------------------------------------------------------------------- */

const BUCKET_DAYS: Record<AnalyticsRange, number> = { '24h': 0, '7d': 1, '30d': 2, '90d': 5 }

const HOUR_FACTOR_TOTAL = sum([...HOUR_FACTORS])

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date)

type Bucket = {
  at: string
  label: string

  /** Day indices the bucket covers, and the share of each day's total it takes. */
  dayIndices: number[]
  share: number
}

const bucketsFor = (range: AnalyticsRange): Bucket[] => {
  const window = windowFor(range)

  if (range === '24h') {
    return HOUR_FACTORS.map((factor, hour) => ({
      at: new Date(SERIES_END + hour * HOUR_MS).toISOString(),
      label: `${String(hour).padStart(2, '0')}:00`,
      dayIndices: [window.to],
      share: factor / HOUR_FACTOR_TOTAL
    }))
  }

  const step = BUCKET_DAYS[range]
  const buckets: Bucket[] = []

  for (let start = window.from; start <= window.to; start += step) {
    const dayIndices = Array.from({ length: Math.min(step, window.to - start + 1) }, (_, offset) => start + offset)

    buckets.push({
      at: dayAt(start).toISOString(),
      label: dateLabel(dayAt(start)),
      dayIndices,
      share: 1
    })
  }

  return buckets
}

const bucketValue = (bucket: Bucket, values: number[]) =>
  Math.round(sum(bucket.dayIndices.map(index => values[index])) * bucket.share)

/* -------------------------------------------------------------------------- *
 * Aggregates
 * -------------------------------------------------------------------------- */

export const getSummary = (range: AnalyticsRange): AnalyticsSummary => {
  const { from, to, prevFrom, prevTo, days } = windowFor(range)

  const views = sliceSum(built.viewsPerDay, from, to)
  const prevViews = sliceSum(built.viewsPerDay, prevFrom, prevTo)
  const interactions = sliceSum(built.interactionsPerDay, from, to)
  const prevInteractions = sliceSum(built.interactionsPerDay, prevFrom, prevTo)
  const sessions = sliceSum(built.sessionsPerDay, from, to)
  const prevSessions = sliceSum(built.sessionsPerDay, prevFrom, prevTo)
  const seconds = sliceSum(built.secondsPerDay, from, to)
  const prevSeconds = sliceSum(built.secondsPerDay, prevFrom, prevTo)

  return {
    screenViews: delta(views, prevViews),
    interactions: delta(interactions, prevInteractions),
    activeUsers: delta(uniqueUsersOver(from, to, days), uniqueUsersOver(prevFrom, prevTo, days)),
    sessions: delta(sessions, prevSessions),
    avgSessionSeconds: delta(Math.round(seconds / sessions), Math.round(prevSeconds / prevSessions)),
    interactionsPerSession: delta(
      Number((interactions / sessions).toFixed(1)),
      Number((prevInteractions / prevSessions).toFixed(1))
    ),

    // The error share is a constant of the fixture, so only the volume behind it moves.
    errorRate: delta(ERROR_SHARE, ERROR_SHARE)
  }
}

export const getScreenStats = (range: AnalyticsRange): ScreenStat[] => {
  const { from, to, prevFrom, prevTo, days } = windowFor(range)
  const buckets = bucketsFor(range)
  const activeUsers = uniqueUsersOver(from, to, days)

  return SCREEN_SEEDS.map(seed => {
    const series = built.screenViews.get(seed.key)!
    const views = sliceSum(series, from, to)
    const previous = sliceSum(series, prevFrom, prevTo)

    return {
      key: seed.key,
      path: seed.path,
      name: seed.name,
      area: seed.area,
      views,
      uniqueUsers: Math.round(activeUsers * built.reachByScreen.get(seed.key)!),
      avgSeconds: seed.dwellSeconds,
      exitRate: seed.exitRate,
      changePct: previous === 0 ? 0 : ((views - previous) / previous) * 100,
      trend: buckets.map(bucket => bucketValue(bucket, series))
    }
  }).sort((a, b) => b.views - a.views)
}

export const getElementStats = (range: AnalyticsRange): ElementStat[] => {
  const { from, to, prevFrom, prevTo, days } = windowFor(range)
  const buckets = bucketsFor(range)
  const activeUsers = uniqueUsersOver(from, to, days)

  return ELEMENT_SEEDS.map(seed => {
    const series = built.elementClicks.get(seed.id)!
    const clicks = sliceSum(series, from, to)
    const previous = sliceSum(series, prevFrom, prevTo)
    const host = screenByKey.get(seed.screenKey)!
    const hostViews = sliceSum(built.screenViews.get(seed.screenKey)!, from, to)

    // Users who reached the host screen, narrowed by how central the control is to it.
    const hostUsers = activeUsers * built.reachByScreen.get(seed.screenKey)!
    const engaged = clamp(seed.weight / host.weight, 0.04, 0.94)

    return {
      id: seed.id,
      name: seed.name,
      screenKey: seed.screenKey,
      screenName: host.name,
      kind: seed.kind,
      clicks,
      uniqueUsers: Math.round(hostUsers * engaged),
      clickRate: hostViews === 0 ? 0 : clicks / hostViews,
      changePct: previous === 0 ? 0 : ((clicks - previous) / previous) * 100,
      trend: buckets.map(bucket => bucketValue(bucket, series))
    }
  }).sort((a, b) => b.clicks - a.clicks)
}

export const getTimeline = (range: AnalyticsRange): TimelinePoint[] =>
  bucketsFor(range).map(bucket => ({
    at: bucket.at,
    label: bucket.label,
    views: bucketValue(bucket, built.viewsPerDay),
    interactions: bucketValue(bucket, built.interactionsPerDay),
    sessions: bucketValue(bucket, built.sessionsPerDay)
  }))

/**
 * The event mix.
 *
 * Views and errors are exact — views are the series, errors a fixed share of the total —
 * and the interaction types split the measured interaction count between them, so the
 * slices always add up to the events the rest of the dashboard reports.
 */
export const getEventMix = (range: AnalyticsRange): EventMixSlice[] => {
  const { from, to } = windowFor(range)

  const views = sliceSum(built.viewsPerDay, from, to)
  const interactions = sliceSum(built.interactionsPerDay, from, to)
  const errors = Math.round(((views + interactions) * ERROR_SHARE) / (1 - ERROR_SHARE))
  const total = views + interactions + errors

  const interactionShares = EVENT_MIX_SHARES.filter(
    entry => entry.type !== 'SCREEN_VIEW' && entry.type !== 'ERROR'
  )

  const interactionTotal = sum(interactionShares.map(entry => entry.share))

  const slices: EventMixSlice[] = [
    { type: 'SCREEN_VIEW', count: views, share: views / total },
    ...interactionShares.map(entry => {
      const count = Math.round(interactions * (entry.share / interactionTotal))

      return { type: entry.type as EventType, count, share: count / total }
    }),
    { type: 'ERROR', count: errors, share: errors / total }
  ]

  return slices.sort((a, b) => b.count - a.count)
}

/** The hour matrix, and the window it was actually measured over. */
export type HourMatrix = {
  cells: HourCell[]
  days: number
  peak: HourCell
}

/**
 * Interactions by weekday and hour, averaged per weekday.
 *
 * The window is at least four weeks whatever the range: with fewer, most rows of the grid
 * hold a single day and the picture is noise. `days` says what was really measured so the
 * widget can label itself honestly.
 */
export const getHourMatrix = (range: AnalyticsRange): HourMatrix => {
  const days = Math.max(28, RANGE_DAYS[range])
  const to = SERIES_DAYS - 1
  const from = to - days + 1

  const totals = Array.from({ length: 7 }, () => 0)
  const counts = Array.from({ length: 7 }, () => 0)

  for (let index = from; index <= to; index++) {
    const weekday = weekdayOf(dayAt(index))

    totals[weekday] += built.interactionsPerDay[index]
    counts[weekday] += 1
  }

  const cells: HourCell[] = []

  for (let weekday = 0; weekday < 7; weekday++) {
    const perDay = counts[weekday] === 0 ? 0 : totals[weekday] / counts[weekday]

    HOUR_FACTORS.forEach((factor, hour) => {
      cells.push({ weekday, hour, interactions: Math.round((perDay * factor) / HOUR_FACTOR_TOTAL) })
    })
  }

  const peak = cells.reduce((best, cell) => (cell.interactions > best.interactions ? cell : best), cells[0])

  return { cells, days, peak }
}

export const getFunnel = (range: AnalyticsRange): FunnelStep[] => {
  const { from, to, days } = windowFor(range)

  let users = uniqueUsersOver(from, to, days)
  const first = users

  return FUNNEL_SEEDS.map((seed, index) => {
    const previous = users

    users = Math.round(users * seed.retention)

    return {
      key: seed.key,
      name: seed.name,
      users,
      share: users / first,
      dropOff: index === 0 ? 0 : (previous - users) / previous
    }
  })
}

export const getPlatformSplit = (range: AnalyticsRange): PlatformSplit[] => {
  const { from, to } = windowFor(range)
  const sessions = sliceSum(built.sessionsPerDay, from, to)

  return PLATFORM_SHARES.map(entry => ({
    platform: entry.platform as Platform,
    sessions: Math.round(sessions * entry.share),
    share: entry.share
  }))
}

export type AreaSplit = { area: ScreenArea; views: number; share: number }

/** Area totals, for the breakdown the ranked lists cannot show. */
export const getAreaSplit = (range: AnalyticsRange): AreaSplit[] => {
  const screens = getScreenStats(range)
  const total = sum(screens.map(stat => stat.views))

  const byArea = new Map<ScreenArea, number>()

  screens.forEach(stat => byArea.set(stat.area, (byArea.get(stat.area) ?? 0) + stat.views))

  return [...byArea.entries()]
    .map(([area, views]) => ({ area, views, share: views / total }))
    .sort((a, b) => b.views - a.views)
}
