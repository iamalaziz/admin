'use client'

import { useCountUp } from '@/hooks/use-count-up'
import { cn } from '@/lib/utils'

export interface CountUpProps {
  value: number

  /** Runs on every frame, so the figure keeps its separators and unit while it counts. */
  format?: (value: number) => string

  /** `0` renders the figure with no animation at all. */
  durationMs?: number
  className?: string
}

const formatWhole = (value: number) => String(Math.round(value))

/**
 * A figure that counts up to `value` when it first appears and whenever it changes.
 *
 * The digits are tabular so the figure keeps its width through the count — a proportional
 * font would shuffle the surrounding layout on every frame.
 */
export function CountUp({ value, format = formatWhole, durationMs, className }: CountUpProps) {
  const current = useCountUp(value, durationMs)

  return (
    <span className={cn('tabular-nums', className)} suppressHydrationWarning>
      {format(current)}
    </span>
  )
}
