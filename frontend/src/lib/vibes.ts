export type Vibe = {
  id: string
  label: string
  description: string
  preferenceText: string
  dietaryTags: string[]
  cuisineBias: string[]
}

export const VIBES: Vibe[] = [
  {
    id: "quick",
    label: "Quick & Easy",
    description: "Weeknight-friendly, under 30 minutes",
    preferenceText: "quick weeknight meals under 30 minutes, simple ingredients",
    dietaryTags: [],
    cuisineBias: [],
  },
  {
    id: "comfort",
    label: "Healthy Comfort",
    description: "Wholesome but still cosy",
    preferenceText: "wholesome comforting meals with vegetables",
    dietaryTags: [],
    cuisineBias: [],
  },
  {
    id: "fakeaway",
    label: "Fakeaway",
    description: "Takeaway energy, home prices",
    preferenceText: "takeaway-style indulgent comfort food",
    dietaryTags: [],
    cuisineBias: ["chinese", "indian", "mexican", "american"],
  },
  {
    id: "family",
    label: "Family Friendly",
    description: "Crowd-pleasers, easy to scale",
    preferenceText: "hearty family-friendly dinners that please everyone",
    dietaryTags: [],
    cuisineBias: ["british", "italian"],
  },
  {
    id: "protein",
    label: "High Protein",
    description: "Filling, protein-rich meals",
    preferenceText: "protein-rich meals with meat or legumes",
    dietaryTags: ["high_protein"],
    cuisineBias: [],
  },
  {
    id: "plant",
    label: "Plant-Forward",
    description: "Vegetable-heavy, mostly meat-free",
    preferenceText: "vegetable-heavy plant-based meals",
    dietaryTags: ["vegetarian"],
    cuisineBias: ["mediterranean", "indian", "middle_eastern"],
  },
  {
    id: "world",
    label: "World Food",
    description: "International variety, bold flavours",
    preferenceText: "varied international dishes with bold flavours",
    dietaryTags: [],
    cuisineBias: ["indian", "thai", "japanese", "mexican", "african"],
  },
  {
    id: "budget",
    label: "Budget Stretch",
    description: "Maximum filling, minimum spend",
    preferenceText: "the most affordable filling meals, budget-conscious",
    dietaryTags: [],
    cuisineBias: [],
  },
]


export type WizardState = {
  step: number
  budget: number
  household: number
  calories: number
  selectedVibes: string[]
  dietaryTags: string[]
  excludedAppliances: string[]
  preferenceText: string
}


import type { PlanRequest } from "@/lib/api"

export function buildPlanRequest(state: WizardState): PlanRequest {
  const selected = VIBES.filter(v => state.selectedVibes.includes(v.id))
  const vibePrefText = selected.map(v => v.preferenceText).join(". ")
  const vibeTags = selected.flatMap(v => v.dietaryTags)
  const vibeCuisines = selected.flatMap(v => v.cuisineBias)

  // Merge user free-text with vibe-derived text
  const combinedPrefText = [state.preferenceText, vibePrefText]
    .filter(Boolean)
    .join(". ")

  // Union of dietary tags from explicit selection + vibes
  const combinedTags = Array.from(new Set([...state.dietaryTags, ...vibeTags]))

  // Cuisine bias is union, deduplicated
  const combinedCuisines = Array.from(new Set(vibeCuisines))

  return {
    weekly_budget_gbp: state.budget,
    household_size: state.household,
    target_calories_per_serving: state.calories,
    required_tags: combinedTags,
    excluded_appliances: state.excludedAppliances,
    preferred_cuisines: combinedCuisines,
    preference_text: combinedPrefText,
    meals_per_week: 7,
  }
}


export const INITIAL_STATE: WizardState = {
  step: 1,
  budget: 25,
  household: 2,
  calories: 600,
  selectedVibes: [],
  dietaryTags: [],
  excludedAppliances: [],
  preferenceText: "",
}

export const TOTAL_STEPS = 5