import { useEffect, useState } from "react"
import type { RecipeDetail, PlannedMeal, PlanRequest } from "@/lib/api"
import { getRecipe, swapMeal } from "@/lib/api"
import { gbp as fmtGbp } from "@/lib/utils"
import { Sheet } from "./Sheet"

type Props = {
  recipeId: number | null
  planContext: PlanRequest | null
  currentMeals: PlannedMeal[]
  onClose: () => void
  onSwapped: (mealIndex: number, newMeal: PlannedMeal) => void
}

export function RecipeModal({ recipeId, planContext, currentMeals, onClose, onSwapped }: Props) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSwap, setShowSwap] = useState(false)
  const [swapReason, setSwapReason] = useState("")
  const [swapping, setSwapping] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)

  useEffect(() => {
    if (recipeId === null) {
      setRecipe(null)
      setShowSwap(false)
      setSwapReason("")
      setSwapError(null)
      return
    }
    setLoading(true)
    getRecipe(recipeId)
      .then(setRecipe)
      .finally(() => setLoading(false))
  }, [recipeId])

  const handleSwap = async () => {
    if (!planContext || recipeId === null) return
    setSwapping(true)
    setSwapError(null)
    try {
      const newMeal = await swapMeal({
        original_recipe_id: recipeId,
        reason: swapReason,
        plan_context: planContext,
      })
      const mealIndex = currentMeals.findIndex(m => m.recipe_id === recipeId)
      if (mealIndex >= 0) {
        onSwapped(mealIndex, newMeal)
        onClose()
      } else {
        setSwapError("Could not locate this meal in the current plan")
      }
    } catch (e) {
      setSwapError(e instanceof Error ? e.message : "Swap failed")
    } finally {
      setSwapping(false)
    }
  }

  return (
    <Sheet
      open={recipeId !== null}
      onClose={onClose}
      title="Recipe"
      contentKey={String(recipeId ?? "none")}
    >
      {loading && <p className="text-muted">Loading recipe...</p>}
      {recipe && (
        <>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">
            {recipe.cuisine} · {recipe.prep_minutes} minutes
          </p>
          <h2 className="font-display text-4xl text-ink leading-tight mb-6">
            {recipe.title}
          </h2>

          <div className="flex flex-wrap gap-6 text-sm font-mono text-muted mb-8 pb-8 border-b border-line">
            <Stat label="Per serving" value={fmtGbp(recipe.cost_per_serving_gbp)} />
            <Stat label="Total" value={fmtGbp(recipe.total_cost_gbp)} />
            <Stat label="Calories" value={`${recipe.calories_per_serving}`} />
            <Stat label="Serves" value={`${recipe.servings}`} />
          </div>

          <div className="grid sm:grid-cols-5 gap-8 mb-8">
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-widest text-muted mb-4">Ingredients</p>
              <ul className="space-y-2 text-sm">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-ink">{ing.name}</span>
                    <span className="font-mono text-muted whitespace-nowrap">{ing.grams}g</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-3">
              <p className="text-xs uppercase tracking-widest text-muted mb-4">Method</p>
              <ol className="space-y-4 text-sm">
                {recipe.steps.map(step => (
                  <li key={step.position} className="flex gap-4">
                    <span className="font-mono text-accent flex-shrink-0 w-6">
                      {String(step.position).padStart(2, "0")}
                    </span>
                    <span className="text-ink leading-relaxed">{step.content}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Swap section */}
          {planContext && (
            <div className="border-t border-line pt-6">
              {!showSwap ? (
                <button
                  onClick={() => setShowSwap(true)}
                  className="text-sm text-muted hover:text-accent transition-colors"
                >
                  Not feeling this one? <span className="underline underline-offset-2">Swap it</span>
                </button>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted mb-3">
                    What didn't work?
                  </p>
                  <textarea
                    value={swapReason}
                    onChange={e => setSwapReason(e.target.value)}
                    placeholder="e.g. don't like spicy food, want something lighter, prefer pasta"
                    rows={2}
                    className="w-full bg-transparent border border-line rounded-md p-3 mb-3 focus:outline-none focus:border-ink resize-none text-ink placeholder:text-muted text-sm"
                  />
                  {swapError && (
                    <p className="text-sm text-accent mb-3">{swapError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSwap}
                      disabled={swapping}
                      className="bg-accent text-accent-fg px-4 py-2 rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {swapping ? "Finding alternative..." : "Find me something else"}
                    </button>
                    <button
                      onClick={() => { setShowSwap(false); setSwapReason(""); setSwapError(null); }}
                      disabled={swapping}
                      className="text-sm text-muted hover:text-ink px-4 py-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className="text-ink text-base">{value}</p>
    </div>
  )
}