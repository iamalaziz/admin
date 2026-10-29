'use client'

import { useCallback, useMemo, useState } from 'react'

export type Sorting<TColumn extends string> = {
  id: TColumn
  desc: boolean
}

export const DEFAULT_ROWS_PER_PAGE = 10

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

/**
 * Search, sort and pagination state shared by the course, module, card and user tables.
 *
 * Any change that can shrink the result set resets to page 1 — otherwise a filter applied
 * while on page 7 of 9 leaves the table showing an empty page.
 */
export function useTableControls<TColumn extends string>(initialSorting: Sorting<TColumn> | null = null) {
  const [search, setSearchState] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPageState] = useState<number>(DEFAULT_ROWS_PER_PAGE)
  const [sorting, setSortingState] = useState<Sorting<TColumn> | null>(initialSorting)

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setPage(1)
  }, [])

  const setRowsPerPage = useCallback((value: number) => {
    setRowsPerPageState(value)
    setPage(1)
  }, [])

  const setSorting = useCallback((value: Sorting<TColumn> | null) => {
    setSortingState(value)
    setPage(1)
  }, [])

  /** Call after a filter changes so the view never lands on a page past the end. */
  const resetPage = useCallback(() => setPage(1), [])

  return {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    sorting,
    setSorting,
    resetPage
  }
}

export type PaginationResult<TItem> = {
  pageItems: TItem[]
  total: number
  totalPages: number
  showingFrom: number
  showingTo: number
}

/** Slices `items` for the current page and derives the "showing x to y of z" numbers. */
export function usePaginatedRows<TItem>(items: TItem[], page: number, rowsPerPage: number): PaginationResult<TItem> {
  return useMemo(() => {
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))

    // A deletion can leave `page` past the end until the component re-renders; clamp here
    // so the table shows the last page instead of nothing.
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * rowsPerPage

    return {
      pageItems: items.slice(start, start + rowsPerPage),
      total,
      totalPages,
      showingFrom: total === 0 ? 0 : start + 1,
      showingTo: Math.min(start + rowsPerPage, total)
    }
  }, [items, page, rowsPerPage])
}

/** Case-insensitive "does any of these fields contain the query" test. */
export const matchesSearch = (query: string, ...fields: (string | null | undefined)[]) => {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  return fields.some(field => field?.toLowerCase().includes(normalized))
}

/** Sorts without mutating, applying the `desc` flag from the sorting state. */
export const applySorting = <TItem, TColumn extends string>(
  items: TItem[],
  sorting: Sorting<TColumn> | null,
  compare: (a: TItem, b: TItem, column: TColumn) => number
): TItem[] => {
  if (!sorting) {
    return items
  }

  return [...items].sort((a, b) => {
    const result = compare(a, b, sorting.id)

    return sorting.desc ? -result : result
  })
}
