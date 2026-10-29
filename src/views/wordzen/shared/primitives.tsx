'use client'

import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslation } from '@/lib/i18n'
import type { CourseAccessCode, LocaleCode } from '@/types/wordzen/content-types'
import type { RoleCode, UserStatusCode } from '@/types/wordzen/user-types'
import { primaryRole } from '@/types/wordzen/user-types'

/** `true`/`false` on `isPublic`, phrased the way the API means it. */
export function PublishedBadge({ isPublic }: { isPublic: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge variant={isPublic ? 'default' : 'outline'}>
      {isPublic ? t('manage.badges.public') : t('manage.badges.draft')}
    </Badge>
  )
}

/** `CourseAccessCode` — FREE is unremarkable, the paid tiers should stand out. */
export function AccessBadge({ accessCode }: { accessCode: CourseAccessCode }) {
  return <Badge variant={accessCode === 'FREE' ? 'outline' : 'secondary'}>{accessCode}</Badge>
}

export function LocaleBadge({ locale }: { locale: LocaleCode }) {
  return (
    <Badge variant='outline' className='font-mono text-[11px]'>
      {locale}
    </Badge>
  )
}

/**
 * `Achievement.active`. An inactive achievement is not deleted: it stays in the table with
 * its grants and drops out of every endpoint that filters on the flag.
 */
export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge variant={active ? 'default' : 'outline'}>
      {active ? t('manage.badges.active') : t('manage.badges.inactive')}
    </Badge>
  )
}

/** The account's most privileged role — ROLE_USER is unremarkable, staff should stand out. */
export function UserRoleBadge({ roles }: { roles: RoleCode[] }) {
  const { t } = useTranslation()

  const role = primaryRole(roles)

  return <Badge variant={role === 'ROLE_USER' ? 'outline' : 'secondary'}>{t(`manage.roles.${role}`)}</Badge>
}

export function UserStatusBadge({ status }: { status: UserStatusCode }) {
  const { t } = useTranslation()

  return <Badge variant={status === 'BLOCKED' ? 'destructive' : 'secondary'}>{t(`manage.statuses.${status}`)}</Badge>
}

/**
 * A stored file path (`cover`, `image`). The API holds a path from the manager file
 * service, not a URL, so there is nothing to render as an image here — showing the path
 * is both honest and the thing an admin actually needs to check.
 */
export function FilePathCell({ path, emptyLabel }: { path: string | null; emptyLabel?: string }) {
  const { t } = useTranslation()

  if (!path) {
    return <span className='text-muted-foreground text-sm'>{emptyLabel ?? t('manage.badges.none')}</span>
  }

  return (
    <code className='bg-muted text-muted-foreground max-w-56 truncate rounded px-1.5 py-0.5 text-xs' title={path}>
      {path}
    </code>
  )
}

export type StatCardItem = {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}

/**
 * The stat row the manage pages open with. The icon badge matches the dashboard's
 * `MetricTile`, so a figure reads the same on either side of the panel; it is optional
 * because the icon only ever restates the label and must not be load-bearing.
 */
export function StatCards({ items }: { items: StatCardItem[] }) {
  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6'>
      {items.map(item => (
        <Card key={item.label} className='shadow-none'>
          <CardContent className='flex flex-col gap-1'>
            <span className='text-muted-foreground flex items-center gap-2 text-sm'>
              {item.icon ? (
                <span
                  aria-hidden
                  className='bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-sm'
                >
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </span>
            <span className='text-2xl font-semibold'>{item.value}</span>
            {item.hint ? <span className='text-muted-foreground text-xs'>{item.hint}</span> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => void
}

/**
 * Delete confirmation. Deletes in the manager API remove the row outright
 * (`ManagerCourseDao.delete` hard-deletes), and a course takes its modules and cards with
 * it, so the copy has to say what is actually about to disappear.
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant='outline' type='button'>
                {t('common.cancel')}
              </Button>
            }
            nativeButton={false}
          />
          <Button
            variant='destructive'
            type='button'
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel ?? t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** A short label/value pair for the detail panels. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex flex-wrap items-baseline justify-between gap-2 py-2'>
      <span className='text-muted-foreground text-sm'>{label}</span>
      <span className='text-right text-sm font-medium'>{children}</span>
    </div>
  )
}

/** `createdAt`/`blockedAt` rendering. Fixed locale and UTC so SSR and hydration agree. */
export function Timestamp({ value, withTime = false }: { value: string | null; withTime?: boolean }) {
  if (!value) {
    return <span className='text-muted-foreground'>-</span>
  }

  const date = new Date(value)

  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date)

  return <span title={value}>{formatted}</span>
}
