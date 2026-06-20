import { useEffect, useState } from "react"
import { Leaf } from "@/components/Leaf"
import { useCountUp } from "@/lib/useCountUp"
import { gbp } from "@/lib/utils"
import type { PlanResponse } from "@/lib/api"

type Props = {
  plan: PlanResponse
  onComplete: () => void
}

const HEADLINE = "Your week is ready."

export function PlanReveal({ plan, onComplete }: Props) {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(onComplete, 3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  // Count-ups start as phase 2 begins (~600ms) and resolve well before the hold beat ends.
  const cost = useCountUp(plan.total_cost_gbp, 1200, 700)
  const cal = useCountUp(Math.round(plan.avg_calories_per_serving), 1200, 700)
  const meals = useCountUp(plan.meals.length, 1200, 700)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-sm transition-opacity duration-700 ${
        phase === 4 ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes leafBloom {
          from { stroke-dashoffset: 240; }
          to   { stroke-dashoffset: 0; }
        }
        .leaf-bloom path {
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          animation: leafBloom 600ms ease-out forwards;
        }
      `}</style>

      <div className="flex items-center gap-8">
        {/* Leaf: blooms in phase 1, shrinks + shifts left in phase 2+ */}
        <div
          className={`leaf-bloom text-accent transition-transform duration-700 ease-out ${
            phase === 1 ? "scale-100" : "scale-75 -translate-x-1"
          }`}
        >
          <Leaf className="w-20 h-20" />
        </div>

        {/* Text column: gated on phase >= 2 */}
        <div className="flex flex-col min-w-[18rem]">
          <h1 className="font-display text-4xl text-ink leading-none min-h-[2.5rem]">
            {phase >= 2 &&
              HEADLINE.split("").map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-500"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
          </h1>

          <div
            className="h-px bg-accent mt-3 origin-left transition-transform duration-700 ease-out"
            style={{
              transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
              transitionDelay: "1000ms",
            }}
          />

          {phase >= 2 && (
            <p className="font-mono text-sm text-muted mt-3 animate-in fade-in duration-500" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              {meals} meals · {gbp(cost)} · {cal} kcal avg
            </p>
          )}

          {phase >= 3 && (
            <p className="text-xs uppercase tracking-widest text-muted mt-6 animate-in fade-in duration-700">
              Tap any meal to swap or see the recipe.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}