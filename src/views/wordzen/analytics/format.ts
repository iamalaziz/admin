/**
 * Number formatting for the dashboards.
 *
 * The locale is pinned to `en-GB` rather than taken from the UI language, for the same
 * reason `Timestamp` pins it: these numbers are rendered on the server and again on the
 * client, and a locale-dependent separator would differ between the two passes. The
 * dashboards are figures and labels — the labels are translated, the digits are not.
 */
const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
const plain = new Intl.NumberFormat('en-GB')

/** 42,714 up to four digits, then 42.7K — axis ticks and tiles need the short form. */
export const formatCount = (value: number) => (value >= 10_000 ? compact.format(value) : plain.format(value))

export const formatExact = (value: number) => plain.format(value)

export const formatPercent = (share: number, digits = 1) => `${(share * 100).toFixed(digits)}%`

/** A signed percentage for the trend pills. */
export const formatChange = (changePct: number) =>
  `${changePct > 0 ? '+' : ''}${changePct.toFixed(changePct >= 10 || changePct <= -10 ? 0 : 1)}%`

/** Clicks per view, which is routinely above 1 — "2.6x" reads better than "260%". */
export const formatRate = (rate: number) => (rate >= 1 ? `${rate.toFixed(1)}x` : `${(rate * 100).toFixed(0)}%`)

/** 4m 47s, or 47s under a minute. Session and dwell times only ever reach minutes. */
export const formatDuration = (seconds: number) => {
  const whole = Math.round(seconds)

  if (whole < 60) {
    return `${whole}s`
  }

  const minutes = Math.floor(whole / 60)
  const rest = whole % 60

  if (minutes < 60) {
    return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/** `09:00`, for the heatmap axis and the peak-hour caption. */
export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`
