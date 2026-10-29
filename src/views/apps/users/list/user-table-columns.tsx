'use client'

// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  BrushIcon,
  CrownIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  PencilLineIcon,
  PencilRulerIcon,
  Trash2Icon,
  UserCheckIcon,
  UserRoundIcon,
  UserXIcon
} from 'lucide-react'

// Type Imports
import type { AppUser, UserBilling, UserRole, UserStatus } from '@/types/apps/user-types'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Config Imports
import { getInitialsFromName } from '@/lib/utils'

// Util Imports
import { cn } from '@/lib/utils'

// Hook Imports
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

const ROLE_ICONS: Record<UserRole, ReactNode> = {
  Admin: <UserRoundIcon className='size-4 text-green-600 dark:text-green-400' />,
  Editor: <BrushIcon className='text-chart-2 size-4' />,
  Subscriber: <CrownIcon className='text-chart-5 size-4' />,
  Maintainer: <PencilRulerIcon className='text-chart-3 size-4' />,
  Guest: <PencilLineIcon className='text-chart-1 size-4' />
}

const STATUS_STYLES: Record<UserStatus, string> = {
  Active:
    'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5',
  Pending:
    'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5',
  Suspended:
    'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
  Inactive:
    'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive'
}

const formatBilling = (billing: UserBilling, t: Translate): string => {
  if (billing === 'Auto Debit') {
    return t('users.billingMethods.autoDebit')
  }

  if (billing === 'Credit Card') {
    return t('users.billingMethods.creditCard')
  }

  return t('users.billingMethods.manualPaypal')
}

function UserRowActions({ user }: { user: AppUser }) {
  const { t } = useTranslation()

  return (
    <div className='flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label={t('users.rowActions.viewUser')}
              render={<Link href='/apps/users/view' />}
              nativeButton={false}
            />
          }
        >
          <EyeIcon className='size-4.5' />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('common.view')}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button variant='ghost' size='icon' aria-label={t('users.rowActions.deleteUser')} />}>
          <Trash2Icon className='size-4.5' />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('common.delete')}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size='icon' variant='ghost' aria-label={t('users.rowActions.openActions')} />}
        >
          <EllipsisVerticalIcon className='size-4.5' aria-hidden='true' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <PencilIcon className='size-4' />
              {t('users.rowActions.editUser')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.status !== 'Suspended' ? (
              <DropdownMenuItem>
                <UserXIcon className='size-4' />
                {t('users.rowActions.suspend')}
              </DropdownMenuItem>
            ) : null}
            {user.status !== 'Active' ? (
              <DropdownMenuItem>
                <UserCheckIcon className='size-4' />
                {t('users.rowActions.activate')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive'>
              <Trash2Icon className='size-4' />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// A factory rather than a constant: the header labels have to be re-read when the language changes.
export const getUserTableColumns = (t: Translate): ColumnDef<AppUser>[] => [
  {
    id: 'user',
    header: t('users.columns.user'),
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Avatar className='size-9'>
          {row.original.avatar ? <AvatarImage src={row.original.avatar} alt={row.original.name} /> : null}
          <AvatarFallback className='text-xs'>{getInitialsFromName(row.original.name)}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.name}</span>
          <span className='text-muted-foreground'>{row.original.email}</span>
        </div>
      </div>
    ),
    size: 360,
    enableSorting: true
  },
  {
    id: 'role',
    header: t('users.columns.role'),
    accessorKey: 'role',
    cell: ({ row }) => {
      const role = row.original.role

      return (
        <div className='flex items-center gap-2'>
          {ROLE_ICONS[role]}
          <span>{t(`users.roles.${role}`)}</span>
        </div>
      )
    },
    enableSorting: true
  },
  {
    id: 'plan',
    header: t('users.columns.plan'),
    accessorKey: 'plan',
    cell: ({ row }) => <span className='text-muted-foreground'>{t(`users.plans.${row.original.plan}`)}</span>,
    enableSorting: true
  },
  {
    id: 'billing',
    header: t('users.columns.billing'),
    accessorKey: 'billing',
    cell: ({ row }) => <span className='text-muted-foreground'>{formatBilling(row.original.billing, t)}</span>,
    enableSorting: true
  },
  {
    id: 'status',
    header: t('users.columns.status'),
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.original.status

      return (
        <Badge className={cn('h-auto rounded-sm border-none focus-visible:outline-none', STATUS_STYLES[status])}>
          {t(`users.statuses.${status}`)}
        </Badge>
      )
    },
    enableSorting: true
  },
  {
    id: 'joinedDate',
    header: t('users.columns.joinedDate'),
    accessorKey: 'joinedDate',
    cell: ({ row }) => <span>{format(new Date(row.original.joinedDate), 'dd MMM yyyy')}</span>,
    enableSorting: true
  },
  {
    id: 'actions',
    header: () => t('common.actions'),
    cell: ({ row }) => <UserRowActions user={row.original} />,
    enableHiding: false,
    enableSorting: false
  }
]
