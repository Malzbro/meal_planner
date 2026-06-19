import { useEffect, useState } from "react"
import { Leaf } from "./Leaf"

type Props = {
  onComplete: () => void
}

export function PlanReveal({ onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400)
    const t2 = setTimeout(() => setPhase("exit"), 1100)
    const t3 = setTimeout(onComplete, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  const opacity = phase === "exit" ? "opacity-0" : "opacity-100"

  return (
    <div className={`max-w-4xl mx-auto transition-opacity duration-400 ${opacity}`}>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="mb-6 animate-in fade-in zoom-in-50 duration-500">
          <Checkmark />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
          Your week is sorted
        </p>
        <h2 className="font-display text-4xl text-ink flex items-center gap-3 justify-center">
          <Leaf className="text-accent" size={20} />
          <span>Your week is sorted</span>
        </h2>
      </div>
    </div>
  )
}

function Checkmark() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" stroke="#6B2737" strokeWidth="2" />
      <path
        d="M16 28L24 36L40 20"
        stroke="#6B2737"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 40,
          strokeDashoffset: 40,
          animation: "draw-check 0.5s ease-out 0.2s forwards",
        }}
      />
      <style>{`
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}