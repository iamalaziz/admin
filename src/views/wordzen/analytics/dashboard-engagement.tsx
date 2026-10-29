'use client'

/**
 * Layout 2 — engagement.
 *
 * The working view rather than the overview: the full catalogue in sortable, searchable,
 * paged tables, with the funnel and the supporting splits in a rail beside it. Nothing is
 * truncated to a top ten, which is the point — the interesting rows in a usage report are
 * often at the bottom.
 *
 * Columns carry an `accessorFn` so the shared `DataTable` can sort on them; the sorting
 * itself happens in `use-analytics-tables` against the whole set, not the visible page.
 */
import { useMemo } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/hooks/wordzen/use-analytics'
import { useElementTable, useScreenTable } from '@/hooks/wordzen/use-analytics-tables'
import { useTranslation } from '@/lib/i18n'
import type { ElementStat, ScreenStat } from '@/types/wordzen/analytics-types'

import { DataTable } from '../shared/data-table'
import { TablePagination, TableToolbar } from '../shared/table-chrome'
import { DashboardHeader, RangeCaption } from './dashboard-chrome'
import { formatCount, formatDuration, formatExact, formatPercent, formatRate } from './format'
import {
  AreaBadge,
  ElementKindBadge,
  FunnelBars,
  PlatformRows,
  RankedBars,
  RoutePath,
  SectionCard,
  TrendPill
} from './widgets'

