'use client'

/**
 * The page header the four dashboards share: title, the layout switcher, the range select
 * and the button that opens the activity drawer.
 *
 * The layout switcher exists because the four are up for comparison — they are the same
 * data in four compositions, and flipping between them is the only honest way to pick one.
 * When a layout is chosen, delete the other three views and their routes, and this
 * switcher goes with them; nothing else here depends on there being four.
 */
import Link from 'next/link'

import { HistoryIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { AnalyticsRange } from '@/types/wordzen/analytics-types'
import { ANALYTICS_RANGES } from '@/types/wordzen/analytics-types'

import { AuditHistoryDrawer } from './audit-history-drawer'

export const DASHBOARD_VARIANTS = [
  { key: 'commandCenter', href: '/dashboard/command-center' },
  { key: 'engagement', href: '/dashboard/engagement' },
  { key: 'timing', href: '/dashboard/timing' },
  { key: 'executive', href: '/dashboard/executive' }
] as const

export type DashboardVariantKey = (typeof DASHBOARD_VARIANTS)[number]['key']

export interface DashboardHeaderProps {
  variant: DashboardVariantKey
  range: AnalyticsRange
  onRangeChange: (range: AnalyticsRange) => void
}

export function DashboardHeader({ variant, range, onRangeChange }: DashboardHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold'>{t('dashboard.title')}</h1>
          <p className='text-muted-foreground text-sm'>
            {t(`dashboard.variantHints.${variant}` as TranslationKey)}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={range} onValueChange={value => onRangeChange(value as AnalyticsRange)}>
            <SelectTrigger className='w-32' aria-label={t('dashboard.rangeLabel')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYTICS_RANGES.map(option => (
                <SelectItem key={option} value={option}>
                  {t(`dashboard.ranges.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AuditHistoryDrawer
            trigger={
              <Button variant='outline'>
                <HistoryIcon />
                {t('dashboard.openActivity')}
              </Button>
            }
          />
        </div>
      </div>

      <nav aria-label={t('dashboard.variantLabel')} className='bg-muted flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg p-[3px]'>
        {DASHBOARD_VARIANTS.map(entry => (
          <Link
            key={entry.key}
            href={entry.href}
            aria-current={entry.key === variant ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors',
              entry.key === variant
                ? 'bg-background text-foreground shadow-sm dark:bg-input/30'
                : 'text-foreground/60 hover:text-foreground'
            )}
          >
            {t(`dashboard.variants.${entry.key}`)}
          </Link>
        ))}
      </nav>
    </header>
  )
}

/** "vs previous 7 days" — the caption every trend pill on the page is measured against. */
export function RangeCaption({ range, className }: { range: AnalyticsRange; className?: string }) {
  const { t } = useTranslation()

  return (
    <p className={cn('text-muted-foreground text-xs', className)}>
      {t('dashboard.vsPrevious', { range: t(`dashboard.ranges.${range}`) })}
    </p>
  )
}

/** The bucket a chart point covers, for the chart's own caption. */
export const bucketKey = (range: AnalyticsRange): TranslationKey => {
  switch (range) {
    case '24h':
      return 'dashboard.buckets.hour'
    case '30d':
      return 'dashboard.buckets.twoDays'
    case '90d':
      return 'dashboard.buckets.fiveDays'
    default:
      return 'dashboard.buckets.day'
  }
}
