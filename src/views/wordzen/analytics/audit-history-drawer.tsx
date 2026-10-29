'use client'

/**
 * The admin activity history — who changed what in the content and user tools — as a
 * right-hand drawer.
 *
 * It is the template's profile timeline moved into a sheet, so the trail can be opened from
 * any page without losing what is behind it. Each entry names the actor, what they did,
 * the row they did it to (as a link, where the row still exists) and the fields that
 * moved, because "updated a course" on its own answers nothing.
 *
 * The body is a separate component so it only mounts when the sheet opens: the drawer
 * trigger sits in the header on every page, and building the trail is not free.
 */
import type { ReactElement } from 'react'

import Link from 'next/link'

import { HistoryIcon, SearchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine
} from '@/components/ui/timeline'
import { dayHeading, useAuditHistory } from '@/hooks/wordzen/use-audit-history'
import { useTranslation } from '@/lib/i18n'
import type { Translate } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { AuditAction, AuditEntry, AuditFilter } from '@/types/wordzen/audit-types'
import { AUDIT_FILTERS } from '@/types/wordzen/audit-types'

const MINUTE_MS = 60_000

/** How long ago, measured from the trail's own clock. See `useAuditHistory`. */
const relativeTime = (at: string, now: Date, t: Translate) => {
  const minutes = Math.round((now.getTime() - new Date(at).getTime()) / MINUTE_MS)

  if (minutes < 1) {
    return t('audit.justNow')
  }

  if (minutes < 60) {
    return t('audit.minutesAgo', { count: minutes })
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return t('audit.hoursAgo', { count: hours })
  }

  return t('audit.daysAgo', { count: Math.round(hours / 24) })
}

const absoluteTime = (at: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(at))

/**
 * Destructive actions are the ones worth spotting while scrolling, so they get the one
 * colour on the row; the rest stay neutral and are told apart by their label.
 */
const DESTRUCTIVE_ACTIONS: readonly AuditAction[] = ['DELETE', 'REVOKE', 'BLOCK']

export function ActionBadge({ action }: { action: AuditAction }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant={DESTRUCTIVE_ACTIONS.includes(action) ? 'destructive' : action === 'CREATE' ? 'default' : 'secondary'}
      className='text-[11px]'
    >
      {t(`audit.actions.${action}`)}
    </Badge>
  )
}

const dotClassName = (action: AuditAction) =>
  DESTRUCTIVE_ACTIONS.includes(action) ? 'bg-destructive' : action === 'CREATE' ? 'bg-primary' : 'bg-primary/55'

export interface AuditRowProps {
  entry: AuditEntry
  now: Date
  isLast?: boolean

  /** Closes the drawer when a target link is followed. Omitted by the inline panels. */
  closeOnNavigate?: boolean
}

