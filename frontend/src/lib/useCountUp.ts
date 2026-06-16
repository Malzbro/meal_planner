import { useEffect, useState } from "react"

/**
 * Animate a number from 0 to `target` over `durationMs`.
 * Uses requestAnimationFrame and an ease-out curve for a natural feel.
 */
export function useCountUp(target: number, durationMs: number = 900, delayMs: number = 0): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    setValue(0)
    let raf = 0
    let startedAt: number | null = null

    const timeout = setTimeout(() => {
      const tick = (now: number) => {
        if (startedAt === null) startedAt = now
        const elapsed = now - startedAt
        const t = Math.min(elapsed / durationMs, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(target * eased)
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [target, durationMs, delayMs])

  return value
}