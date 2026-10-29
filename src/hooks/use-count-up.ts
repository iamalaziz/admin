import * as React from 'react'

/** Long enough to read as motion, short enough that the figure is settled before it is read. */
const DEFAULT_DURATION_MS = 900

/** Decelerating, so the count lands on its figure instead of stopping dead on it. */
const easeOut = (progress: number) => 1 - (1 - progress) ** 3

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Counts up to `value`, returning the figure to render this frame.
 *
 * The first render returns `value` itself, so the client's markup matches what the server
 * sent and the count starts from an effect instead — from 0 on mount, and from the figure
 * it was already showing on every later change, so refreshed data animates the difference
 * rather than dropping back to zero. Honours `prefers-reduced-motion` by jumping straight
 * to the figure.
 */
export function useCountUp(value: number, durationMs = DEFAULT_DURATION_MS) {
  const [display, setDisplay] = React.useState(value)
  const fromRef = React.useRef(0)

  React.useEffect(() => {
    const from = fromRef.current

    fromRef.current = value

    if (from === value || durationMs <= 0 || prefersReducedMotion()) {
      setDisplay(value)

      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)

      setDisplay(from + (value - from) * easeOut(progress))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [value, durationMs])

  return display
}
