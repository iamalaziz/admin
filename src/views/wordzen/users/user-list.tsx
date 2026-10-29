'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import type { ColumnDef } from '@tanstack/react-table'
import { BanIcon, CircleCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserSortColumn } from '@/hooks/wordzen/use-user-list'
import { useUserList } from '@/hooks/wordzen/use-user-list'
import type { AdminUser } from '@/types/wordzen/user-types'
import { ROLE_CODES, ROLE_LABELS, SUBSCRIPTION_CODES, USER_STATUS_CODES } from '@/types/wordzen/user-types'

import { DataTable } from '../shared/data-table'
import { StatCards, Timestamp, UserStatusBadge } from '../shared/primitives'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { BlockUserDialog } from './block-user-dialog'

export function UserList() {
  const list = useUserList()
  const [blocking, setBlocking] = useState<AdminUser | null>(null)

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'username',
        header: 'User',
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
        header: 'Roles',
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {row.original.roles.map(role => (
              <Badge key={role} variant={role === 'ROLE_USER' ? 'outline' : 'secondary'}>
                {ROLE_LABELS[role]}
              </Badge>
            ))}
          </div>
        )
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />
      },
      {
        id: 'subscription',
        header: 'Subscription',
        cell: ({ row }) =>
          row.original.subscription ? (
            <div className='flex flex-col'>
              <span className='text-sm'>{row.original.subscription.code}</span>
              <span className='text-muted-foreground text-xs'>
                until <Timestamp value={row.original.subscription.endSubscriptionDate} />
              </span>
            </div>
          ) : (
            <span className='text-muted-foreground text-sm'>Free</span>
          )
      },
      {
        id: 'created',
        header: 'Joined',
        cell: ({ row }) => (
          <span className='text-muted-foreground text-sm'>
            <Timestamp value={row.original.createdAt} />
          </span>
        )
      },
      {
        id: 'actions',
        header: () => <span className='sr-only'>Actions</span>,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === 'BLOCKED' ? (
            <div className='flex justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  list.unblockUser(row.original.uid)
                  toast.success(`${row.original.username} unblocked`)
                }}
              >
                <CircleCheckIcon className='size-4' />
                Unblock
              </Button>
            </div>
          ) : (
            <div className='flex justify-end'>
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground hover:text-destructive'
                onClick={() => setBlocking(row.original)}
              >
                <BanIcon className='size-4' />
                Block
              </Button>
            </div>
          )
      }
    ],
    [list]
  )

  return (
    <div className='flex flex-col gap-3 lg:gap-6'>
      <StatCards
        items={[
          { label: 'Users', value: list.stats.userCount },
          { label: 'Blocked', value: list.stats.blockedCount },
          { label: 'Subscribed', value: list.stats.subscribedCount, hint: 'BASIC or PRO' },
          { label: 'Staff', value: list.stats.staffCount, hint: 'Author or admin' }
        ]}
      />

      <Card className='py-0 shadow-none'>
        <div className='w-full'>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder='Search username, email or uid'
            rowsPerPage={list.rowsPerPage}
            onRowsPerPageChange={list.setRowsPerPage}
            filters={
              <>
                <Select
                  value={list.filters.status}
                  onValueChange={value => list.setFilters({ status: value as typeof list.filters.status })}
                >
                  <SelectTrigger className='w-32' aria-label='Filter by status'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All statuses</SelectItem>
                    {USER_STATUS_CODES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.role}
                  onValueChange={value => list.setFilters({ role: value as typeof list.filters.role })}
                >
                  <SelectTrigger className='w-32' aria-label='Filter by role'>
                    <SelectValue placeholder='Role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All roles</SelectItem>
                    {ROLE_CODES.map(role => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={list.filters.subscription}
                  onValueChange={value => list.setFilters({ subscription: value as typeof list.filters.subscription })}
                >
                  <SelectTrigger className='w-36' aria-label='Filter by subscription'>
                    <SelectValue placeholder='Subscription' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any plan</SelectItem>
                    <SelectItem value='none'>Free</SelectItem>
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
            emptyMessage='No users match these filters.'
          />

          <TablePagination
            showingFrom={list.showingFrom}
            showingTo={list.showingTo}
            total={list.total}
            page={list.page}
            totalPages={list.totalPages}
            onPageChange={list.setPage}
            noun='users'
          />
        </div>
      </Card>

      <BlockUserDialog
        user={blocking}
        onOpenChange={open => !open && setBlocking(null)}
        onConfirm={reason => {
          if (!blocking) {
            return
          }

          list.blockUser(blocking.uid, reason)
          toast.success(`${blocking.username} blocked`)
        }}
      />
    </div>
  )
}
