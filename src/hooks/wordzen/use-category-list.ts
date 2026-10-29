'use client'

import { useCallback, useMemo, useState } from 'react'

import type { CourseCategory, CourseCategoryCode, CourseCategoryPayload } from '@/types/wordzen/content-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type CategorySortColumn = 'code' | 'name' | 'courses'

/** A category in use cannot be deleted, so the table is filtered on that distinction. */
export type CategoryUsageFilter = 'all' | 'inUse' | 'unused'

/** A `course_category` row with the number of courses sitting on it. */
export type CategoryRow = CourseCategory & {
  courseCount: number
}

/**
 * The live category list, for the selects that pick a course's category.
 *
 * The codes are a fixed enum but the rows are not: a category the admin deleted must stop
 * being offered, so these selects read the store rather than the seed constant.
 */
export function useCourseCategories(): CourseCategory[] {
  return useStoreSelector(() => mockStore.listCategories())
}

const compareCategories = (a: CategoryRow, b: CategoryRow, column: CategorySortColumn): number => {
  switch (column) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'courses':
      return a.courseCount - b.courseCount
    default:
      return a.code.localeCompare(b.code)
  }
}

/** The category catalogue — `GET /api/v1/manager/course-categories` in the mock store. */
export function useCategoryList() {
  const controls = useTableControls<CategorySortColumn>({ id: 'code', desc: false })
  const [usage, setUsageState] = useState<CategoryUsageFilter>('all')

  const categories = useStoreSelector(() => mockStore.listCategories())
  const courseCounts = useStoreSelector(() => mockStore.countCoursesByCategory())
  const availableCodes = useStoreSelector(() => mockStore.availableCategoryCodes())
  const stats = useStoreSelector(() => mockStore.getCategoryStats())

  const rows = useMemo<CategoryRow[]>(
    () => categories.map(category => ({ ...category, courseCount: courseCounts[category.code] })),
    [categories, courseCounts]
  )

  const filtered = useMemo(
    () =>
      rows.filter(row => {
        if (usage === 'inUse' && row.courseCount === 0) {
          return false
        }

        if (usage === 'unused' && row.courseCount > 0) {
          return false
        }

        return matchesSearch(controls.search, row.code, row.name)
      }),
    [controls.search, rows, usage]
  )

  const sorted = useMemo(
    () => applySorting(filtered, controls.sorting, compareCategories),
    [controls.sorting, filtered]
  )

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setUsage = useCallback(
    (value: CategoryUsageFilter) => {
      setUsageState(value)
      controls.resetPage()
    },
    [controls]
  )

  return {
    ...controls,
    usage,
    setUsage,
    stats,

    /** The codes a new category can still take; empty once all nine rows exist. */
    availableCodes,
    categories: pagination.pageItems,
    ...pagination,
    createCategory: useCallback((payload: CourseCategoryPayload) => mockStore.createCategory(payload), []),
    updateCategory: useCallback(
      (code: CourseCategoryCode, payload: CourseCategoryPayload) => mockStore.updateCategory(code, payload),
      []
    ),
    deleteCategory: useCallback((code: CourseCategoryCode) => mockStore.deleteCategory(code), [])
  }
}
