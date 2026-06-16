import { StepShell } from "./StepShell"
import { VIBES, type WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepVibe({ state, update, onNext, onBack }: Props) {
  const toggle = (id: string) => {
    if (state.selectedVibes.includes(id)) {
      update({ selectedVibes: state.selectedVibes.filter(v => v !== id) })
    } else if (state.selectedVibes.length < 3) {
      update({ selectedVibes: [...state.selectedVibes, id] })
    }
  }

  return (
    <StepShell
      step={2}
      totalSteps={5}
      eyebrow="The week ahead"
      title="What kind of vibe?"
      subtitle="Pick up to three. Or skip — you can describe it in your own words later."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.selectedVibes.length > 0 ? "Continue" : "Skip"}
    >
      <div className="grid grid-cols-2 gap-3">
        {VIBES.map(vibe => {
          const isSelected = state.selectedVibes.includes(vibe.id)
          const canSelect = isSelected || state.selectedVibes.length < 3
          return (
            <button
              key={vibe.id}
              onClick={() => toggle(vibe.id)}
              disabled={!canSelect}
              className={`text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? "bg-ink text-bg border-ink shadow-sm"
                  : canSelect
                  ? "bg-bg text-ink border-line hover:border-ink"
                  : "bg-bg text-muted border-line opacity-50 cursor-not-allowed"
              }`}
            >
              <p className={`font-display text-lg mb-1 ${isSelected ? "text-bg" : "text-ink"}`}>
                {vibe.label}
              </p>
              <p className={`text-xs ${isSelected ? "text-bg/70" : "text-muted"}`}>
                {vibe.description}
              </p>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted mt-4 font-mono">
        {state.selectedVibes.length} of 3 selected
      </p>
    </StepShell>
  )
}