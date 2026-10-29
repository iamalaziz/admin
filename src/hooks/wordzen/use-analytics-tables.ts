'use client'

import { useMemo } from 'react'

import type { ElementStat, ScreenStat } from '@/types/wordzen/analytics-types'

import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

/**
 * Search, sort and pagination over the screen and control aggregates.
 *
 * Same shape as the content tables — the rows arrive whole from `useAnalytics`, so these
 * only slice them. Worth having because the engagement dashboard shows the full catalogue
 * rather than a top ten, and ~30 screens and ~45 controls need paging and a search box.
 */

export type ScreenSortColumn = 'name' | 'area' | 'views' | 'uniqueUsers' | 'avgSeconds' | 'exitRate' | 'changePct'

const compareScreens = (a: ScreenStat, b: ScreenStat, column: ScreenSortColumn): number => {
  switch (column) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'area':
      return a.area.localeCompare(b.area)
    case 'uniqueUsers':
      return a.uniqueUsers - b.uniqueUsers
    case 'avgSeconds':
      return a.avgSeconds - b.avgSeconds
    case 'exitRate':
      return a.exitRate - b.exitRate
    case 'changePct':
      return a.changePct - b.changePct
    default:
      return a.views - b.views
  }
}

export function useScreenTable(screens: ScreenStat[]) {
  const controls = useTableControls<ScreenSortColumn>({ id: 'views', desc: true })

  const filtered = useMemo(
    () => screens.filter(screen => matchesSearch(controls.search, screen.name, screen.path, screen.area)),
    [controls.search, screens]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareScreens), [controls.sorting, filtered])
  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  return { ...controls, rows: pagination.pageItems, ...pagination }
}

export type ElementSortColumn = 'name' | 'screenName' | 'kind' | 'clicks' | 'uniqueUsers' | 'clickRate' | 'changePct'

const compareElements = (a: ElementStat, b: ElementStat, column: ElementSortColumn): number => {
  switch (column) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'screenName':
      return a.screenName.localeCompare(b.screenName)
    case 'kind':
      return a.kind.localeCompare(b.kind)
    case 'uniqueUsers':
      return a.uniqueUsers - b.uniqueUsers
    case 'clickRate':
      return a.clickRate - b.clickRate
    case 'changePct':
      return a.changePct - b.changePct
    default:
      return a.clicks - b.clicks
  }
}

export function useElementTable(elements: ElementStat[]) {
  const controls = useTableControls<ElementSortColumn>({ id: 'clicks', desc: true })

  const filtered = useMemo(
    () => elements.filter(item => matchesSearch(controls.search, item.name, item.screenName, item.kind)),
    [controls.search, elements]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareElements), [controls.sorting, filtered])
  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  return { ...controls, rows: pagination.pageItems, ...pagination }
}
