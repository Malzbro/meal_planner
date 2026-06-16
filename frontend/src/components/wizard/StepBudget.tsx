import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
}

export function StepBudget({ state, update, onNext }: Props) {
  return (
    <StepShell
      step={1}
      totalSteps={5}
      eyebrow="Let's start"
      title="What's the budget?"
      subtitle="We'll keep the whole week under this number."
      onNext={onNext}
      canAdvance={state.budget >= 5 && state.household >= 1}
    >
      <div className="space-y-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">Weekly spend</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl text-ink">£</span>
            <input
              type="number"
              value={state.budget}
              min={5}
              max={500}
              onChange={e => update({ budget: Number(e.target.value) })}
              className="font-display text-5xl text-ink bg-transparent border-b-2 border-ink w-32 focus:outline-none focus:border-accent"
            />
            <span className="text-muted text-sm">per week</span>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-muted mb-3">Household</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => update({ household: n })}
                className={`w-12 h-12 rounded-md border transition-colors ${
                  state.household === n
                    ? "bg-ink text-bg border-ink"
                    : "bg-bg text-ink border-line hover:border-ink"
                }`}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  )
}