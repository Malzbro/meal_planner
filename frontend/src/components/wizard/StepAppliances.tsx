import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

const APPLIANCE_OPTIONS = [
  { id: "oven", label: "Oven" },
  { id: "air_fryer", label: "Air fryer" },
  { id: "slow_cooker", label: "Slow cooker" },
  { id: "blender", label: "Blender" },
  { id: "grill", label: "Grill" },
  { id: "microwave", label: "Microwave" },
]

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepAppliances({ state, update, onNext, onBack }: Props) {
  const toggle = (id: string) => {
    update({
      excludedAppliances: state.excludedAppliances.includes(id)
        ? state.excludedAppliances.filter(a => a !== id)
        : [...state.excludedAppliances, id]
    })
  }

  return (
    <StepShell
      step={4}
      totalSteps={5}
      eyebrow="Your kitchen"
      title="Anything you don't have?"
      subtitle="Select appliances you can't use. Otherwise we'll assume a normal kitchen."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.excludedAppliances.length > 0 ? "Continue" : "Skip"}
    >
      <div className="grid grid-cols-2 gap-2">
        {APPLIANCE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            className={`px-4 py-3 rounded-md text-sm border transition-colors ${
              state.excludedAppliances.includes(opt.id)
                ? "bg-ink text-bg border-ink"
                : "bg-bg text-ink border-line hover:border-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </StepShell>
  )
}