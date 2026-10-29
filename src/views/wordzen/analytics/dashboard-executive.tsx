'use client'

/**
 * Layout 4 — executive.
 *
 * Four numbers, one chart, two short lists. Everything that is not load-bearing for the
 * question "is usage going up, and what are people using" has been dropped, including the
 * bars behind the rankings: at five rows the numbers are directly comparable and the bar
 * is decoration.
 *
 * Defaults to 30 days, because the point of this layout is the trend rather than today.
 */
import type { ReactNode } from 'react'

import { useAnalytics } from '@/hooks/wordzen/use-analytics'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/lib/i18n'

import { TrafficChart } from './charts'
import { bucketKey, DashboardHeader, RangeCaption } from './dashboard-chrome'
import { formatCount, formatDuration, formatExact, formatPercent } from './format'
import { AreaBadge, ElementKindBadge, FunnelBars, MetricLine, PlatformRows, SectionCard } from './widgets'

const TOP_N = 5

type TopRow = {
  id: string
  label: string
  sublabel?: ReactNode
  value: string
}

/** Rank, name, figure. No bar: five right-aligned numbers compare themselves. */
function TopList({ rows }: { rows: TopRow[] }) {
  return (
    <ol className='flex flex-col'>
      {rows.map((row, index) => (
        <li
          key={row.id}
          className='flex items-baseline justify-between gap-3 border-b py-2.5 last:border-b-0 last:pb-0'
        >
          <span className='flex min-w-0 items-baseline gap-2.5'>
            <span className='text-muted-foreground w-3 shrink-0 text-xs tabular-nums'>{index + 1}</span>
            <span className='truncate text-sm font-medium'>{row.label}</span>
            {row.sublabel}
          </span>
          <span className='shrink-0 text-sm font-semibold tabular-nums'>{row.value}</span>
        </li>
      ))}
    </ol>
  )
}

export function ExecutiveDashboard() {
  const { t } = useTranslation()
  const analytics = useAnalytics('30d')

  const { summary, screens, elements, timeline } = analytics

  return (
    <div className='flex flex-col gap-8'>
      <DashboardHeader variant='executive' range={analytics.range} onRangeChange={analytics.setRange} />

      <section className='flex flex-col gap-6'>
        <div className='grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4'>
          <MetricLine
            label={t('dashboard.metrics.activeUsers')}
            value={formatCount(summary.activeUsers.value)}
            hint={t('dashboard.metricHints.activeUsers')}
            changePct={summary.activeUsers.changePct}
          />
          <MetricLine
            label={t('dashboard.metrics.interactions')}
            value={formatCount(summary.interactions.value)}
            hint={t('dashboard.metricHints.interactions')}
            changePct={summary.interactions.changePct}
          />
          <MetricLine
            label={t('dashboard.metrics.perSession')}
            value={formatExact(summary.interactionsPerSession.value)}
            hint={t('dashboard.metricHints.perSession')}
            changePct={summary.interactionsPerSession.changePct}
          />
          <MetricLine
            label={t('dashboard.metrics.avgSession')}
            value={formatDuration(summary.avgSessionSeconds.value)}
            hint={t('dashboard.metricHints.avgSession')}
            changePct={summary.avgSessionSeconds.changePct}
          />
        </div>
        <Separator />
        <RangeCaption range={analytics.range} />
      </section>

      <SectionCard
        title={t('dashboard.sections.traffic')}
        hint={t('dashboard.sectionHints.traffic', { bucket: t(bucketKey(analytics.range)) })}
        contentClassName='pt-2'
      >
        <TrafficChart points={timeline} className='aspect-auto h-80 w-full' />
      </SectionCard>

      <div className='grid items-start gap-6 lg:grid-cols-2'>
        <div className='flex flex-col gap-6'>
          <SectionCard title={t('dashboard.sections.topScreens')} hint={t('dashboard.sectionHints.topScreens')}>
            <TopList
              rows={screens.slice(0, TOP_N).map(screen => ({
                id: screen.key,
                label: screen.name,
                sublabel: <AreaBadge area={screen.area} />,
                value: formatCount(screen.views)
              }))}
            />
          </SectionCard>

          <SectionCard title={t('dashboard.sections.topElements')} hint={t('dashboard.sectionHints.topElements')}>
            <TopList
              rows={elements.slice(0, TOP_N).map(element => ({
                id: element.id,
                label: element.name,
                sublabel: <ElementKindBadge kind={element.kind} />,
                value: formatCount(element.clicks)
              }))}
            />
          </SectionCard>
        </div>

        <div className='flex flex-col gap-6'>
          <SectionCard title={t('dashboard.sections.funnel')} hint={t('dashboard.sectionHints.funnel')}>
            <FunnelBars steps={analytics.funnel} />
          </SectionCard>

          <SectionCard title={t('dashboard.sections.platforms')} hint={t('dashboard.sectionHints.platforms')}>
            <PlatformRows platforms={analytics.platforms} />
            <p className='text-muted-foreground mt-4 text-xs'>
              {t('dashboard.metrics.errorRate')} · {formatPercent(summary.errorRate.value, 2)}
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default ExecutiveDashboard
