/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate"
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "#FAFAF8",
        ink: "#0F0F10",
        muted: "#6F6F73",
        line: "#E8E5DE",
        accent: {
          DEFAULT: "#6B2737",
          fg: "#FAFAF8",
        },
        chip: "#F1EDE5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [animate],
}