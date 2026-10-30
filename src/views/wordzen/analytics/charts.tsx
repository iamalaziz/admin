'use client'

/**
 * The recharts-backed widgets.
 *
 * Both series on the headline chart are event counts, so they share one y-axis — a second
 * scale would let any pair of lines be made to cross wherever the author liked. Sessions
 * are an order of magnitude smaller and get their own chart rather than a right-hand axis.
 */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { useTranslation } from '@/lib/i18n'
import type { TimelinePoint } from '@/types/wordzen/analytics-types'

import { formatCount } from './format'

/* -------------------------------------------------------------------------- *
 * Sparkline
 * -------------------------------------------------------------------------- */

export interface SparklineProps {
  data: number[]

  /** Names the series in the tooltip. */
  label: string

  variant?: 'area' | 'bars'
  className?: string
}

/**
 * A single series at tile size: no axes, no legend, no grid.
 *
 * It is there for the shape, so the only reading it has to support is "rising, falling or
 * flat" plus a hover for the exact value. The figure beside it carries the magnitude.
 */
export function Sparkline({ data, label, variant = 'area', className }: SparklineProps) {
  const points = data.map((value, index) => ({ index, value }))

  const config = { value: { label, color: 'var(--primary)' } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className={className ?? 'aspect-auto h-10 w-full'}>
      {variant === 'bars' ? (
        <BarChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          {/* Bars keep the zero baseline: their length is the reading, unlike a line's slope. */}
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className='min-w-0' />} />
          <Bar dataKey='value' fill='var(--color-value)' radius={2} maxBarSize={6} />
        </BarChart>
      ) : (
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${label.replace(/\W/g, '')}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='var(--color-value)' stopOpacity={0.3} />
              <stop offset='100%' stopColor='var(--color-value)' stopOpacity={0} />
            </linearGradient>
          </defs>
          {/*
            Hidden, but it sets the domain: anchored at zero a week of steady traffic is a
            flat line 10px tall, and the tile would be showing nothing at all. The figure
            next to it is what carries the magnitude, so the shape is free to fill.
          */}
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className='min-w-0' />} />
          <Area
            type='monotone'
            dataKey='value'
            stroke='var(--color-value)'
            strokeWidth={2}
            fill={`url(#spark-${label.replace(/\W/g, '')})`}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      )}
    </ChartContainer>
  )
}

/* -------------------------------------------------------------------------- *
 * Headline chart
 * -------------------------------------------------------------------------- */

export interface TrafficChartProps {
  points: TimelinePoint[]
  className?: string
}

/** Views against interactions over the range. Two series, one axis, legend always on. */
export function TrafficChart({ points, className }: TrafficChartProps) {
  const { t } = useTranslation()

  const config = {
    views: { label: t('dashboard.legend.views'), color: 'var(--chart-1)' },
    interactions: { label: t('dashboard.legend.interactions'), color: 'var(--chart-2)' }
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className={className ?? 'aspect-auto h-72 w-full'}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id='traffic-views' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='var(--color-views)' stopOpacity={0.28} />
            <stop offset='100%' stopColor='var(--color-views)' stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id='traffic-interactions' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='var(--color-interactions)' stopOpacity={0.28} />
            <stop offset='100%' stopColor='var(--color-interactions)' stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray='3 3' />
        <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickMargin={4}
          tickFormatter={value => formatCount(Number(value))}
        />
        <ChartTooltip content={<ChartTooltipContent indicator='line' />} />
        <Area
          type='monotone'
          dataKey='views'
          stroke='var(--color-views)'
          strokeWidth={2}
          fill='url(#traffic-views)'
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
        <Area
          type='monotone'
          dataKey='interactions'
          stroke='var(--color-interactions)'
          strokeWidth={2}
          fill='url(#traffic-interactions)'
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}

/* -------------------------------------------------------------------------- *
 * Sessions
 * -------------------------------------------------------------------------- */

/** Sessions per bucket. One series, so the title names it and no legend is needed. */
export function SessionsChart({ points, className }: TrafficChartProps) {
  const { t } = useTranslation()

  const config = { sessions: { label: t('dashboard.legend.sessions'), color: 'var(--primary)' } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className={className ?? 'aspect-auto h-44 w-full'}>
      <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray='3 3' />
        <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        {/*
          Pinned to zero. A bar's reading is its length, so an axis that starts at the
          smallest value turns a 5% difference into a bar twice as tall as its neighbour.
        */}
        <YAxis
          domain={[0, 'auto']}
          tickLine={false}
          axisLine={false}
          width={44}
          tickMargin={4}
          tickFormatter={value => formatCount(Number(value))}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dot' />} />
        <Bar dataKey='sessions' fill='var(--color-sessions)' radius={4} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}
