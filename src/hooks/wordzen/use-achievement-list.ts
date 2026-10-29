'use client'

import { useCallback, useMemo, useState } from 'react'

import type {
  Achievement,
  AchievementGroupCode,
  AchievementPayload,
  AchievementRecipient,
  UserAchievement
} from '@/types/wordzen/achievement-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type AchievementSortColumn = 'order' | 'code' | 'title' | 'group' | 'state' | 'recipients'

/** `active` is what the catalogue endpoint filters on, so it is the state that matters. */
export type AchievementStateFilter = 'all' | 'active' | 'inactive'

export type AchievementFilters = {
  group: AchievementGroupCode | 'all'
  state: AchievementStateFilter
}

const DEFAULT_FILTERS: AchievementFilters = {
  group: 'all',
  state: 'all'
}

const compareAchievements = (a: Achievement, b: Achievement, column: AchievementSortColumn): number => {
  switch (column) {
    case 'code':
      return a.code.localeCompare(b.code)
    case 'title':
      return a.title.localeCompare(b.title)
    case 'group':
      return a.group.displayOrder - b.group.displayOrder
    case 'state':
      return Number(a.active) - Number(b.active)
    case 'recipients':
      return a.receivedCount - b.receivedCount
    default:
      return a.displayOrder - b.displayOrder
  }
}

/** The achievement catalogue — the admin view of it, inactive rows included. */
export function useAchievementList() {
  const controls = useTableControls<AchievementSortColumn>({ id: 'order', desc: false })
  const [filters, setFiltersState] = useState<AchievementFilters>(DEFAULT_FILTERS)

  const allAchievements = useStoreSelector(() => mockStore.listAchievements())
  const stats = useStoreSelector(() => mockStore.getAchievementStats())

  const filtered = useMemo(
    () =>
      allAchievements.filter(achievement => {
        if (filters.group !== 'all' && achievement.group.code !== filters.group) {
          return false
        }

        if (filters.state === 'active' && !achievement.active) {
          return false
        }

        if (filters.state === 'inactive' && achievement.active) {
          return false
        }

        // The code is searchable because it is what a grant is made against, and what the
        // services and the learner app refer to.
        return matchesSearch(
          controls.search,
          achievement.code,
          achievement.title,
          achievement.description,
          achievement.group.title
        )
      }),
    [allAchievements, controls.search, filters]
  )

  const sorted = useMemo(
    () => applySorting(filtered, controls.sorting, compareAchievements),
    [controls.sorting, filtered]
  )

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setFilters = useCallback(
    (next: Partial<AchievementFilters>) => {
      setFiltersState(prev => ({ ...prev, ...next }))
      controls.resetPage()
    },
    [controls]
  )

  return {
    ...controls,
    filters,
    setFilters,
    stats,

    /** Every code in the catalogue, for the form's uniqueness check. */
    codes: useMemo(() => allAchievements.map(achievement => achievement.code), [allAchievements]),
    achievements: pagination.pageItems,
    ...pagination,
    createAchievement: useCallback((payload: AchievementPayload) => mockStore.createAchievement(payload), []),
    updateAchievement: useCallback(
      (code: string, payload: AchievementPayload) => mockStore.updateAchievement(code, payload),
      []
    ),
    deleteAchievement: useCallback((code: string) => mockStore.deleteAchievement(code), []),
    moveAchievement: useCallback(
      (achievement: Achievement, direction: -1 | 1) =>
        mockStore.reorderAchievement(achievement.code, achievement.displayOrder + direction),
      []
    )
  }
}

export type RecipientSortColumn = 'username' | 'status' | 'received'

const compareRecipients = (a: AchievementRecipient, b: AchievementRecipient, column: RecipientSortColumn): number => {
  switch (column) {
    case 'username':
      return a.username.localeCompare(b.username)
    case 'status':
      return a.status.localeCompare(b.status)
    default:
      return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  }
}

/** One achievement and the learners holding it. */
export function useAchievementDetail(code: string) {
  const controls = useTableControls<RecipientSortColumn>({ id: 'received', desc: true })

  const achievement = useStoreSelector(() => mockStore.getAchievement(code), [code])
  const allRecipients = useStoreSelector(() => mockStore.listAchievementRecipients(code), [code])

  const filtered = useMemo(
    () => allRecipients.filter(recipient => matchesSearch(controls.search, recipient.username, recipient.email)),
    [allRecipients, controls.search]
  )

  const sorted = useMemo(
    () => applySorting(filtered, controls.sorting, compareRecipients),
    [controls.sorting, filtered]
  )

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  return {
    ...controls,
    achievement,
    recipients: pagination.pageItems,
    ...pagination,
    updateAchievement: useCallback((payload: AchievementPayload) => mockStore.updateAchievement(code, payload), [code]),
    deleteAchievement: useCallback(() => mockStore.deleteAchievement(code), [code]),
    revokeAchievement: useCallback((uid: string) => mockStore.revokeAchievement(uid, code), [code])
  }
}

/** One `achievement_groups` row with the user's state for each achievement under it. */
export type UserAchievementGroup = {
  code: AchievementGroupCode
  title: string
  displayOrder: number
  achievements: UserAchievement[]
}

/**
 * One user's achievements — `GET /api/v1/users/{uid}/achievements/all`, grouped the way
 * the learner app shows them.
 */
export function useUserAchievements(uid: string) {
  const achievements = useStoreSelector(() => mockStore.listUserAchievements(uid), [uid])

  const groups = useMemo(() => {
    const byCode = new Map<AchievementGroupCode, UserAchievementGroup>()

    achievements.forEach(achievement => {
      const group = byCode.get(achievement.group.code) ?? {
        code: achievement.group.code,
        title: achievement.group.title,
        displayOrder: achievement.group.displayOrder,
        achievements: []
      }

      group.achievements.push(achievement)
      byCode.set(achievement.group.code, group)
    })

    return [...byCode.values()].sort((a, b) => a.displayOrder - b.displayOrder)
  }, [achievements])

  const totals = useMemo(
    () => ({
      total: achievements.length,
      received: achievements.filter(achievement => achievement.received).length
    }),
    [achievements]
  )

  return {
    achievements,
    groups,
    totals,
    grantAchievement: useCallback(
      (achievementCode: string) => mockStore.grantAchievement(uid, { achievementCode }),
      [uid]
    ),
    revokeAchievement: useCallback(
      (achievementCode: string) => mockStore.revokeAchievement(uid, achievementCode),
      [uid]
    )
  }
}
