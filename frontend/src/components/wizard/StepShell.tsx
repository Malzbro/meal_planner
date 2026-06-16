import "./step-shell.css"
import type { ReactNode } from "react"

type Props = {
  step: number
  totalSteps: number
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  canAdvance?: boolean
  nextLabel?: string
}

export function StepShell({
  step,
  totalSteps,
  eyebrow,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  canAdvance = true,
  nextLabel = "Continue",
}: Props) {
  const progress = (step / totalSteps) * 100

  return (
    <div className="max-w-xl mx-auto step-content">
      {/* Progress bar */}
      <div className="mb-12">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted mb-2 font-mono">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-chip rounded-sm overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-550 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-muted mb-3">{eyebrow}</p>
        <h1 className="font-display text-4xl text-ink leading-tight mb-3">{title}</h1>
        {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="mb-12">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="text-sm text-muted hover:text-ink transition-colors">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="bg-accent text-accent-fg font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}