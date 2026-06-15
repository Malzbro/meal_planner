import { useState } from "react"
import type { PlanRequest } from "@/lib/api"

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten_free", "dairy_free",
  "nut_free", "halal", "high_protein", "low_carb"
] as const

const APPLIANCE_OPTIONS = [
  "oven", "air_fryer", "slow_cooker", "blender", "grill", "microwave"
] as const

type Props = {
  onSubmit: (req: PlanRequest) => void
  loading: boolean
}

export function PlannerForm({ onSubmit, loading }: Props) {
  const [budget, setBudget] = useState(25)
  const [household, setHousehold] = useState(2)
  const [calories, setCalories] = useState(600)
  const [tags, setTags] = useState<string[]>([])
  const [excludedAppliances, setExcludedAppliances] = useState<string[]>([])
  const [preferenceText, setPreferenceText] = useState("")

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const submit = () => {
    onSubmit({
      weekly_budget_gbp: budget,
      household_size: household,
      target_calories_per_serving: calories,
      required_tags: tags,
      excluded_appliances: excludedAppliances,
      preferred_cuisines: [],
      preference_text: preferenceText,
      meals_per_week: 7,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Weekly plan</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-4">
          What's your week look like?
        </h1>
        <p className="text-muted text-lg">
          Tell us your budget and what you're in the mood for. We'll do the maths.
        </p>
      </div>

      <div className="space-y-10">
        <Section label="Budget">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-ink">£</span>
            <input
              type="number"
              value={budget}
              min={5}
              max={500}
              onChange={e => setBudget(Number(e.target.value))}
              className="font-display text-5xl text-ink bg-transparent border-b-2 border-ink w-32 focus:outline-none focus:border-accent"
            />
            <span className="text-muted text-sm">per week</span>
          </div>
        </Section>

        <Section label="Household size">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setHousehold(n)}
                className={`w-12 h-12 rounded-md border transition-colors ${
                  household === n
                    ? "bg-ink text-bg border-ink"
                    : "bg-bg text-ink border-line hover:border-ink"
                }`}
              >{n}</button>
            ))}
          </div>
        </Section>

        <Section label="Calorie target per serving">
          <input
            type="range"
            min={300} max={1000} step={50}
            value={calories}
            onChange={e => setCalories(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="text-muted text-sm mt-2">
            <span className="text-ink font-mono">{calories}</span> kcal
          </div>
        </Section>

        <Section label="Dietary needs">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(opt => (
              <Chip
                key={opt}
                active={tags.includes(opt)}
                onClick={() => setTags(toggle(tags, opt))}
              >{opt.replace("_", " ")}</Chip>
            ))}
          </div>
        </Section>

        <Section label="Appliances you don't have">
          <div className="flex flex-wrap gap-2">
            {APPLIANCE_OPTIONS.map(opt => (
              <Chip
                key={opt}
                active={excludedAppliances.includes(opt)}
                onClick={() => setExcludedAppliances(toggle(excludedAppliances, opt))}
              >{opt.replace("_", " ")}</Chip>
            ))}
          </div>
        </Section>

        <Section label="Anything else?">
          <textarea
            value={preferenceText}
            onChange={e => setPreferenceText(e.target.value)}
            placeholder="e.g. quick weeknight dinners, lots of veg, nothing too spicy"
            rows={3}
            className="w-full bg-transparent border border-line rounded-md p-3 focus:outline-none focus:border-ink resize-none text-ink placeholder:text-muted"
          />
        </Section>

        <button
          onClick={submit}
          disabled={loading}
          className="bg-accent text-accent-fg font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Planning your week..." : "Plan my week"}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted mb-3">{label}</p>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
        active
          ? "bg-ink text-bg border-ink"
          : "bg-bg text-ink border-line hover:border-ink"
      }`}
    >{children}</button>
  )
}