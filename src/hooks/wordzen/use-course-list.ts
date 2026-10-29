'use client'

import { useCallback, useMemo, useState } from 'react'

import type { Course, CourseAccessCode, CourseCategoryCode, CoursePayload } from '@/types/wordzen/content-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type CourseSortColumn = 'order' | 'title' | 'category' | 'access' | 'published' | 'modules' | 'created'

export type CourseFilters = {
  category: CourseCategoryCode | 'all'
  access: CourseAccessCode | 'all'
  published: 'all' | 'public' | 'draft'
}

const DEFAULT_FILTERS: CourseFilters = {
  category: 'all',
  access: 'all',
  published: 'all'
}

const compareCourses = (a: Course, b: Course, column: CourseSortColumn): number => {
  switch (column) {
    case 'title':
      return a.title.localeCompare(b.title)
    case 'category':
      return a.category.code.localeCompare(b.category.code)
    case 'access':
      return a.accessCode.localeCompare(b.accessCode)
    case 'published':
      return Number(a.isPublic) - Number(b.isPublic)
    case 'modules':
      return a.moduleCount - b.moduleCount
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    default:
      return a.displayOrder - b.displayOrder
  }
}

export function useCourseList() {
  const controls = useTableControls<CourseSortColumn>({ id: 'order', desc: false })
  const [filters, setFiltersState] = useState<CourseFilters>(DEFAULT_FILTERS)

  const allCourses = useStoreSelector(() => mockStore.listCourses())
  const stats = useStoreSelector(() => mockStore.getContentStats())

  const filtered = useMemo(
    () =>
      allCourses.filter(course => {
        if (filters.category !== 'all' && course.category.code !== filters.category) {
          return false
        }

        if (filters.access !== 'all' && course.accessCode !== filters.access) {
          return false
        }

        if (filters.published === 'public' && !course.isPublic) {
          return false
        }

        if (filters.published === 'draft' && course.isPublic) {
          return false
        }

        return matchesSearch(controls.search, course.title, course.authorUsername, course.category.name)
      }),
    [allCourses, controls.search, filters]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareCourses), [controls.sorting, filtered])

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setFilters = useCallback(
    (next: Partial<CourseFilters>) => {
      setFiltersState(prev => ({ ...prev, ...next }))
      controls.resetPage()
    },
    [controls]
  )

  const createCourse = useCallback((payload: CoursePayload) => mockStore.createCourse(payload), [])

  const updateCourse = useCallback(
    (courseId: number, payload: CoursePayload) => mockStore.updateCourse(courseId, payload),
    []
  )

  const deleteCourse = useCallback((courseId: number) => mockStore.deleteCourse(courseId), [])

  /**
   * Maps to POST /manager/courses/{courseId}/reorder. The list is sorted by `displayOrder`
   * by default, so a move is expressed as a target position rather than a swap.
   */
  const moveCourse = useCallback(
    (course: Course, direction: -1 | 1) => mockStore.reorderCourse(course.id, course.displayOrder + direction),
    []
  )

  return {
    ...controls,
    filters,
    setFilters,
    stats,
    courses: pagination.pageItems,
    ...pagination,
    createCourse,
    updateCourse,
    deleteCourse,
    moveCourse
  }
}