export function EngagementDashboard() {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  const screenTable = useScreenTable(analytics.screens)
  const elementTable = useElementTable(analytics.elements)

  const maxAreaViews = analytics.areas[0]?.views ?? 1

  const screenColumns = useMemo<ColumnDef<ScreenStat>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name,
        header: t('dashboard.columns.screen'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='truncate font-medium'>{row.original.name}</span>
            <RoutePath path={row.original.path} />
          </div>
        )
      },
      {
        id: 'area',
        accessorFn: row => row.area,
        header: t('dashboard.columns.area'),
        cell: ({ row }) => <AreaBadge area={row.original.area} />
      },
      {
        id: 'views',
        accessorFn: row => row.views,
        header: t('dashboard.columns.views'),
        cell: ({ row }) => <span className='font-medium tabular-nums'>{formatExact(row.original.views)}</span>
      },
      {
        id: 'uniqueUsers',
        accessorFn: row => row.uniqueUsers,
        header: t('dashboard.columns.uniqueUsers'),
        cell: ({ row }) => <span className='tabular-nums'>{formatExact(row.original.uniqueUsers)}</span>
      },
      {
        id: 'avgSeconds',
        accessorFn: row => row.avgSeconds,
        header: t('dashboard.columns.avgTime'),
        cell: ({ row }) => (
          <span className='text-muted-foreground tabular-nums'>{formatDuration(row.original.avgSeconds)}</span>
        )
      },
      {
        id: 'exitRate',
        accessorFn: row => row.exitRate,
        header: t('dashboard.columns.exitRate'),
        cell: ({ row }) => (
          <span className='text-muted-foreground tabular-nums'>{formatPercent(row.original.exitRate, 0)}</span>
        )
      },
      {
        id: 'changePct',
        accessorFn: row => row.changePct,
        header: t('dashboard.columns.change'),
        cell: ({ row }) => <TrendPill changePct={row.original.changePct} className='text-xs' />
      }
    ],
    [t]
  )

  const elementColumns = useMemo<ColumnDef<ElementStat>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name,
        header: t('dashboard.columns.element'),
        cell: ({ row }) => (
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{row.original.name}</span>
            <span className='text-muted-foreground truncate text-xs'>{row.original.screenName}</span>
          </div>
        )
      },
      {
        id: 'kind',
        accessorFn: row => row.kind,
        header: t('dashboard.columns.kind'),
        cell: ({ row }) => <ElementKindBadge kind={row.original.kind} />
      },
      {
        id: 'clicks',
        accessorFn: row => row.clicks,
        header: t('dashboard.columns.clicks'),
        cell: ({ row }) => <span className='font-medium tabular-nums'>{formatExact(row.original.clicks)}</span>
      },
      {
        id: 'uniqueUsers',
        accessorFn: row => row.uniqueUsers,
        header: t('dashboard.columns.uniqueUsers'),
        cell: ({ row }) => <span className='tabular-nums'>{formatExact(row.original.uniqueUsers)}</span>
      },
      {
        id: 'clickRate',
        accessorFn: row => row.clickRate,
        header: t('dashboard.columns.clickRate'),
        cell: ({ row }) => (
          <span className='text-muted-foreground tabular-nums'>{formatRate(row.original.clickRate)}</span>
        )
      },
      {
        id: 'changePct',
        accessorFn: row => row.changePct,
        header: t('dashboard.columns.change'),
        cell: ({ row }) => <TrendPill changePct={row.original.changePct} className='text-xs' />
      }
    ],
    [t]
  )

  return (
    <div className='flex flex-col gap-6'>
      <DashboardHeader variant='engagement' range={analytics.range} onRangeChange={analytics.setRange} />

      <div className='grid items-start gap-6 xl:grid-cols-3'>
        <Tabs defaultValue='screens' className='gap-4 xl:col-span-2'>
          <TabsList>
            <TabsTrigger value='screens'>{t('dashboard.tabs.screens')}</TabsTrigger>
            <TabsTrigger value='controls'>{t('dashboard.tabs.controls')}</TabsTrigger>
            <TabsTrigger value='areas'>{t('dashboard.tabs.areas')}</TabsTrigger>
          </TabsList>

          <TabsContent value='screens'>
            <Card className='w-full gap-0 py-0'>
              <TableToolbar
                search={screenTable.search}
                onSearchChange={screenTable.setSearch}
                searchPlaceholder={t('dashboard.searchScreens')}
                rowsPerPage={screenTable.rowsPerPage}
                onRowsPerPageChange={screenTable.setRowsPerPage}
              />
              <DataTable
                rows={screenTable.rows}
                columns={screenColumns}
                sorting={screenTable.sorting}
                onSortingChange={screenTable.setSorting}
                getRowId={row => row.key}
              />
              <TablePagination
                showingFrom={screenTable.showingFrom}
                showingTo={screenTable.showingTo}
                total={screenTable.total}
                page={screenTable.page}
                totalPages={screenTable.totalPages}
                onPageChange={screenTable.setPage}
                noun={t('manage.nouns.screens')}
              />
            </Card>
          </TabsContent>

          <TabsContent value='controls'>
            <Card className='w-full gap-0 py-0'>
              <TableToolbar
                search={elementTable.search}
                onSearchChange={elementTable.setSearch}
                searchPlaceholder={t('dashboard.searchElements')}
                rowsPerPage={elementTable.rowsPerPage}
                onRowsPerPageChange={elementTable.setRowsPerPage}
              />
              <DataTable
                rows={elementTable.rows}
                columns={elementColumns}
                sorting={elementTable.sorting}
                onSortingChange={elementTable.setSorting}
                getRowId={row => row.id}
              />
              <TablePagination
                showingFrom={elementTable.showingFrom}
                showingTo={elementTable.showingTo}
                total={elementTable.total}
                page={elementTable.page}
                totalPages={elementTable.totalPages}
                onPageChange={elementTable.setPage}
                noun={t('manage.nouns.controls')}
              />
            </Card>
          </TabsContent>

          <TabsContent value='areas'>
            <SectionCard title={t('dashboard.sections.areas')} hint={t('dashboard.sectionHints.areas')}>
              <RankedBars
                items={analytics.areas.map(entry => ({
                  id: entry.area,
                  label: t(`dashboard.areaNames.${entry.area}`),
                  value: entry.views,
                  share: entry.views / maxAreaViews,
                  trailing: (
                    <span className='text-muted-foreground text-xs tabular-nums'>{formatPercent(entry.share, 1)}</span>
                  )
                }))}
              />
            </SectionCard>
          </TabsContent>
        </Tabs>

        <div className='flex flex-col gap-6'>
          <SectionCard title={t('dashboard.sections.funnel')} hint={t('dashboard.sectionHints.funnel')}>
            <FunnelBars steps={analytics.funnel} />
          </SectionCard>

          <SectionCard
            title={t('dashboard.metrics.interactions')}
            hint={t('dashboard.metricHints.interactions')}
            contentClassName='flex flex-col gap-4'
          >
            <div className='flex items-baseline justify-between gap-3'>
              <span className='text-3xl font-semibold tabular-nums'>
                {formatCount(analytics.summary.interactions.value)}
              </span>
              <TrendPill changePct={analytics.summary.interactions.changePct} />
            </div>
            <dl className='flex flex-col gap-2 text-sm'>
              <div className='flex items-baseline justify-between gap-3'>
                <dt className='text-muted-foreground'>{t('dashboard.metrics.perSession')}</dt>
                <dd className='font-medium tabular-nums'>
                  {formatExact(analytics.summary.interactionsPerSession.value)}
                </dd>
              </div>
              <div className='flex items-baseline justify-between gap-3'>
                <dt className='text-muted-foreground'>{t('dashboard.metrics.avgSession')}</dt>
                <dd className='font-medium tabular-nums'>
                  {formatDuration(analytics.summary.avgSessionSeconds.value)}
                </dd>
              </div>
              <div className='flex items-baseline justify-between gap-3'>
                <dt className='text-muted-foreground'>{t('dashboard.metrics.errorRate')}</dt>
                <dd className='font-medium tabular-nums'>{formatPercent(analytics.summary.errorRate.value, 2)}</dd>
              </div>
            </dl>
            <RangeCaption range={analytics.range} />
          </SectionCard>

          <SectionCard title={t('dashboard.sections.platforms')} hint={t('dashboard.sectionHints.platforms')}>
            <PlatformRows platforms={analytics.platforms} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default EngagementDashboard
