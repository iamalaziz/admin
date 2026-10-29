'use client'

/**
 * The pieces all four dashboards are built from.
 *
 * Keeping them here is what makes the four layouts comparable: they differ in composition
 * and emphasis, not in how a number is drawn, so choosing between them is a choice about
 * layout rather than about which one happened to get the nicer bar chart.
 *
 * Colour follows the house style set by the template: a single neutral hue (`--primary`)
 * for magnitude, with the categorical `--chart-*` tokens reserved for the one widget that
 * encodes identity by colour (platforms). Everything ranked is one hue plus a direct
 * label, so no reader has to tell two similar colours apart.
 */
import type { ReactNode } from 'react'

import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type {
  CountryCode,
  CountrySplit,
  ElementKind,
  EventType,
  FunnelStep,
  HourCell,
  Platform,
  ScreenArea
} from '@/types/wordzen/analytics-types'

import { formatChange, formatCount, formatExact, formatHour, formatPercent } from './format'

/* -------------------------------------------------------------------------- *
 * Chrome
 * -------------------------------------------------------------------------- */

export interface SectionCardProps {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

/** One titled panel. Every dashboard section is one of these, so the rhythm holds. */
export function SectionCard({ title, hint, action, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className='gap-1'>
        <CardTitle className='text-base font-semibold'>{title}</CardTitle>
        {hint ? <p className='text-muted-foreground text-sm'>{hint}</p> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- *
 * Trend
 * -------------------------------------------------------------------------- */

export interface TrendPillProps {
  changePct: number

  /** For metrics where up is bad — the error rate. Flips the colour, not the arrow. */
  inverted?: boolean

  className?: string
}

/**
 * A signed change against the previous window.
 *
 * The arrow does the work: direction is never carried by colour alone, which is what keeps
 * it readable in forced-colours mode and for anyone who cannot separate the two hues.
 */
export function TrendPill({ changePct, inverted = false, className }: TrendPillProps) {
  const { t } = useTranslation()

  const flat = Math.abs(changePct) < 0.1
  const good = inverted ? changePct < 0 : changePct > 0

  const Icon = flat ? ArrowRightIcon : changePct > 0 ? ArrowUpRightIcon : ArrowDownRightIcon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium tabular-nums',
        flat ? 'text-muted-foreground' : good ? 'text-emerald-600 dark:text-emerald-500' : 'text-destructive',
        className
      )}
    >
      <Icon className='size-3.5' />
      {flat ? t('dashboard.noChange') : formatChange(changePct)}
    </span>
  )
}

/* -------------------------------------------------------------------------- *
 * Metric tiles
 * -------------------------------------------------------------------------- */

export interface MetricTileProps {
  label: string
  value: string
  hint?: string
  changePct?: number
  invertedChange?: boolean
  icon?: ReactNode
  footer?: ReactNode
  className?: string
}

/** The standard KPI tile: label, figure, change, and whatever the layout adds below. */
export function MetricTile({
  label,
  value,
  hint,
  changePct,
  invertedChange,
  icon,
  footer,
  className
}: MetricTileProps) {
  return (
    <Card className={cn('gap-3', className)}>
      <CardHeader className='gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
            {icon ? (
              <span className='bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-sm'>
                {icon}
              </span>
            ) : null}
            {label}
          </span>
          {changePct === undefined ? null : <TrendPill changePct={changePct} inverted={invertedChange} />}
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        <span className='text-3xl font-semibold tabular-nums'>{value}</span>
        {hint ? <span className='text-muted-foreground text-xs'>{hint}</span> : null}
        {footer}
      </CardContent>
    </Card>
  )
}

/**
 * The same figure with no card around it, for the executive layout — a metric row there is
 * typography on the page background rather than a grid of boxes.
 */
export function MetricLine({
  label,
  value,
  hint,
  changePct,
  invertedChange,
  className
}: Omit<MetricTileProps, 'icon' | 'footer'>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className='text-muted-foreground text-sm font-medium'>{label}</span>
      <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
        <span className='text-4xl leading-none font-semibold tabular-nums'>{value}</span>
        {changePct === undefined ? null : <TrendPill changePct={changePct} inverted={invertedChange} />}
      </div>
      {hint ? <span className='text-muted-foreground text-xs'>{hint}</span> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Badges
 * -------------------------------------------------------------------------- */

/** `ERROR` is the one event type worth a colour of its own; the rest are neutral. */
export function EventTypeBadge({ type, className }: { type: EventType; className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant={type === 'ERROR' ? 'destructive' : type === 'SCREEN_VIEW' ? 'outline' : 'secondary'}
      className={cn('text-[11px]', className)}
    >
      {t(`dashboard.eventTypes.${type}`)}
    </Badge>
  )
}

export function ElementKindBadge({ kind }: { kind: ElementKind }) {
  const { t } = useTranslation()

  return (
    <Badge variant='outline' className='text-[11px] font-normal'>
      {t(`dashboard.elementKinds.${kind}`)}
    </Badge>
  )
}

export function AreaBadge({ area }: { area: ScreenArea }) {
  const { t } = useTranslation()

  return (
    <Badge variant='ghost' className='text-muted-foreground text-[11px] font-normal'>
      {t(`dashboard.areaNames.${area}`)}
    </Badge>
  )
}

/** The app route an aggregate is keyed on. Monospaced, because it is an identifier. */
export function RoutePath({ path }: { path: string }) {
  return (
    <code
      className='bg-muted text-muted-foreground w-fit max-w-56 truncate rounded px-1.5 py-0.5 text-xs'
      title={path}
    >
      {path}
    </code>
  )
}

/* -------------------------------------------------------------------------- *
 * Ranked lists
 * -------------------------------------------------------------------------- */

export type RankedItem = {
  id: string
  label: string
  sublabel?: ReactNode
  value: number

  /** 0..1 of the largest item, which is what the bar draws. */
  share: number

  changePct?: number
  trailing?: ReactNode
}

export interface RankedBarsProps {
  items: RankedItem[]

  /** Shown instead of the raw count, where the figure is a rate or a duration. */
  formatValue?: (value: number) => string

  /** Prefix each row with its position. Worth it when the ordering *is* the message. */
  numbered?: boolean

  className?: string
}

/**
 * A magnitude ranking: one bar per row, one hue, the value written out.
 *
 * Bars rather than a pie because the question is "how much more than the next one", and
 * length answers that; and the label sits on the row, so nothing depends on matching a
 * colour to a legend.
 */
export function RankedBars({ items, formatValue = formatCount, numbered = false, className }: RankedBarsProps) {
  return (
    <ol className={cn('flex flex-col gap-3.5', className)}>
      {items.map((item, index) => (
        <li key={item.id} className='flex flex-col gap-1.5'>
          <div className='flex items-baseline justify-between gap-3'>
            <span className='flex min-w-0 items-baseline gap-2'>
              {numbered ? (
                <span className='text-muted-foreground w-4 shrink-0 text-xs tabular-nums'>{index + 1}</span>
              ) : null}
              <span className='truncate text-sm font-medium'>{item.label}</span>
              {item.sublabel}
            </span>
            <span className='flex shrink-0 items-baseline gap-2'>
              {item.trailing}
              <span className='text-sm font-semibold tabular-nums'>{formatValue(item.value)}</span>
              {item.changePct === undefined ? null : (
                <TrendPill changePct={item.changePct} className='w-14 justify-end text-xs' />
              )}
            </span>
          </div>
          <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
            <div
              className='bg-primary h-full rounded-full'
              style={{ width: `${Math.max(item.share * 100, 1.5)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

/* -------------------------------------------------------------------------- *
 * Funnel
 * -------------------------------------------------------------------------- */

/**
 * The lesson funnel.
 *
 * Drawn as nested bars rather than a tapering polygon: a trapezoid encodes the same number
 * twice — width and area — and reads as a bigger drop than it is.
 */
export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const { t } = useTranslation()

  return (
    <ol className='flex flex-col gap-4'>
      {steps.map((step, index) => (
        <li key={step.key} className='flex flex-col gap-1.5'>
          <div className='flex items-baseline justify-between gap-3'>
            <span className='truncate text-sm font-medium'>{step.name}</span>
            <span className='flex items-baseline gap-2'>
              <span className='text-sm font-semibold tabular-nums'>{formatCount(step.users)}</span>
              <span className='text-muted-foreground w-12 text-right text-xs tabular-nums'>
                {formatPercent(step.share, 0)}
              </span>
            </span>
          </div>
          <div className='bg-muted h-7 w-full overflow-hidden rounded-md'>
            <div
              className={cn('h-full rounded-md', index === 0 ? 'bg-primary' : 'bg-primary/70')}
              style={{ width: `${Math.max(step.share * 100, 2)}%` }}
            />
          </div>
          {index === 0 ? null : (
            <span className='text-muted-foreground text-xs'>
              {t('dashboard.dropOff', { percent: formatPercent(step.dropOff, 0) })}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

/* -------------------------------------------------------------------------- *
 * Heatmap
 * -------------------------------------------------------------------------- */

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/** Hours to label on the axis — every third one, so the ticks never collide. */
const LABELLED_HOURS = [0, 3, 6, 9, 12, 15, 18, 21]

export interface HourHeatmapProps {
  cells: HourCell[]
  peak: HourCell
  className?: string
}

/**
 * Interactions by weekday and hour.
 *
 * A sequential single hue: magnitude is lightness, so there is no legend to decode and no
 * pair of hues to tell apart. The floor is a 6% tint rather than the bare surface, so an
 * empty hour still reads as a cell of the grid.
 */
export function HourHeatmap({ cells, peak, className }: HourHeatmapProps) {
  const { t } = useTranslation()

  const max = Math.max(...cells.map(cell => cell.interactions), 1)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='flex gap-2 overflow-x-auto'>
        <div className='flex shrink-0 flex-col gap-1 pt-0'>
          {WEEKDAY_KEYS.map(key => (
            <span key={key} className='text-muted-foreground flex h-5 items-center text-[11px]'>
              {t(`dashboard.weekdays.${key}`)}
            </span>
          ))}
          <span className='h-4' />
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          {WEEKDAY_KEYS.map((key, weekday) => (
            <div key={key} className='flex h-5 gap-1'>
              {cells
                .filter(cell => cell.weekday === weekday)
                .map(cell => {
                  const intensity = cell.interactions / max

                  return (
                    <span
                      key={cell.hour}
                      className='flex-1 rounded-[3px]'
                      style={{
                        backgroundColor: `color-mix(in oklab, var(--primary) ${(6 + intensity * 88).toFixed(1)}%, var(--muted))`
                      }}
                      title={`${t(`dashboard.weekdays.${key}`)} ${formatHour(cell.hour)} · ${formatExact(cell.interactions)}`}
                    />
                  )
                })}
            </div>
          ))}

          <div className='text-muted-foreground flex h-4 gap-1 text-[10px]'>
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className='flex-1 text-center tabular-nums'>
                {LABELLED_HOURS.includes(hour) ? String(hour).padStart(2, '0') : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className='text-muted-foreground text-sm'>
        {t('dashboard.peak', {
          day: t(`dashboard.weekdays.${WEEKDAY_KEYS[peak.weekday]}`),
          hour: formatHour(peak.hour)
        })}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Platforms
 * -------------------------------------------------------------------------- */

/** The one categorical scale in the dashboards: three fixed, well-separated hues. */
const PLATFORM_COLORS: Record<Platform, string> = {
  WEB: 'var(--chart-1)',
  ANDROID: 'var(--chart-2)',
  IOS: 'var(--chart-3)'
}

export function PlatformRows({ platforms }: { platforms: { platform: Platform; sessions: number; share: number }[] }) {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full'>
        {platforms.map(entry => (
          <span
            key={entry.platform}
            style={{ width: `${entry.share * 100}%`, backgroundColor: PLATFORM_COLORS[entry.platform] }}
          />
        ))}
      </div>
      <ul className='flex flex-col gap-2.5'>
        {platforms.map(entry => (
          <li key={entry.platform} className='flex items-baseline justify-between gap-3'>
            <span className='flex items-center gap-2 text-sm'>
              <span
                className='size-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: PLATFORM_COLORS[entry.platform] }}
              />
              {t(`dashboard.platformNames.${entry.platform}`)}
            </span>
            <span className='flex items-baseline gap-3'>
              <span className='text-muted-foreground text-xs tabular-nums'>{formatPercent(entry.share, 0)}</span>
              <span className='text-sm font-medium tabular-nums'>{formatCount(entry.sessions)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- *
 * Countries
 * -------------------------------------------------------------------------- */

/**
 * The ISO code behind a country row.
 *
 * Monospaced for the same reason `RoutePath` is: it is the identifier the aggregate is
 * keyed on, not prose. A flag would be prettier, but regional-indicator emoji fall back to
 * the bare letters on Windows, so half the readers would see this anyway — with none of
 * the alignment.
 */
export function CountryCodeBadge({ code }: { code: CountryCode }) {
  if (code === 'OTHER') {
    return null
  }

  return <code className='bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px]'>{code}</code>
}

export interface CountryRowsProps {
  countries: CountrySplit[]

  /** Rows to draw, longest first. Omitted, every country in the split is listed. */
  limit?: number

  /** Show each row's change against the previous window. Off where the card is dense. */
  showChange?: boolean

  className?: string
}

/**
 * Users per country.
 *
 * Deliberately a ranking and not a map: a choropleth of twelve countries spends the whole
 * card on landmass, which is the one variable nobody is asking about — Uzbekistan and
 * Kazakhstan differ ninefold in area and twofold in users here. Bars put the two numbers
 * that matter next to each other, and `share` is written out so the rows that round to the
 * same bar width are still distinguishable.
 */
export function CountryRows({ countries, limit, showChange = false, className }: CountryRowsProps) {
  const { t } = useTranslation()

  const rows = limit === undefined ? countries : countries.slice(0, limit)
  const max = Math.max(...rows.map(entry => entry.users), 1)

  return (
    <RankedBars
      className={className}
      items={rows.map(entry => ({
        id: entry.code,
        label: t(`dashboard.countryNames.${entry.code}`),
        sublabel: <CountryCodeBadge code={entry.code} />,
        value: entry.users,
        share: entry.users / max,
        changePct: showChange ? entry.changePct : undefined,
        trailing: <span className='text-muted-foreground text-xs tabular-nums'>{formatPercent(entry.share, 1)}</span>
      }))}
    />
  )
}
