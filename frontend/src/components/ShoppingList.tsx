import { useEffect, useState } from "react"
import type { ShoppingList } from "@/lib/api"
import { getShoppingList } from "@/lib/api"
import { gbp } from "@/lib/utils"

// Ingredients we display in ml instead of g. Conservative list — only
// things that are unambiguously liquid in cooking contexts.
const LIQUID_KEYWORDS = [
  "water", "oil", "milk", "cream", "stock", "broth", "juice",
  "vinegar", "sauce", "wine", "yogurt", "yoghurt", "honey", "syrup",
  "passata",
]

function isLiquid(name: string): boolean {
  const lower = name.toLowerCase()
  return LIQUID_KEYWORDS.some(kw => lower.includes(kw))
}

type Props = {
  recipeIds: number[]
  householdSize: number
}

export function ShoppingListView({ recipeIds, householdSize }: Props) {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    getShoppingList({ recipe_ids: recipeIds, household_size: householdSize })
      .then(data => {
        setList(data)
        setError(null)
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load list"))
      .finally(() => setLoading(false))
  }, [recipeIds, householdSize])

  const toggle = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const formatQuantity = (grams: number, name: string): string => {
    if (isLiquid(name)) {
      // Liquids: display as ml (1g ≈ 1ml is close enough for shopping)
      if (grams >= 1000) return `${(grams / 1000).toFixed(1)}L`
      return `${grams}ml`
    }
    if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`
    return `${grams}g`
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-3 w-24 bg-chip rounded-sm mb-3" />
        <div className="h-10 w-2/3 bg-chip rounded-sm mb-12" />
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-8">
            <div className="h-3 w-32 bg-chip rounded-sm mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-6 bg-chip rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-accent">{error ?? "Couldn't build the list."}</p>
      </div>
    )
  }

  const totalChecked = checkedItems.size

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <p className="text-xs uppercase tracking-widest text-muted mb-3">Shopping list</p>
      <h2 className="font-display text-4xl text-ink mb-2">
        {list.total_ingredients} items
      </h2>
      <p className="text-muted mb-10">
        Estimated total: <span className="font-mono text-ink">{gbp(list.estimated_total_cost_gbp)}</span>
        {" · "}
        scaled for {householdSize} {householdSize === 1 ? "person" : "people"}
        {totalChecked > 0 && (
          <> · <span className="font-mono">{totalChecked}/{list.total_ingredients}</span> checked</>
        )}
      </p>

      <div className="space-y-8">
        {list.categories.map((category, ci) => (
          <div
            key={category.name}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${ci * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-line">
              <p className="text-xs uppercase tracking-widest text-muted">{category.name}</p>
              <p className="text-xs font-mono text-muted">{category.items.length}</p>
            </div>
            <ul className="space-y-1">
              {category.items.map((item, i) => {
                const key = `${category.name}-${i}`
                const isChecked = checkedItems.has(key)
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-baseline gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-chip/60 transition-colors text-left group"
                    >
                      <span className={`w-4 h-4 flex-shrink-0 rounded-sm border transition-colors mt-0.5 ${
                        isChecked ? "bg-accent border-accent" : "border-line group-hover:border-ink"
                      }`}>
                        {isChecked && (
                          <svg viewBox="0 0 16 16" fill="none" className="text-bg">
                            <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className={`flex-1 text-sm ${isChecked ? "line-through text-muted" : "text-ink"}`}>
                        {item.name}
                      </span>
                      <span className="font-mono text-xs text-muted whitespace-nowrap">
                        {formatQuantity(item.grams, item.name)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted mt-12 text-center">
        Quantities are rounded for shopping. Tap items to check them off.
      </p>
    </div>
  )
}