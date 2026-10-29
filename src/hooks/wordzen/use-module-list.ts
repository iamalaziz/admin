'use client'

import { useCallback, useMemo, useState } from 'react'

import type { Module, ModulePayload } from '@/types/wordzen/content-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type ModuleSortColumn = 'order' | 'title' | 'published' | 'cards' | 'phrases' | 'created'

export type ModulePublishedFilter = 'all' | 'public' | 'draft'

const compareModules = (a: Module, b: Module, column: ModuleSortColumn): number => {
  switch (column) {
    case 'title':
      return a.title.localeCompare(b.title)
    case 'published':
      return Number(a.isPublic) - Number(b.isPublic)
    case 'cards':
      return a.cardCount - b.cardCount
    case 'phrases':
      return a.phraseCardCount - b.phraseCardCount
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    default:
      return a.displayOrder - b.displayOrder
  }
}

/** The modules of one course — `GET /api/v1/manager/courses/{courseId}/modules`. */
export function useModuleList(courseId: number) {
  const controls = useTableControls<ModuleSortColumn>({ id: 'order', desc: false })
  const [published, setPublishedState] = useState<ModulePublishedFilter>('all')

  const course = useStoreSelector(() => mockStore.getCourse(courseId), [courseId])
  const allModules = useStoreSelector(() => mockStore.listModules(courseId), [courseId])

  const filtered = useMemo(
    () =>
      allModules.filter(module => {
        if (published === 'public' && !module.isPublic) {
          return false
        }

        if (published === 'draft' && module.isPublic) {
          return false
        }

        return matchesSearch(controls.search, module.title)
      }),
    [allModules, controls.search, published]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareModules), [controls.sorting, filtered])

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setPublished = useCallback(
    (value: ModulePublishedFilter) => {
      setPublishedState(value)
      controls.resetPage()
    },
    [controls]
  )

  const totals = useMemo(
    () => ({
      moduleCount: allModules.length,
      publishedCount: allModules.filter(module => module.isPublic).length,
      cardCount: allModules.reduce((total, module) => total + module.cardCount, 0),
      phraseCardCount: allModules.reduce((total, module) => total + module.phraseCardCount, 0)
    }),
    [allModules]
  )

  return {
    ...controls,
    course,
    published,
    setPublished,
    totals,
    modules: pagination.pageItems,
    ...pagination,
    createModule: useCallback((payload: ModulePayload) => mockStore.createModule(payload), []),
    updateModule: useCallback(
      (moduleId: number, payload: ModulePayload) => mockStore.updateModule(moduleId, payload),
      []
    ),
    deleteModule: useCallback((moduleId: number) => mockStore.deleteModule(moduleId), []),
    moveModule: useCallback(
      (module: Module, direction: -1 | 1) => mockStore.reorderModule(module.id, module.displayOrder + direction),
      []
    )
  }
}
