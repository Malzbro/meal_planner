import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
}

export function StepFreeform({ state, update, onNext, onBack, loading }: Props) {
  return (
    <StepShell
      step={5}
      totalSteps={5}
      eyebrow="Almost there"
      title="Anything else?"
      subtitle="Add any specifics in your own words. Or just plan the week."
      onNext={onNext}
      onBack={onBack}
      nextLabel={loading ? "Planning your week..." : "Plan my week"}
      canAdvance={!loading}
    >
      <div>
        <p className="text-xs uppercase tracking-widest text-muted mb-3">Free text</p>
        <textarea
          value={state.preferenceText}
          onChange={e => update({ preferenceText: e.target.value })}
          placeholder="e.g. lots of veg, nothing too sweet, prefer one-pot meals"
          rows={4}
          className="w-full bg-transparent border border-line rounded-md p-3 focus:outline-none focus:border-ink resize-none text-ink placeholder:text-muted"
          disabled={loading}
        />
        <p className="text-xs text-muted mt-2">
          Optional — leave blank to skip.
        </p>
      </div>
    </StepShell>
  )
}