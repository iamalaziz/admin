'use client'

/**
 * Layout 3 — timing.
 *
 * Leads with *when* rather than *how much*: the weekday x hour heatmap is the first thing
 * on the page, because the decisions it informs (when to send a reminder, when to deploy,
 * when a drop is just Saturday) are not answerable from a total.
 *
 * The rankings below it are deliberately the ones the other layouts do not lead with —
 * attention and exits rather than raw volume — so this one is a different reading of the
 * same data, not a reshuffle of the same cards.
 */
import { AlertTriangleIcon, ClockIcon, LogInIcon } from 'lucide-react'

import { useAnalytics } from '@/hooks/wordzen/use-analytics'
import { useTranslation } from '@/lib/i18n'

import { SessionsChart } from './charts'
import { bucketKey, DashboardHeader, RangeCaption } from './dashboard-chrome'
import { formatCount, formatDuration, formatPercent } from './format'
import { AreaBadge, ElementKindBadge, FunnelBars, HourHeatmap, MetricTile, RankedBars, SectionCard } from './widgets'

const TOP_N = 6

export function TimingDashboard() {
  const { t } = useTranslation()
  const analytics = useAnalytics('30d')

  const { summary, screens, elements, hourMatrix, timeline } = analytics

  // Attention and exits are only meaningful where there is traffic to average over, so
  // both rankings are drawn from the screens that actually see use.
  const busiest = screens.slice(0, 16)

  const byAttention = [...busiest].sort((a, b) => b.avgSeconds - a.avgSeconds).slice(0, TOP_N)
  const byExits = [...busiest].sort((a, b) => b.exitRate - a.exitRate).slice(0, TOP_N)
  const leastUsed = [...elements].sort((a, b) => a.clicks - b.clicks).slice(0, TOP_N)

  const maxAttention = byAttention[0]?.avgSeconds ?? 1
  const maxExit = byExits[0]?.exitRate ?? 1
  const maxLeastUsed = leastUsed[leastUsed.length - 1]?.clicks ?? 1

  return (
    <div className='flex flex-col gap-6'>
      <DashboardHeader variant='timing' range={analytics.range} onRangeChange={analytics.setRange} />

      <div className='grid gap-6 sm:grid-cols-3'>
        <MetricTile
          icon={<LogInIcon className='size-4' />}
          label={t('dashboard.metrics.sessions')}
          value={formatCount(summary.sessions.value)}
          hint={t('dashboard.metricHints.sessions')}
          changePct={summary.sessions.changePct}
          footer={<RangeCaption range={analytics.range} />}
        />
        <MetricTile
          icon={<ClockIcon className='size-4' />}
          label={t('dashboard.metrics.avgSession')}
          value={formatDuration(summary.avgSessionSeconds.value)}
          hint={t('dashboard.metricHints.avgSession')}
          changePct={summary.avgSessionSeconds.changePct}
          footer={<RangeCaption range={analytics.range} />}
        />
        <MetricTile
          icon={<AlertTriangleIcon className='size-4' />}
          label={t('dashboard.metrics.errorRate')}
          value={formatPercent(summary.errorRate.value, 2)}
          hint={t('dashboard.metricHints.errorRate')}
          changePct={summary.errorRate.changePct}
          invertedChange
          footer={<RangeCaption range={analytics.range} />}
        />
      </div>

      {/* The hero of this layout, so it gets the full width: 24 hourly columns need it. */}
      <SectionCard
        title={t('dashboard.sections.hourMatrix')}
        hint={t('dashboard.sectionHints.hourMatrix', { days: hourMatrix.days })}
      >
        <HourHeatmap cells={hourMatrix.cells} peak={hourMatrix.peak} />
      </SectionCard>

      <SectionCard
        title={t('dashboard.legend.sessions')}
        hint={t('dashboard.sectionHints.traffic', { bucket: t(bucketKey(analytics.range)) })}
      >
        <SessionsChart points={timeline} />
      </SectionCard>

      <div className='grid gap-6 lg:grid-cols-2'>
        <SectionCard title={t('dashboard.sections.attention')} hint={t('dashboard.sectionHints.attention')}>
          <RankedBars
            formatValue={formatDuration}
            items={byAttention.map(screen => ({
              id: screen.key,
              label: screen.name,
              sublabel: <AreaBadge area={screen.area} />,
              value: screen.avgSeconds,
              share: screen.avgSeconds / maxAttention
            }))}
          />
        </SectionCard>

        <SectionCard title={t('dashboard.sections.exits')} hint={t('dashboard.sectionHints.exits')}>
          <RankedBars
            formatValue={value => formatPercent(value, 0)}
            items={byExits.map(screen => ({
              id: screen.key,
              label: screen.name,
              sublabel: <AreaBadge area={screen.area} />,
              value: screen.exitRate,
              share: screen.exitRate / maxExit,
              trailing: <span className='text-muted-foreground text-xs tabular-nums'>{formatCount(screen.views)}</span>
            }))}
          />
        </SectionCard>
      </div>

      <div className='grid items-start gap-6 lg:grid-cols-2'>
        <SectionCard title={t('dashboard.sections.leastUsed')} hint={t('dashboard.sectionHints.leastUsed')}>
          <RankedBars
            items={leastUsed.map(element => ({
              id: element.id,
              label: element.name,
              sublabel: <ElementKindBadge kind={element.kind} />,
              value: element.clicks,
              share: element.clicks / maxLeastUsed
            }))}
          />
        </SectionCard>

        <SectionCard title={t('dashboard.sections.funnel')} hint={t('dashboard.sectionHints.funnel')}>
          <FunnelBars steps={analytics.funnel} />
        </SectionCard>
      </div>
    </div>
  )
}

export default TimingDashboard
