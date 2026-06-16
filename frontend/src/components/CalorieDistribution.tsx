import { useEffect, useState } from "react"
import type { PlannedMeal } from "@/lib/api"

type Props = {
  meals: PlannedMeal[]
  target: number
}


export function CalorieDistribution({ meals, target }: Props) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  const values = meals.map(m => m.calories_per_serving)
  const minValue = Math.min(...values, target)
  const maxValue = Math.max(...values, target)

  // Center the scale around the target so the dashed line sits in the middle.
  // The "spread" is the larger of (max-target) and (target-min), with some padding.
  const upperSpread = maxValue - target
  const lowerSpread = target - minValue
  const halfRange = Math.max(upperSpread, lowerSpread) * 1.3 + 50

  const scaleMin = Math.max(0, Math.floor((target - halfRange) / 50) * 50)
  const scaleMax = Math.ceil((target + halfRange) / 50) * 50
  const range = scaleMax - scaleMin
  return (
    <div>
      <div className="flex justify-between items-baseline gap-3 text-xs uppercase tracking-widest text-muted mb-3 min-w-0">
        <span className="flex-shrink-0">Calories per serving</span>
        <span className="font-mono text-right">
          avg <span className="text-ink">{Math.round(meals.reduce((s, m) => s + m.calories_per_serving, 0) / meals.length)}</span>
          {" · "}
          <span className="text-accent inline-flex items-baseline gap-1">
            <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-accent/70 self-center" />
            target {target}
          </span>
        </span>
      </div>

      <div className="relative h-32 flex items-end gap-2 px-1">
        {/* Target reference line — labeled in the chart header */}
        <div
          className="absolute inset-x-0 z-10 pointer-events-none border-t-2 border-dashed border-accent/70"
          style={{ bottom: `${((target - scaleMin) / range) * 100}%` }}
        />

        {meals.map((meal, i) => {
          const heightPct = animated? ((meal.calories_per_serving - scaleMin) / range) * 100: 0
          const deviation = Math.abs(meal.calories_per_serving - target) / target
          // Bars closer to target are full aubergine; farther bars are lighter
          const opacity = 1 - Math.min(deviation, 0.5)
          return (
            <div
              key={meal.recipe_id}
              className="flex-1 flex flex-col items-center justify-end h-full relative group"
              title={`${meal.title} — ${meal.calories_per_serving} kcal`}
            >
              <span className="text-[10px] font-mono text-muted mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {meal.calories_per_serving}
              </span>
              <div
                className="w-full bg-accent rounded-t-sm transition-all ease-out"
                style={{
                  height: `${heightPct}%`,
                  opacity,
                  transitionDuration: animated ? "700ms" : "0ms",
                  transitionDelay: animated ? `${i * 60}ms` : "0ms",
                }}
              />
              <span className="text-[10px] font-mono text-muted mt-1">{i + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}