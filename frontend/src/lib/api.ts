const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export type PlanRequest = {
  weekly_budget_gbp: number
  household_size: number
  target_calories_per_serving: number
  required_tags: string[]
  excluded_appliances: string[]
  preferred_cuisines: string[]
  preference_text: string
  meals_per_week: number
}

export type PlannedMeal = {
  recipe_id: number
  title: string
  cuisine: string
  cost_per_serving_gbp: number
  total_cost_gbp: number
  calories_per_serving: number
  relevance_score: number
}

export type PlanResponse = {
  meals: PlannedMeal[]
  total_cost_gbp: number
  budget_gbp: number
  budget_utilization: number
  avg_calories_per_serving: number
  cuisine_diversity: number
  warnings: string[]
}

export type RecipeDetail = {
  id: number
  title: string
  cuisine: string
  servings: number
  calories_per_serving: number
  prep_minutes: number
  total_cost_gbp: number
  cost_per_serving_gbp: number
  tags: string[]
  appliances: string[]
  ingredients: { name: string; grams: number; est_price_gbp: number }[]
  steps: { position: number; content: string }[]
}

export type ShoppingItem = {
  name: string
  grams: number
  estimated_cost_gbp: number
  appears_in: string[]
}

export type ShoppingCategory = {
  name: string
  items: ShoppingItem[]
}

export type ShoppingList = {
  categories: ShoppingCategory[]
  total_ingredients: number
  estimated_total_cost_gbp: number
}

export async function createPlan(req: PlanRequest): Promise<PlanResponse> {
  const r = await fetch(`${BASE_URL}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!r.ok) throw new Error(`Plan request failed: ${r.status}`)
  return r.json()
}

export async function getRecipe(id: number): Promise<RecipeDetail> {
  const r = await fetch(`${BASE_URL}/recipes/${id}`)
  if (!r.ok) throw new Error(`Recipe request failed: ${r.status}`)
  return r.json()
}

export async function swapMeal(args: {
  original_recipe_id: number
  reason: string
  plan_context: PlanRequest
}): Promise<PlannedMeal> {
  const r = await fetch(`${BASE_URL}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error(`Swap failed: ${r.status}`)
  return r.json()
}

export async function getShoppingList(args: {
  recipe_ids: number[]
  household_size: number
}): Promise<ShoppingList> {
  const r = await fetch(`${BASE_URL}/shopping-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error(`Shopping list failed: ${r.status}`)
  return r.json()
}