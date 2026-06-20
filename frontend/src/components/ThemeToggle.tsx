import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { getInitialTheme, applyTheme, type Theme } from "@/lib/theme"

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  useEffect(() => {
    applyTheme(theme)
    window.dispatchEvent(new CustomEvent("pantry-theme-change", { detail: theme }))
  }, [theme])

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"))
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Toggle light mode" : "Toggle dark mode"}
      className="w-9 h-9 flex items-center justify-center rounded-md text-ink hover:bg-chip active:scale-95 transition-all duration-150"
    >
      <span
        key={theme}
        className="inline-flex animate-in fade-in zoom-in-90 duration-200"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  )
}