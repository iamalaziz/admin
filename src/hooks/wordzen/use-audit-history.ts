'use client'

import { useCallback, useMemo, useState } from 'react'

import { AUDIT_REF_DATE, listAuditEntries } from '@/fake-db/wordzen/audit'
import type { AuditEntry, AuditFilter } from '@/types/wordzen/audit-types'
import { AUDIT_FILTERS, matchesAuditFilter } from '@/types/wordzen/audit-types'

/** Entries added per "load more". The drawer opens on one page. */
const PAGE_SIZE = 20

const DAY_MS = 86_400_000

/** A day's worth of entries, with the heading the drawer shows above them. */
export type AuditGroup = {
  /** `YYYY-MM-DD` in UTC — the React key, and what tells today from yesterday. */
  day: string
  entries: AuditEntry[]
}

const utcDay = (iso: string) => iso.slice(0, 10)

/** Searches the actor, the target and the fields that changed. */
const matchesQuery = (entry: AuditEntry, query: string) => {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  const haystack = [
    entry.actor.username,
    entry.target.name,
    entry.target.context,
    entry.target.type,
    entry.action,
    entry.summary,
    ...entry.changes.map(item => item.field)
  ]

  return haystack.some(field => field?.toLowerCase().includes(normalized))
}

/**
 * The audit drawer's data: filter, search and paging over the trail.
 *
 * The fixture is built once per mount — it is deterministic, so rebuilding it would only
 * cost time — and nothing in the panel writes to it, so there is no store subscription
 * here. When this becomes an endpoint, `entries` is where the fetch goes and the filter
 * and search move into its query string.
 */
export function useAuditHistory() {
  const [filter, setFilterState] = useState<AuditFilter>('all')
  const [search, setSearchState] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const entries = useMemo(() => listAuditEntries(), [])

  const filtered = useMemo(
    () => entries.filter(entry => matchesAuditFilter(entry, filter) && matchesQuery(entry, search)),
    [entries, filter, search]
  )

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit])

  /** Consecutive entries of the same UTC day, in the order they are shown. */
  const groups = useMemo(() => {
    const result: AuditGroup[] = []

    visible.forEach(entry => {
      const day = utcDay(entry.at)
      const last = result[result.length - 1]

      if (last?.day === day) {
        last.entries.push(entry)

        return
      }

      result.push({ day, entries: [entry] })
    })

    return result
  }, [visible])

  /** Counts per tab, so the drawer shows them without filtering five more times. */
  const counts = useMemo(() => {
    const pairs = AUDIT_FILTERS.map(
      key =>
        [key, entries.filter(entry => matchesAuditFilter(entry, key) && matchesQuery(entry, search)).length] as const
    )

    return Object.fromEntries(pairs) as Record<AuditFilter, number>
  }, [entries, search])

  const setFilter = useCallback((value: AuditFilter) => {
    setFilterState(value)
    setLimit(PAGE_SIZE)
  }, [])

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setLimit(PAGE_SIZE)
  }, [])

  return {
    filter,
    setFilter,
    search,
    setSearch,
    groups,
    counts,
    entries,
    total: filtered.length,
    shown: visible.length,
    hasMore: visible.length < filtered.length,
    loadMore: useCallback(() => setLimit(current => current + PAGE_SIZE), []),

    /** The clock relative timestamps are measured from — the fixture's, not the wall's. */
    now: AUDIT_REF_DATE
  }
}

/** "Today" / "Yesterday" / the date, for a group heading. `now` comes from the hook. */
export const dayHeading = (day: string, now: Date): { label: 'today' | 'yesterday' | 'date'; absolute: string } => {
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10)

  const absolute = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC'
  }).format(new Date(`${day}T00:00:00.000Z`))

  if (day === today) {
    return { label: 'today', absolute }
  }

  if (day === yesterday) {
    return { label: 'yesterday', absolute }
  }

  return { label: 'date', absolute }
}
