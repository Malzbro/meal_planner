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

  switch (state.step) {
    case 1:
      return <StepBudget state={state} update={update} onNext={next} />
    case 2:
      return <StepVibe state={state} update={update} onNext={next} onBack={back} />
    case 3:
      return <StepDietary state={state} update={update} onNext={next} onBack={back} />
    case 4:
      return <StepAppliances state={state} update={update} onNext={next} onBack={back} />
    case 5:
      return <StepFreeform state={state} update={update} onNext={submit} onBack={back} loading={loading} />
    default:
      return null
  }
}