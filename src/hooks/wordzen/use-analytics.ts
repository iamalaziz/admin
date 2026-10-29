'use client'

import { useMemo, useState } from 'react'

import {
  getAreaSplit,
  getElementStats,
  getEventMix,
  getFunnel,
  getHourMatrix,
  getPlatformSplit,
  getScreenStats,
  getSummary,
  getTimeline
} from '@/fake-db/wordzen/analytics'
import type { AnalyticsRange } from '@/types/wordzen/analytics-types'

/**
 * Everything the four dashboards read, for one range.
 *
 * Each aggregate is a pure function of the range, so there is no store to subscribe to
 * here — unlike the content tools, nothing in this panel writes product analytics. When
 * these become HTTP calls the memos are where the fetch goes, and the call sites do not
 * move.
 *
 * All of it is computed on every range change rather than lazily per widget: the series
 * behind it is 180 days across ~30 screens, and the dashboards read most of the aggregates
 * at once anyway.
 */
export function useAnalytics(initialRange: AnalyticsRange = '7d') {
  const [range, setRange] = useState<AnalyticsRange>(initialRange)

  const summary = useMemo(() => getSummary(range), [range])
  const screens = useMemo(() => getScreenStats(range), [range])
  const elements = useMemo(() => getElementStats(range), [range])
  const timeline = useMemo(() => getTimeline(range), [range])
  const eventMix = useMemo(() => getEventMix(range), [range])
  const hourMatrix = useMemo(() => getHourMatrix(range), [range])
  const funnel = useMemo(() => getFunnel(range), [range])
  const platforms = useMemo(() => getPlatformSplit(range), [range])
  const areas = useMemo(() => getAreaSplit(range), [range])

  return { range, setRange, summary, screens, elements, timeline, eventMix, hourMatrix, funnel, platforms, areas }
}

export type Analytics = ReturnType<typeof useAnalytics>
