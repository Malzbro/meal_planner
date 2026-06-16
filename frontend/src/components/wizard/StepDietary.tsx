import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten_free", "dairy_free",
  "nut_free", "halal", "high_protein", "low_carb"
] as const

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepDietary({ state, update, onNext, onBack }: Props) {
  const toggle = (tag: string) => {
    update({
      dietaryTags: state.dietaryTags.includes(tag)
        ? state.dietaryTags.filter(t => t !== tag)
        : [...state.dietaryTags, tag]
    })
  }

  return (
    <StepShell
      step={3}
      totalSteps={5}
      eyebrow="The rules"
      title="Any dietary needs?"
      subtitle="We'll only suggest meals that fit. Skip if none apply."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.dietaryTags.length > 0 ? "Continue" : "Skip"}
    >
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-4 py-2 rounded-md text-sm border transition-colors ${
              state.dietaryTags.includes(opt)
                ? "bg-ink text-bg border-ink"
                : "bg-bg text-ink border-line hover:border-ink"
            }`}
          >
            {opt.replace("_", " ")}
          </button>
        ))}
      </div>
    </StepShell>
  )
}