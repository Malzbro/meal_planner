import { useEffect, useState } from "react"
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
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [coldStartLabel, setColdStartLabel] = useState<string>("Planning your week...")

  useEffect(() => {
    if (!loading) {
      setColdStartLabel("Planning your week...")
      return
    }
    const t1 = setTimeout(() => setColdStartLabel("Waking up the service..."), 5000)
    const t2 = setTimeout(() => setColdStartLabel("Almost there..."), 12000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [loading])

  return (
    <StepShell
      step={5}
      totalSteps={5}
      eyebrow="Almost there"
      title="Anything else?"
      subtitle="Add any specifics in your own words. Or just plan the week."
      onNext={onNext}
      onBack={onBack}
      nextLabel={loading ? coldStartLabel : "Plan my week"}
      canAdvance={!loading}
    >
      <div className="space-y-8">
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

        <div>
          {!showAdvanced ? (
            <button
              onClick={() => setShowAdvanced(true)}
              className="text-sm text-muted hover:text-accent transition-colors"
              disabled={loading}
            >
              + Advanced options
            </button>
          ) : (
            <div className="border-t border-line pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-muted">Calorie target per serving</p>
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="text-xs text-muted hover:text-ink transition-colors"
                  disabled={loading}
                >
                  Hide
                </button>
              </div>
              <input
                type="range"
                min={300}
                max={1000}
                step={50}
                value={state.calories}
                onChange={e => update({ calories: Number(e.target.value) })}
                className="w-full accent-accent"
                disabled={loading}
              />
              <div className="text-muted text-sm mt-2">
                <span className="text-ink font-mono">{state.calories}</span> kcal per serving
              </div>
              <p className="text-xs text-muted mt-2">
                The planner aims for this on average. Default is 600 kcal — typical adult dinner range.
              </p>
            </div>
          )}
        </div>
      </div>
    </StepShell>
  )
}