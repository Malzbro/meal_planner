import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Used as a key for cross-fading content when switching between cards. */
  contentKey: string
  width?: "narrow" | "wide"
  children: React.ReactNode
}

export function Sheet({
  open,
  onClose,
  title,
  contentKey,
  width = "narrow",
  children,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Two-phase mount so we get an exit animation
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  // Cross-fade content when the active card changes mid-open
  const [displayedKey, setDisplayedKey] = useState(contentKey)
  const [displayedChildren, setDisplayedChildren] = useState(children)
  const [displayedTitle, setDisplayedTitle] = useState(title)
  const [contentVisible, setContentVisible] = useState(true)

  // Latch the width while open so it doesn't snap during close
  const [displayedWidth, setDisplayedWidth] = useState(width)

  useEffect(() => {
    if (open) setDisplayedWidth(width)
  }, [open, width])

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement
      setMounted(true)
      let cancelled = false
      // Double rAF so the browser paints the off-screen state before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setVisible(true)
        })
      })
      return () => { cancelled = true }
    } else if (mounted) {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 500)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) {
      setDisplayedKey(contentKey)
      setDisplayedChildren(children)
      setDisplayedTitle(title)
      return
    }
    if (contentKey === displayedKey) {
      setDisplayedChildren(children)
      setDisplayedTitle(title)
      return
    }
    setContentVisible(false)
    const t = setTimeout(() => {
      setDisplayedKey(contentKey)
      setDisplayedChildren(children)
      setDisplayedTitle(title)
      setContentVisible(true)
    }, 200)
    return () => clearTimeout(t)
  }, [contentKey, children, title, mounted, displayedKey])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Focus the first item + tab trap
  useEffect(() => {
    if (!visible || !sheetRef.current) return
    const root = sheetRef.current
    const getFocusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
    getFocusable()[0]?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleTab)
    return () => document.removeEventListener("keydown", handleTab)
  }, [visible])

  // Restore focus on close
  useEffect(() => {
    if (!mounted) previouslyFocused.current?.focus()
  }, [mounted])

  // Body scroll lock
  useEffect(() => {
    if (!mounted) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={displayedTitle}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-ink backdrop-blur-3xl transition-opacity ease-out"
        style={{
          opacity: visible ? 0.5 : 0,
          transitionDuration: "450ms",
        }}
      />

      {/* Sheet — card-style, constrained to page column, lifted off bottom */}
      <div className="absolute inset-x-0 bottom-4 sm:bottom-6 px-4 sm:px-6 pointer-events-none">
        <div
          ref={sheetRef}
          className={`mx-auto bg-bg rounded-2xl border-2 border-accent shadow-2xl flex flex-col pointer-events-auto transition-[max-width] duration-300 ease-out ${
            displayedWidth === "wide" ? "max-w-3xl" : "max-w-md"
          }`}
          style={{
            height: "min(65vh, 720px)",
            maxHeight: "85vh",
            transform: visible ? "translateY(0)" : "translateY(110%)",
            transition: visible
              ? "transform 550ms cubic-bezier(0.16, 1, 0.3, 1), max-width 300ms ease-out"
              : "transform 450ms cubic-bezier(0.4, 0, 1, 1), max-width 300ms ease-out",
          }}
        >
          {/* Sticky header */}
          <div className="px-6 pt-3 pb-4 border-b border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted">{displayedTitle}</span>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="text-muted hover:text-ink transition-colors p-1 -mr-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 5L15 15M15 5L5 15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body — scrolls independently, cross-fades on contentKey change */}
          <div className="flex-1 overflow-y-auto">
            <div
              className="px-6 py-6 transition-opacity"
              style={{
                opacity: visible && contentVisible ? 1 : 0,
                transitionDuration: "200ms",
              }}
            >
              {displayedChildren}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}