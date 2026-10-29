'use client'

import { useCallback, useMemo, useState } from 'react'

import type { AdminUser, RoleCode, SubscriptionCode, UserStatusCode } from '@/types/wordzen/user-types'

import { mockStore, useStoreSelector } from './use-mock-store'
import { applySorting, matchesSearch, usePaginatedRows, useTableControls } from './use-table-controls'

export type UserSortColumn = 'id' | 'username' | 'status' | 'roles' | 'subscription' | 'created'

export type UserFilters = {
  status: UserStatusCode | 'all'
  role: RoleCode | 'all'
  subscription: SubscriptionCode | 'none' | 'all'
}

const DEFAULT_FILTERS: UserFilters = {
  status: 'all',
  role: 'all',
  subscription: 'all'
}

/** Staff first when sorting by role, since that is what an admin is usually looking for. */
const roleWeight = (user: AdminUser) =>
  user.roles.includes('ROLE_ADMIN') ? 2 : user.roles.includes('ROLE_AUTHOR') ? 1 : 0

const compareUsers = (a: AdminUser, b: AdminUser, column: UserSortColumn): number => {
  switch (column) {
    case 'username':
      return a.username.localeCompare(b.username)
    case 'status':
      return a.status.localeCompare(b.status)
    case 'roles':
      return roleWeight(a) - roleWeight(b)
    case 'subscription':
      return (a.subscription?.code ?? '').localeCompare(b.subscription?.code ?? '')
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    default:
      return a.id - b.id
  }
}

export function useUserList() {
  const controls = useTableControls<UserSortColumn>({ id: 'id', desc: false })
  const [filters, setFiltersState] = useState<UserFilters>(DEFAULT_FILTERS)

  const allUsers = useStoreSelector(() => mockStore.listUsers())
  const stats = useStoreSelector(() => mockStore.getUserStats())

  const filtered = useMemo(
    () =>
      allUsers.filter(user => {
        if (filters.status !== 'all' && user.status !== filters.status) {
          return false
        }

        if (filters.role !== 'all' && !user.roles.includes(filters.role)) {
          return false
        }

        if (filters.subscription === 'none' && user.subscription !== null) {
          return false
        }

        if (
          filters.subscription !== 'all' &&
          filters.subscription !== 'none' &&
          user.subscription?.code !== filters.subscription
        ) {
          return false
        }

        // uid is included because that is the only identifier the admin endpoints take.
        return matchesSearch(controls.search, user.username, user.email, user.uid)
      }),
    [allUsers, controls.search, filters]
  )

  const sorted = useMemo(() => applySorting(filtered, controls.sorting, compareUsers), [controls.sorting, filtered])

  const pagination = usePaginatedRows(sorted, controls.page, controls.rowsPerPage)

  const setFilters = useCallback(
    (next: Partial<UserFilters>) => {
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
    users: pagination.pageItems,
    ...pagination,
    blockUser: useCallback((uid: string, reason: string | null) => mockStore.blockUser(uid, reason), []),
    unblockUser: useCallback((uid: string) => mockStore.unblockUser(uid), [])
  }
}

/** One user, for the detail page — `GET /api/v1/admin/users/{uid}/status` plus the entity. */
export function useUserDetail(uid: string) {
  const user = useStoreSelector(() => mockStore.getUser(uid), [uid])
  const status = useStoreSelector(() => mockStore.getUserStatus(uid), [uid])

  return {
    user,
    status,
    blockUser: useCallback((reason: string | null) => mockStore.blockUser(uid, reason), [uid]),
    unblockUser: useCallback(() => mockStore.unblockUser(uid), [uid]),
    setRoles: useCallback((roles: RoleCode[]) => mockStore.setUserRoles(uid, roles), [uid])
  }
}
