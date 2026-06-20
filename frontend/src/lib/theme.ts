const KEY = "pantry-theme"

export type Theme = "light" | "dark"

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(KEY) as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  localStorage.setItem(KEY, theme)
}

export function isDark(): boolean {
  return document.documentElement.classList.contains("dark")
}