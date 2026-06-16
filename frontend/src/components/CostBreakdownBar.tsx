import { useEffect, useState } from "react"
import type { PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"

type Props = {
  meals: PlannedMeal[]
  budget: number
}

// Each meal gets a hue from a curated palette. Aubergine-derived so it
// stays cohesive with the rest of the design language.
// Curated 7-step palette spanning deep aubergine → dusty rose → warm clay.
// Stays in the warm-burgundy family throughout — never green, blue, or orange.
const SEGMENT_COLORS = [
  "#3F1521", // deepest plum (almost black-purple)
  "#5A1F2C", // dark aubergine
  "#751F33", // claret
  "#8E2E3F", // burgundy
  "#A85362", // dusty rose
  "#C18A87", // warm clay-pink
  "#D4A89F", // pale terracotta-blush
]


export function CostBreakdownBar({ meals, budget }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])
  // Sort by cost descending — biggest expense on the left so the bar reads
  // as a natural "decreasing waterfall."
  const sortedMeals = [...meals].sort((a, b) => b.total_cost_gbp - a.total_cost_gbp)
  const totalSpent = meals.reduce((sum, m) => sum + m.total_cost_gbp, 0)
  const unallocated = Math.max(0, budget - totalSpent)

  return (
    <div>
      <div className="flex justify-between items-baseline gap-3 text-xs uppercase tracking-widest text-muted mb-3 min-w-0">
        <span className="flex-shrink-0">Cost breakdown</span>
        <span className="font-mono truncate text-right min-w-0">
          {hoveredIndex !== null
            ? `${sortedMeals[hoveredIndex].title} — ${gbp(sortedMeals[hoveredIndex].total_cost_gbp)}`
            : `${meals.length} meals`}
        </span>
      </div>

      {/* The bar itself */}
      <div className="h-3 bg-chip rounded-sm overflow-hidden flex">
        {sortedMeals.map((meal, i) => {
          const widthPct = animated ? (meal.total_cost_gbp / budget) * 100 : 0
          const isHovered = hoveredIndex === i
          const isDimmed = hoveredIndex !== null && hoveredIndex !== i
          return (
            <div
              key={meal.recipe_id}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="transition-all ease-out cursor-pointer"
              style={{
                width: `${widthPct}%`,
                backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                opacity: isDimmed ? 0.4 : 1,
                transitionDuration: animated ? "800ms" : "0ms",
                transitionDelay: animated ? `${i * 50}ms` : "0ms",
                transform: isHovered ? "scaleY(1.3)" : "scaleY(1)",
                transformOrigin: "center",
              }}
              title={`${meal.title} — ${gbp(meal.total_cost_gbp)}`}
            />
          )
        })}
      </div>

      {/* Legend / footer */}
      <div className="flex justify-between text-xs font-mono text-muted mt-2">
        <span>£0</span>
        <span>
          {gbp(totalSpent)} of {gbp(budget)} · {unallocated > 0 ? `${gbp(unallocated)} left` : "fully allocated"}
        </span>
        <span>{gbp(budget)}</span>
      </div>
    </div>
  )
}