/** One entry. Also used by the dashboards' inline panels. */
export function AuditRow({ entry, now, isLast = false, closeOnNavigate = false }: AuditRowProps) {
  const { t } = useTranslation()

  const targetLink = entry.target.href ? (
    <Link href={entry.target.href} className='truncate font-medium hover:underline'>
      {entry.target.name}
    </Link>
  ) : (
    <span className='text-muted-foreground truncate font-medium line-through' title={t('audit.deletedTarget')}>
      {entry.target.name}
    </span>
  )

  return (
    <TimelineItem status='done' className='gap-x-0'>
      <TimelineDot
        status='custom'
        className='bg-primary/15 flex size-4.5 shrink-0 items-center justify-center rounded-full'
      >
        <span className={cn('size-2.5 rounded-full', dotClassName(entry.action))} />
      </TimelineDot>
      {!isLast && <TimelineLine done className='bg-muted min-h-8' />}

      <TimelineHeading className='flex w-full items-start justify-between gap-3 pt-2 pb-1.5 pl-3 text-sm font-medium text-wrap'>
        <span className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          <ActionBadge action={entry.action} />
          <Badge variant='outline' className='text-[11px] font-normal'>
            {t(`audit.targets.${entry.target.type}`)}
          </Badge>
          {closeOnNavigate && entry.target.href ? <SheetClose render={targetLink} nativeButton={false} /> : targetLink}
        </span>
        <span className='text-muted-foreground shrink-0 text-xs font-normal' title={absoluteTime(entry.at)}>
          {relativeTime(entry.at, now, t)}
        </span>
      </TimelineHeading>

      <TimelineContent className='flex flex-col gap-2 pb-4 pl-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Avatar size='sm'>
            {entry.actor.avatar ? <AvatarImage src={entry.actor.avatar} alt={entry.actor.username} /> : null}
            <AvatarFallback className='text-[10px]'>{entry.actor.initials}</AvatarFallback>
          </Avatar>
          <span className='text-foreground text-sm'>{entry.actor.username}</span>
          <span className='text-muted-foreground text-xs'>{t(`manage.roles.${entry.actor.role}`)}</span>
          {entry.target.context ? (
            <span className='text-muted-foreground truncate text-xs'>· {entry.target.context}</span>
          ) : null}
        </div>

        {entry.changes.length > 0 ? (
          <dl className='flex flex-col gap-1'>
            {entry.changes.map(item => (
              <div key={item.field} className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs'>
                <dt className='text-muted-foreground font-mono'>{item.field}</dt>
                <dd className='flex flex-wrap items-baseline gap-1.5'>
                  {item.from === null ? null : <span className='text-muted-foreground line-through'>{item.from}</span>}
                  {item.from === null || item.to === null ? null : (
                    <span className='text-muted-foreground'>&rarr;</span>
                  )}
                  {item.to === null ? (
                    <span className='text-muted-foreground'>{t('audit.cleared')}</span>
                  ) : (
                    <span className='font-medium'>{item.to}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {entry.summary ? <span className='text-muted-foreground text-sm'>{entry.summary}</span> : null}
      </TimelineContent>
    </TimelineItem>
  )
}

/* -------------------------------------------------------------------------- *
 * Drawer
 * -------------------------------------------------------------------------- */

const FILTER_KEYS: readonly AuditFilter[] = AUDIT_FILTERS

function AuditHistoryBody() {
  const { t } = useTranslation()
  const history = useAuditHistory()

  return (
    <>
      <SheetHeader className='gap-2 border-b p-4 pr-14'>
        <SheetTitle className='text-base'>{t('audit.title')}</SheetTitle>
        <SheetDescription>{t('audit.description')}</SheetDescription>

        <InputGroup className='mt-1'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={history.search}
            onChange={event => history.setSearch(event.target.value)}
            placeholder={t('audit.searchPlaceholder')}
            aria-label={t('audit.searchPlaceholder')}
          />
        </InputGroup>

        {/* Pills rather than tabs: five labels with counts do not fit a tab strip here. */}
        <div className='flex flex-wrap gap-1.5'>
          {FILTER_KEYS.map(key => (
            <Button
              key={key}
              size='xs'
              variant={history.filter === key ? 'secondary' : 'ghost'}
              aria-pressed={history.filter === key}
              onClick={() => history.setFilter(key)}
              className='shrink-0'
            >
              {t(`audit.filters.${key}`)}
              <span className='text-muted-foreground tabular-nums'>{history.counts[key]}</span>
            </Button>
          ))}
        </div>
      </SheetHeader>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='flex flex-col gap-5 p-4'>
          {history.groups.length === 0 ? (
            <p className='text-muted-foreground py-10 text-center text-sm'>{t('audit.empty')}</p>
          ) : (
            history.groups.map(group => {
              const heading = dayHeading(group.day, history.now)

              return (
                <section key={group.day} className='flex flex-col gap-1'>
                  <header className='flex items-baseline gap-2'>
                    <h3 className='text-sm font-semibold'>
                      {heading.label === 'date' ? heading.absolute : t(`audit.${heading.label}`)}
                    </h3>
                    {heading.label === 'date' ? null : (
                      <span className='text-muted-foreground text-xs'>{heading.absolute}</span>
                    )}
                  </header>

                  <Timeline>
                    {group.entries.map((entry, index) => (
                      <AuditRow
                        key={entry.id}
                        entry={entry}
                        now={history.now}
                        isLast={index === group.entries.length - 1}
                        closeOnNavigate
                      />
                    ))}
                  </Timeline>
                </section>
              )
            })
          )}
        </div>
      </ScrollArea>

      <footer className='flex items-center justify-between gap-3 border-t p-4'>
        <span className='text-muted-foreground text-xs'>
          {t('audit.showing', { shown: history.shown, total: history.total })}
        </span>
        {history.hasMore ? (
          <Button variant='outline' size='sm' onClick={history.loadMore}>
            {t('audit.loadMore')}
          </Button>
        ) : null}
      </footer>
    </>
  )
}

export interface AuditHistoryDrawerProps {

  /**
   * The control that opens the drawer, as an element the trigger renders itself as.
   * Defaults to the icon button the header uses.
   */
  trigger?: ReactElement
}

export function AuditHistoryDrawer({ trigger }: AuditHistoryDrawerProps) {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger
        render={
          trigger ?? (
            <Button variant='ghost' size='icon-lg' aria-label={t('audit.open')}>
              <HistoryIcon />
            </Button>
          )
        }
      />

      <SheetContent side='right' className='w-full gap-0 p-0 data-[side=right]:sm:max-w-lg'>
        <AuditHistoryBody />
      </SheetContent>
    </Sheet>
  )
}

export default AuditHistoryDrawer
