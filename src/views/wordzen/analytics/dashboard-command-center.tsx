'use client'

/**
 * Layout 1 — command center.
 *
 * The conventional analytics shape, and the safest default: a KPI row, one large chart
 * underneath it, then the two rankings the brief actually asks for (most viewed screens,
 * most used controls) side by side, and a strip of supporting breakdowns at the bottom.
 *
 * Reads top to bottom in decreasing resolution, so a glance at the top is enough on a day
 * when nothing moved.
 */
import { EyeIcon, MousePointerClickIcon, RepeatIcon, UsersRoundIcon } from 'lucide-react'

import { useAnalytics } from '@/hooks/wordzen/use-analytics'
import { useTranslation } from '@/lib/i18n'

import { Sparkline, TrafficChart } from './charts'
import { bucketKey, DashboardHeader, RangeCaption } from './dashboard-chrome'
import { countFormatFor, formatPercent, formatRate } from './format'
import { AreaBadge, CountryRows, ElementKindBadge, MetricTile, PlatformRows, RankedBars, SectionCard } from './widgets'

const TOP_N = 8

export function CommandCenterDashboard() {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  const { summary, screens, elements, timeline, eventMix, platforms, countries } = analytics

  const topScreens = screens.slice(0, TOP_N)
  const topElements = elements.slice(0, TOP_N)

  const maxScreenViews = topScreens[0]?.views ?? 1
  const maxElementClicks = topElements[0]?.clicks ?? 1
  const maxEventCount = eventMix[0]?.count ?? 1

  return (
    <div className='flex flex-col gap-6'>
      <DashboardHeader variant='commandCenter' range={analytics.range} onRangeChange={analytics.setRange} />

      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricTile
          icon={<EyeIcon className='size-4' />}
          label={t('dashboard.metrics.screenViews')}
          value={summary.screenViews.value}
          format={countFormatFor(summary.screenViews.value)}
          hint={t('dashboard.metricHints.screenViews')}
          changePct={summary.screenViews.changePct}
          footer={<Sparkline data={timeline.map(point => point.views)} label={t('dashboard.legend.views')} />}
        />
        <MetricTile
          icon={<MousePointerClickIcon className='size-4' />}
          label={t('dashboard.metrics.interactions')}
          value={summary.interactions.value}
          format={countFormatFor(summary.interactions.value)}
          hint={t('dashboard.metricHints.interactions')}
          changePct={summary.interactions.changePct}
          footer={
            <Sparkline data={timeline.map(point => point.interactions)} label={t('dashboard.legend.interactions')} />
          }
        />
        <MetricTile
          icon={<UsersRoundIcon className='size-4' />}
          label={t('dashboard.metrics.activeUsers')}
          value={summary.activeUsers.value}
          format={countFormatFor(summary.activeUsers.value)}
          hint={t('dashboard.metricHints.activeUsers')}
          changePct={summary.activeUsers.changePct}
          footer={
            <Sparkline
              data={timeline.map(point => point.sessions)}
              label={t('dashboard.legend.sessions')}
              variant='bars'
            />
          }
        />
        <MetricTile
          icon={<RepeatIcon className='size-4' />}
          label={t('dashboard.metrics.perSession')}
          value={summary.interactionsPerSession.value}
          format={countFormatFor(summary.interactionsPerSession.value)}
          hint={t('dashboard.metricHints.perSession')}
          changePct={summary.interactionsPerSession.changePct}
          footer={<RangeCaption range={analytics.range} />}
        />
      </div>

      <SectionCard
        title={t('dashboard.sections.traffic')}
        hint={t('dashboard.sectionHints.traffic', { bucket: t(bucketKey(analytics.range)) })}
      >
        <TrafficChart points={timeline} />
      </SectionCard>

      <div className='grid gap-6 lg:grid-cols-2'>
        <SectionCard title={t('dashboard.sections.topScreens')} hint={t('dashboard.sectionHints.topScreens')}>
          <RankedBars
            numbered
            items={topScreens.map(screen => ({
              id: screen.key,
              label: screen.name,
              sublabel: <AreaBadge area={screen.area} />,
              value: screen.views,
              share: screen.views / maxScreenViews,
              changePct: screen.changePct
            }))}
          />
        </SectionCard>

        <SectionCard title={t('dashboard.sections.topElements')} hint={t('dashboard.sectionHints.topElements')}>
          <RankedBars
            numbered
            items={topElements.map(element => ({
              id: element.id,
              label: element.name,
              sublabel: <ElementKindBadge kind={element.kind} />,
              value: element.clicks,
              share: element.clicks / maxElementClicks,
              changePct: element.changePct,
              trailing: (
                <span className='text-muted-foreground text-xs tabular-nums' title={t('dashboard.columns.clickRate')}>
                  {formatRate(element.clickRate)}
                </span>
              )
            }))}
          />
        </SectionCard>
      </div>

      {/* Three supporting splits: what happened, on what, and where. */}
      <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
        <SectionCard title={t('dashboard.sections.eventMix')} hint={t('dashboard.sectionHints.eventMix')}>
          <RankedBars
            items={eventMix.map(slice => ({
              id: slice.type,
              label: t(`dashboard.eventTypes.${slice.type}`),
              value: slice.count,
              share: slice.count / maxEventCount,
              trailing: (
                <span className='text-muted-foreground text-xs tabular-nums'>{formatPercent(slice.share, 1)}</span>
              )
            }))}
          />
        </SectionCard>

        <SectionCard title={t('dashboard.sections.platforms')} hint={t('dashboard.sectionHints.platforms')}>
          <PlatformRows platforms={platforms} />
        </SectionCard>

        <SectionCard title={t('dashboard.sections.countries')} hint={t('dashboard.sectionHints.countries')}>
          <CountryRows countries={countries} limit={TOP_N} />
        </SectionCard>
      </div>
    </div>
  )
}

export default CommandCenterDashboard
