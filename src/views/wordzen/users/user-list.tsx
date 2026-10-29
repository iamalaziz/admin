'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { BanIcon, CircleCheckIcon, CrownIcon, EyeIcon, PencilIcon, ShieldIcon, UsersRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserSortColumn } from '@/hooks/wordzen/use-user-list'
import { useUserList } from '@/hooks/wordzen/use-user-list'
import { useTranslation } from '@/lib/i18n'
import type { AdminUser, RoleCode } from '@/types/wordzen/user-types'
import { ROLE_CODES, SUBSCRIPTION_CODES, USER_STATUS_CODES } from '@/types/wordzen/user-types'

import { DataTable } from '../shared/data-table'
import { StatCards, Timestamp, UserRoleBadge, UserStatusBadge } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { BlockUserDialog } from './block-user-dialog'
import { UserRolesSheet } from './user-roles-sheet'

export function UserList() {
  const { t } = useTranslation()
  const list = useUserList()
  const [blocking, setBlocking] = useState<AdminUser | null>(null)
  const [editingRoles, setEditingRoles] = useState<AdminUser | null>(null)

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'username',
        header: t('manage.columns.user'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <Link href={`/manage/users/${row.original.uid}`} className='truncate font-medium hover:underline'>
              {row.original.username}
            </Link>
            <span className='text-muted-foreground truncate text-xs'>{row.original.email}</span>
          </div>
        )
      },
      {
        id: 'roles',
        header: t('manage.columns.role'),
        cell: ({ row }) => <UserRoleBadge roles={row.original.roles} />
      },
      {
        id: 'status',
        header: t('manage.columns.status'),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />
      },
      {
        id: 'subscription',
        header: t('manage.columns.subscription'),
        cell: ({ row }) =>
          row.original.subscription ? (
            <div className='flex flex-col'>
              <span className='text-sm'>{row.original.subscription.code}</span>
              <span className='text-muted-foreground text-xs'>
                {t('manage.users.until')} <Timestamp value={row.original.subscription.endSubscriptionDate} />
              </span>
            </div>
          ) : (
            <span className='text-muted-foreground text-sm'>{t('manage.badges.free')}</span>
          )
      },
      {
        id: 'created',
        header: t('manage.columns.joined'),
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.createdAt} />
          </span>
        )
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('common.actions')}</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-1'>
            <Button
              render={<Link href={`/manage/users/${row.original.uid}`} />}
              nativeButton={false}
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.open', { name: row.original.username })}
            >
              <EyeIcon className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('manage.rowActions.editRoles', { name: row.original.username })}
              onClick={() => setEditingRoles(row.original)}
            >
              <PencilIcon className='size-4' />
            </Button>
            {row.original.status === 'BLOCKED' ? (
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('manage.rowActions.unblock', { name: row.original.username })}
                onClick={() => {
                  list.unblockUser(row.original.uid)
                  toast.success(t('manage.users.toast.unblocked', { name: row.original.username }))
                }}
              >
                <CircleCheckIcon className='size-4' />
              </Button>
            ) : (
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('manage.rowActions.block', { name: row.original.username })}
                className='text-muted-foreground hover:text-destructive'
                onClick={() => setBlocking(row.original)}
              >
                <BanIcon className='size-4' />
              </Button>
            )}
          </div>
        )
      }
    ],
    [list, t]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          {
            icon: <UsersRoundIcon className='size-4' />,
            label: t('manage.users.stats.users'),
            value: list.stats.userCount
          },
          {
            icon: <BanIcon className='size-4' />,
            label: t('manage.users.stats.blocked'),
            value: list.stats.blockedCount
          },
          {
            icon: <CrownIcon className='size-4' />,
            label: t('manage.users.stats.subscribed'),
            value: list.stats.subscribedCount,
            hint: t('manage.users.stats.subscribedHint')
          },
          {
            icon: <ShieldIcon className='size-4' />,
            label: t('manage.users.stats.staff'),
            value: list.stats.staffCount,
            hint: t('manage.users.stats.staffHint')
          }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={t('manage.users.searchPlaceholder')}
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.status}
                  onValueChange={value => list.setFilters({ status: value as typeof list.filters.status })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.status')}>
                    <SelectValue placeholder={t('manage.filters.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allStatuses')}</SelectItem>
                    {USER_STATUS_CODES.map(status => (
                      <SelectItem key={status} value={status}>
                        {t(`manage.statuses.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.role}
                  onValueChange={value => list.setFilters({ role: value as typeof list.filters.role })}
                >
                  <SelectTrigger className='w-32' aria-label={t('manage.filters.role')}>
                    <SelectValue placeholder={t('manage.filters.rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allRoles')}</SelectItem>
                    {ROLE_CODES.map(role => (
                      <SelectItem key={role} value={role}>
                        {t(`manage.roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.subscription}
                  onValueChange={value => list.setFilters({ subscription: value as typeof list.filters.subscription })}
                >
                  <SelectTrigger className='w-36' aria-label={t('manage.filters.subscription')}>
                    <SelectValue placeholder={t('manage.filters.subscriptionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('manage.filters.allPlans')}</SelectItem>
                    <SelectItem value='none'>{t('manage.badges.free')}</SelectItem>
                    {SUBSCRIPTION_CODES.map(code => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />

          <DataTable<AdminUser, UserSortColumn>
            rows={list.users}
            columns={columns}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            getRowId={user => user.uid}
            emptyMessage={t('manage.users.empty')}
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun={t('manage.nouns.users')}
          />
        </div>
      </Card>

      <UserRolesSheet
        user={editingRoles}
        onOpenChange={open => !open && setEditingRoles(null)}
        onSubmit={(roles: RoleCode[]) => {
          if (!editingRoles) {
            return
          }

          list.setRoles(editingRoles.uid, roles)
          toast.success(t('manage.userRolesSheet.toast.saved', { name: editingRoles.username }))
        }}
      />

      <BlockUserDialog
        user={blocking}
        onOpenChange={open => !open && setBlocking(null)}
        onConfirm={reason => {
          if (!blocking) {
            return
          }

          list.blockUser(blocking.uid, reason)
          toast.success(t('manage.users.toast.blocked', { name: blocking.username }))
        }}
      />
    </div>
  )
}
