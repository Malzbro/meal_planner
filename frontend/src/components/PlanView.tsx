import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useCountUp } from "@/lib/useCountUp"
import { CostBreakdownBar } from "./CostBreakdownBar"
import { CalorieDistribution } from "./CalorieDistribution"
import { ShoppingListView } from "./ShoppingList"

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
}

export function PlanView({ plan, calorieTarget, householdSize, onSelectMeal, onReset }: Props) {
  const [barWidth, setBarWidth] = useState(0)
  const [tab, setTab] = useState<"plan" | "shopping">("plan")

  useEffect(() => {
    const t = setTimeout(() => {
      setBarWidth(Math.min(100, plan.budget_utilization * 100))
    }, 50)
    return () => clearTimeout(t)
  }, [plan.budget_utilization])
  const animatedCost = useCountUp(plan.total_cost_gbp, 1000, 200)
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onReset} className="text-sm text-muted hover:text-ink transition-colors">
          ← Start over
        </button>
        <div className="flex gap-1 bg-chip rounded-md p-1">
          <button
            onClick={() => setTab("plan")}
            className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-colors ${
              tab === "plan" ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Plan
          </button>
          <button
            onClick={() => setTab("shopping")}
            className={`px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-colors ${
              tab === "shopping" ? "bg-bg text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            Shopping list
          </button>
        </div>
      </div>

      {tab === "plan" ? (
        <>
          {/* everything that was in the plan view before — the "Your week" heading,
              budget bar, charts grid, meal cards grid */}
        </>
      ) : (
        <ShoppingListView
          recipeIds={plan.meals.map(m => m.recipe_id)}
          householdSize={householdSize}
        />
      )}
      {/* Top-level budget bar (overall utilization) */}
      <div className="mb-10">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted mb-2">
          <span>Budget allocated</span>
          <span className="font-mono">
            {gbp(animatedCost)} / {gbp(plan.budget_gbp)}
          </span>
        </div>
        <div className="h-2 bg-chip rounded-sm overflow-hidden">
          <div
            className="h-full bg-accent transition-all ease-out"
            style={{
              width: `${barWidth}%`,
              transitionDuration: "1000ms",
              transitionDelay: "200ms",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2 font-mono">
          <span>£0</span>
          <span>{Math.round(plan.budget_utilization * 100)}% used</span>
          <span>{gbp(plan.budget_gbp)}</span>
        </div>
      </div>

      {/* Charts: cost breakdown + calorie distribution side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <CostBreakdownBar meals={plan.meals} budget={plan.budget_gbp} />
        <CalorieDistribution
          meals={plan.meals}
          target={Math.round(calorieTarget)}
        />
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