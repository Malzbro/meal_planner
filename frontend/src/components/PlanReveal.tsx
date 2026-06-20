import { useEffect, useState } from "react"
import { Leaf } from "@/components/Leaf"
//import { useCountUp } from "@/lib/useCountUp"
//import { gbp } from "@/lib/utils"
import type { PlanResponse } from "@/lib/api"

type Props = {
  plan: PlanResponse
  onComplete: () => void
}

const HEADLINE = "Your week is ready."

export function PlanReveal({onComplete }: Props) {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(2), 1200),  // longer anticipation
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3800),
      setTimeout(onComplete, 6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  // Count-ups start as phase 2 begins (~600ms) and resolve well before the hold beat ends.
  //const cost = useCountUp(plan.total_cost_gbp, 1400, 1300)
  //const cal = useCountUp(Math.round(plan.avg_calories_per_serving), 1400, 1300)
  //const meals = useCountUp(plan.meals.length, 1400, 1300)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-bg transition-opacity duration-700 ${
        phase === 4 ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
          @keyframes leafBloom {
            from { stroke-dashoffset: 240; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes leafPulse {
            0%, 100% { transform: var(--leaf-scale, scale(1)); }
            50%      { transform: var(--leaf-scale, scale(1)) scale(1.04); }
          }
          .leaf-bloom path {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 240;
            stroke-dashoffset: 240;
            animation: leafBloom 1000ms ease-out forwards;
          }
          .leaf-wrapper {
            animation: leafPulse 2200ms ease-in-out infinite;
            transition: --leaf-scale 700ms ease-out, transform 700ms ease-out;
          }
      `}</style>

      <div className="flex items-center gap-8">
        {/* Leaf: fades in, blooms, pulses — stays centered throughout */}
        <div
          className="leaf-wrapper leaf-bloom text-accent animate-in fade-in duration-700"
        >
          <Leaf className="w-20 h-20" />
        </div>

         {/* Anticipation hint — phase 1 only */}
         {phase === 1 && (
           <p className="absolute left-1/2 -translate-x-1/2 top-full mt-8 text-xs uppercase tracking-widest text-muted animate-pulse whitespace-nowrap">
             Composing your week
           </p>
         )}

        {/* Text column: gated on phase >= 2 */}
        <div className="flex flex-col min-w-[18rem]">
          <h1 className="font-display text-4xl text-ink leading-none min-h-[2.5rem] flex gap-[0.25em] flex-wrap">
            {phase >= 2 &&
              HEADLINE.split(" ").map((word, i) => (
                <span
                  key={i}
                  className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-500"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
                >
                  {word}
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