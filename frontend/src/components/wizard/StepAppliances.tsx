import { useEffect, useRef, useState } from "react"
import { StepShell } from "./StepShell"
import type { WizardState } from "@/lib/vibes"

// Glob-import any appliance images that exist on disk.
// Place PNGs or SVGs in frontend/src/assets/appliances/ to replace placeholders.
// Vite only includes files that actually exist — no build error when assets are missing.
const imageModules = import.meta.glob<{ default: string }>(
  "../../assets/appliances/*.{png,svg}",
  { eager: true }
)
const applianceImages: Record<string, string> = {}
for (const [path, mod] of Object.entries(imageModules)) {
  const filename = path.split("/").pop()?.replace(/\.(png|svg)$/, "")
  if (filename) applianceImages[filename] = mod.default
}

// Kitchen background — drop a file at frontend/src/assets/kitchen-bg.png (or .svg/.jpg)
const kitchenBgModules = import.meta.glob<{ default: string }>(
  "../../assets/kitchen-bg.{png,svg,jpg,jpeg,webp}",
  { eager: true }
)
const kitchenBg: string | undefined =
  Object.values(kitchenBgModules)[0]?.default

type Appliance = {
  id: string
  label: string
  /** % from left edge of scene */
  x: number
  /** % from top of scene */
  y: number
  /** width as % of scene container — scales on mobile */
  size: number
}

const APPLIANCES: Appliance[] = [
  // Positions reference the top-left of the icon, as % of the scene container.
  // Tuned against a 16:9 minimalist kitchen background — fine-tune to taste.
  { id: "oven",        label: "Oven",        x: 60, y: 64, size: 4 }, // on the stove
  { id: "microwave",   label: "Microwave",   x: 81, y: 50, size: 4 }, // back-right counter
  { id: "air_fryer",   label: "Air fryer",   x: 55, y: 47, size: 2 }, // left counter, right of sink
  { id: "blender",     label: "Blender",     x: 20, y: 44, size: 4 }, // right of stove
  { id: "slow_cooker", label: "Slow cooker", x: 45, y: 47, size: 3 }, // peninsula back
  { id: "grill",       label: "Grill",       x: 65, y: 45, size: 4 }, // peninsula front
]

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepAppliances({ state, update, onNext, onBack }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  // On first mount, default to "nothing selected" — fill excludedAppliances with all IDs
  // if it hasn't been touched yet. Guarded so user choices aren't reset on navigation back.
  const initRef = useRef(false)
  useEffect(() => {
    if (!initRef.current && state.excludedAppliances.length === 0) {
      update({ excludedAppliances: APPLIANCES.map(a => a.id) })
    }
    initRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOwned = (id: string) => !state.excludedAppliances.includes(id)

  const toggle = (id: string) => {
    update({
      excludedAppliances: state.excludedAppliances.includes(id)
        ? state.excludedAppliances.filter(a => a !== id)
        : [...state.excludedAppliances, id],
    })
  }

  const hasImage = (id: string) => id in applianceImages && !imgErrors.has(id)
  const onImgError = (id: string) =>
    setImgErrors(prev => new Set(prev).add(id))

  return (
    <StepShell
      step={4}
      totalSteps={5}
      eyebrow="Your kitchen"
      title="What's on your counter?"
      subtitle="Tap the appliances you have. We'll plan around them."
      onNext={onNext}
      onBack={onBack}
      nextLabel={state.excludedAppliances.length > 0 ? "Continue" : "Skip"}
    >
      <div
        className="relative w-full mx-auto overflow-hidden rounded-xl border border-line"
        style={{
          maxWidth: 800,
          aspectRatio: "16 / 9",
          backgroundImage: kitchenBg
            ? `url(${kitchenBg})`
            : "linear-gradient(180deg, #E8E4DF 0%, #E8E4DF 45%, #D6D0C8 45%, #D6D0C8 48%, #F0EDE8 48%, #F0EDE8 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Subtle scrim so icons read against any background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(250, 250, 248, 0.15)" }}
        />

        {/* (Old back-wall line removed — the background carries the scene now) */}

        {APPLIANCES.map(app => {
          const owned = isOwned(app.id)
          const hovered = hoveredId === app.id
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => toggle(app.id)}
              onMouseEnter={() => setHoveredId(app.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="absolute focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
              style={{
                left: `${app.x}%`,
                top: `${app.y}%`,
                // Responsive sizing: never smaller than 44px (tap target), never larger than ~90px.
                // The middle value scales with the scene width (~app.size %).
                width: `clamp(44px, ${app.size * 1.4}vw, 90px)`,
                transform: `translateY(${hovered ? -4 : 0}px)`,
                transition:
                  "transform 200ms ease, opacity 200ms ease, filter 200ms ease",
                opacity: owned ? 1 : 0.45,
                filter: owned
                  ? "drop-shadow(0 0 10px rgba(107,39,55,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
                  : hovered
                    ? "drop-shadow(0 4px 8px rgba(0,0,0,0.18)) grayscale(0.4)"
                    : "grayscale(0.6) brightness(0.95)",
                zIndex: hovered ? 10 : 1,
              }}
              aria-label={`${app.label} — ${owned ? "selected" : "not selected"}`}
              aria-pressed={owned}
            >
              {owned && (
                <div
                  className="absolute -inset-2 rounded-xl pointer-events-none"
                  style={{
                    border: "2px solid #6B2737",
                    boxShadow: "0 0 12px rgba(107,39,55,0.3)",
                  }}
                />
              )}

              {hasImage(app.id) ? (
                <img
                  src={applianceImages[app.id]}
                  alt={app.label}
                  onError={() => onImgError(app.id)}
                  draggable={false}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              ) : (
                <div
                  className="rounded-lg border-2 border-dashed border-current flex items-center justify-center text-center px-1"
                  style={{ width: "100%", aspectRatio: "1 / 0.85" }}
                >
                  <span className="text-[11px] font-mono leading-tight opacity-70">
                    {app.label}
                  </span>
                </div>
              )}

              <span
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none text-xs font-medium px-2 py-1 rounded bg-ink text-bg"
                style={{
                  bottom: "calc(100% + 8px)",
                  opacity: hovered ? 1 : 0,
                  transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)`,
                  transition: "opacity 150ms ease, transform 150ms ease",
                }}
              >
                {app.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-center text-sm text-muted mt-4">
        Tap an appliance to add it to your kitchen. Tap again to remove.
      </p>
    </StepShell>
  )
}