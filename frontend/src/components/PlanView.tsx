import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useEffect, useState } from "react"

type Props = {
  plan: PlanResponse
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
}

export function PlanView({ plan, onSelectMeal, onReset }: Props) {
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setBarWidth(Math.min(100, plan.budget_utilization * 100))
    }, 50)
    return () => clearTimeout(t)
  }, [plan.budget_utilization])
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <button onClick={onReset} className="text-sm text-muted hover:text-ink mb-8">
        ← Start over
      </button>

      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Your week</p>
        <h1 className="font-display text-4xl text-ink mb-2">
          {plan.meals.length} meals, {gbp(plan.total_cost_gbp)} total
        </h1>
        <p className="text-muted">
          {Math.round(plan.avg_calories_per_serving)} kcal average · {plan.cuisine_diversity} cuisines
        </p>
      </div>

      {/* Signature element: the budget bar */}
      <div className="mb-12">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted mb-2">
          <span>Budget allocated</span>
          <span className="font-mono">
            {gbp(plan.total_cost_gbp)} / {gbp(plan.budget_gbp)}
          </span>
        </div>
        <div className="h-2 bg-chip rounded-sm overflow-hidden">
          <div
            className="h-full bg-accent transition-all ease-out"
            style={{
              width: `${barWidth}%`,
              transitionDuration: "1500ms",
              transitionDelay: "500ms",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2 font-mono">
          <span>£0</span>
          <span>{Math.round(plan.budget_utilization * 100)}% used</span>
          <span>{gbp(plan.budget_gbp)}</span>
        </div>
      </div>

      {plan.warnings.length > 0 && (
        <div className="mb-8 p-4 border border-line rounded-md bg-chip">
          {plan.warnings.map((w, i) => (
            <p key={i} className="text-sm text-ink">{w}</p>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {plan.meals.map((meal, i) => (
          <button
            key={meal.recipe_id}
            onClick={() => onSelectMeal(meal)}
            className="text-left p-5 border border-line rounded-lg bg-bg hover:border-ink transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-muted font-mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted">{meal.cuisine}</span>
            </div>
            <h3 className="font-display text-xl text-ink mb-4 leading-tight group-hover:text-accent transition-colors">
              {meal.title}
            </h3>
            <div className="flex gap-4 text-sm font-mono text-muted">
              <span>{gbp(meal.total_cost_gbp)}</span>
              <span>{meal.calories_per_serving} kcal</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}