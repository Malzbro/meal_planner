import type { PlanResponse, PlannedMeal } from "@/lib/api"
import { gbp } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useCountUp } from "@/lib/useCountUp"
import { CostBreakdownBar } from "./CostBreakdownBar"
import { CalorieDistribution } from "./CalorieDistribution"
import { ShoppingListView } from "./ShoppingList"
import { Sheet } from "./Sheet"

type Props = {
  plan: PlanResponse
  calorieTarget: number
  householdSize: number
  onSelectMeal: (meal: PlannedMeal) => void
  onReset: () => void
}

type ActiveCard = "budget" | "shopping" | "stats" | null

export function PlanView({ plan, calorieTarget, householdSize, onSelectMeal, onReset }: Props) {
  const [active, setActive] = useState<ActiveCard>(null)
  const [barWidth, setBarWidth] = useState(0)

  // Animate budget bar when the Budget sheet opens.
  useEffect(() => {
    if (active !== "budget") {
      setBarWidth(0)
      return
    }
    const t = setTimeout(() => {
      setBarWidth(Math.min(100, plan.budget_utilization * 100))
    }, 50)
    return () => clearTimeout(t)
  }, [plan.budget_utilization, active])

  const animatedCost = useCountUp(plan.total_cost_gbp, 1000, 200)
  const pct = Math.round(plan.budget_utilization * 100)

  const cuisineCounts = plan.meals.reduce<Record<string, number>>((acc, m) => {
    acc[m.cuisine] = (acc[m.cuisine] ?? 0) + 1
    return acc
  }, {})
  const cuisineBreakdown = Object.entries(cuisineCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([c, n]) => `${c} × ${n}`)
    .join(", ")

  const cardLayout = "text-left p-5 rounded-lg bg-bg transition-all duration-200"
  const cardActive = "border-2 border-accent shadow-md"
  const cardInactive = "border-2 border-[#D9D3C7] shadow-sm hover:border-[#B0A893] hover:shadow-md"
  const cardMuted = "border-2 border-[#D9D3C7] shadow-sm opacity-60 cursor-not-allowed"
  const eyebrow = "text-xs uppercase tracking-widest text-muted"

  const sheetTitle =
    active === "budget" ? "Budget"
    : active === "shopping" ? "Shopping list"
    : active === "stats" ? "Stats"
    : ""

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-800">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onReset} className="text-sm text-muted hover:text-ink transition-colors">
          ← Start over
        </button>
      </div>

      <div className="mb-6">
        <h2 className="font-display text-2xl text-ink">
          Your week — {plan.meals.length} meals,{" "}
          <span className="font-mono">{gbp(animatedCost)}</span> total
        </h2>
      </div>

      {/* 2x2 dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={() => setActive(active === "budget" ? null : "budget")}
          className={`${cardLayout} ${active === "budget" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Budget</p>
          <p className="font-mono text-lg text-ink mt-2">
            {gbp(plan.total_cost_gbp)} <span className="text-muted">of</span> {gbp(plan.budget_gbp)}
          </p>
          <p className="text-sm text-muted mt-1">{pct}% allocated</p>
          <div className="h-1 bg-chip rounded-sm overflow-hidden mt-3">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </button>

        <button
          onClick={() => setActive(active === "shopping" ? null : "shopping")}
          className={`${cardLayout} ${active === "shopping" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Shopping list</p>
          <p className="font-mono text-lg text-ink mt-2">{plan.meals.length} recipes</p>
          <p className="text-sm text-muted mt-1">Tap to view ingredients</p>
        </button>

        <div className={`${cardLayout} ${cardMuted}`} aria-disabled="true">
          <p className={eyebrow}>Pantry</p>
          <p className="font-mono text-lg text-muted mt-2">Coming soon</p>
          <p className="text-sm text-muted mt-1">Track what you already have</p>
        </div>

        <button
          onClick={() => setActive(active === "stats" ? null : "stats")}
          className={`${cardLayout} ${active === "stats" ? cardActive : cardInactive}`}
        >
          <p className={eyebrow}>Stats</p>
          <p className="font-mono text-lg text-ink mt-2">
            {Math.round(plan.avg_calories_per_serving)} kcal avg
          </p>
          <p className="text-sm text-muted mt-1">{plan.cuisine_diversity} cuisines</p>
        </button>
      </div>

      {plan.warnings.length > 0 && (
        <div className="mb-8 p-4 border border-line rounded-md bg-chip">
          {plan.warnings.map((w, i) => (
            <p key={i} className="text-sm text-ink">{w}</p>
          ))}
        </div>
      )}

      <hr className="border-line mb-8" />

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

      <Sheet
        open={active !== null}
        onClose={() => setActive(null)}
        title={sheetTitle}
        contentKey={active ?? "none"}
        width={active === "shopping" ? "wide" : "narrow"}
      >
        {active === "budget" && (
          <div className="space-y-6">
            <div>
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
                    transitionDuration: "1000ms",
                    transitionDelay: "200ms",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted mt-2 font-mono">
                <span>£0</span>
                <span>{pct}% used</span>
                <span>{gbp(plan.budget_gbp)}</span>
              </div>
            </div>
            <CostBreakdownBar meals={plan.meals} budget={plan.budget_gbp} />
          </div>
        )}

        {active === "shopping" && (
          <ShoppingListView
            recipeIds={plan.meals.map(m => m.recipe_id)}
            householdSize={householdSize}
          />
        )}

        {active === "stats" && (
          <div className="space-y-6">
            <CalorieDistribution meals={plan.meals} target={Math.round(calorieTarget)} />
            <div>
              <p className={`${eyebrow} mb-2`}>Cuisine breakdown</p>
              <p className="text-sm text-ink">{cuisineBreakdown}</p>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}