import { useState } from "react"
import { PlannerWizard } from "@/components/PlannerWizard"
import { PlanView } from "@/components/PlanView"
import { PlanSkeleton } from "@/components/PlanSkeleton"
import { RecipeModal } from "@/components/RecipeModal"
import { createPlan, type PlanRequest, type PlanResponse, type PlannedMeal } from "@/lib/api"
import { PlanReveal } from "@/components/PlanReveal"
//import { Leaf } from "@/components/Leaf"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null)
  const [showReveal, setShowReveal] = useState(false)

  const handleSubmit = async (req: PlanRequest) => {
    setLoading(true)
    setError(null)
    setPlan(null)
    setLastRequest(req)
    try {
      const result = await createPlan(req)
      setPlan(result)
      setShowReveal(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }
  const handleSwapped = (mealIndex: number, newMeal: PlannedMeal) => {
    if (!plan) return
    const newMeals = [...plan.meals]
    newMeals[mealIndex] = newMeal
    const newTotal = newMeals.reduce((sum, m) => sum + m.total_cost_gbp, 0)
    const newAvgCal = newMeals.reduce((sum, m) => sum + m.calories_per_serving, 0) / newMeals.length
    setPlan({
      ...plan,
      meals: newMeals,
      total_cost_gbp: Math.round(newTotal * 100) / 100,
      budget_utilization: Math.round((newTotal / plan.budget_gbp) * 1000) / 1000,
      avg_calories_per_serving: Math.round(newAvgCal * 10) / 10,
      cuisine_diversity: new Set(newMeals.map(m => m.cuisine)).size,
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="container py-4 flex items-center justify-between">
          <p className="font-display text-lg text-ink">Pantry</p>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-12 sm:py-20">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 border border-accent rounded-md text-accent">
            {error}
          </div>
        )}

        {loading ? (
          <PlanSkeleton />
        ) : !plan ? (
          <PlannerWizard onSubmit={handleSubmit} loading={loading} />
        ) : (
          <PlanView
            plan={plan}
            calorieTarget={lastRequest?.target_calories_per_serving ?? plan.avg_calories_per_serving}
            householdSize={lastRequest?.household_size ?? 1}
            onSelectMeal={(m: PlannedMeal) => setSelectedRecipeId(m.recipe_id)}
            onReset={() => {
              setPlan(null)
              setLastRequest(null)
              setShowReveal(false)
            }}
          />
        )}
      </main>
      {plan && showReveal && (
        <PlanReveal plan={plan} onComplete={() => setShowReveal(false)} />
      )}

      <RecipeModal
        recipeId={selectedRecipeId}
        planContext={lastRequest}
        currentMeals={plan?.meals ?? []}
        onClose={() => setSelectedRecipeId(null)}
        onSwapped={handleSwapped}
      />

      <footer className="border-t border-line mt-20">
        <div className="container py-6 text-xs text-muted">
          Prices and calories are AI-estimated. For planning, not nutritional advice.
        </div>
      </footer>
    </div>
  )
}