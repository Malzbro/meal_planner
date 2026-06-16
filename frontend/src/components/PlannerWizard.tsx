import { useState } from "react"
import { INITIAL_STATE, TOTAL_STEPS, buildPlanRequest, type WizardState } from "@/lib/vibes"
import type { PlanRequest } from "@/lib/api"
import { StepBudget } from "./wizard/StepBudget"
import { StepVibe } from "./wizard/StepVibe"
import { StepDietary } from "./wizard/StepDietary"
import { StepAppliances } from "./wizard/StepAppliances"
import { StepFreeform } from "./wizard/StepFreeform"


type Props = {
  onSubmit: (req: PlanRequest) => void
  loading: boolean
}

export function PlannerWizard({ onSubmit, loading }: Props) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  const update = (patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch }))
  const next = () => setState(s => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) }))
  const back = () => setState(s => ({ ...s, step: Math.max(s.step - 1, 1) }))

  const submit = () => onSubmit(buildPlanRequest(state))

return (
    <div key={state.step}>
      {state.step === 1 && <StepBudget state={state} update={update} onNext={next} />}
      {state.step === 2 && <StepVibe state={state} update={update} onNext={next} onBack={back} />}
      {state.step === 3 && <StepDietary state={state} update={update} onNext={next} onBack={back} />}
      {state.step === 4 && <StepAppliances state={state} update={update} onNext={next} onBack={back} />}
      {state.step === 5 && <StepFreeform state={state} update={update} onNext={submit} onBack={back} loading={loading} />}
    </div>
  )
}