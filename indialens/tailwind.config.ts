import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── IndiaLens Apple-Dark Design System ──────────────────
        bg:       "#000000",
        surface:  "#0A0A0A",
        elevated: "#141414",
        overlay:  "#1C1C1E",

        // Apple System Accents
        accent:   "#E11D48",   // rose / brand
        "accent-hover": "#F43F5E",

        // Apple system palette
        "sys-blue":   "#0A84FF",
        "sys-green":  "#30D158",
        "sys-amber":  "#FF9F0A",
        "sys-red":    "#FF453A",
        "sys-purple": "#BF5AF2",
        "sys-teal":   "#5AC8F5",

        // Text hierarchy
        "text-primary":   "#F5F5F7",
        "text-secondary": "#86868B",
        "text-tertiary":  "#48484A",

        // Borders
        "border-default": "rgba(255,255,255,0.08)",
        "border-focus":   "rgba(255,255,255,0.18)",
        "border-subtle":  "rgba(255,255,255,0.04)",

        // Legacy aliases (keep components that use these working)
        primary: {
          DEFAULT: "#E11D48",
          hover:   "#F43F5E",
          muted:   "rgba(225,29,72,0.12)",
        },
        secondary: {
          DEFAULT: "#FF9F0A",
          muted:   "rgba(255,159,10,0.12)",
        },
        success: "#30D158",
        warning: "#FF9F0A",
        danger:  "#FF453A",
        text: {
          primary:   "#F5F5F7",
          secondary: "#86868B",
          muted:     "#48484A",
        },

        // Old dark system (kept for CollegeCard / ScoreRing inline styles)
        border: "rgba(255,255,255,0.08)",
      },

      fontFamily: {
        display: ["-apple-system", "SF Pro Display", "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body:    ["-apple-system", "SF Pro Text",    "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:    ["JetBrains Mono", "SF Mono", "Fira Code", "ui-monospace", "monospace"],
        sans:    ["-apple-system", "SF Pro Text",    "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },

      fontSize: {
        "display-xl": ["clamp(2.8rem, 5.5vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2rem, 4vw, 3.2rem)",     { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.4rem)",   { lineHeight: "1.12", letterSpacing: "-0.025em" }],
      },

      borderRadius: {
        sm:   "8px",
        md:   "12px",
        lg:   "16px",
        xl:   "20px",
        full: "9999px",
        card: "16px",
        tag:  "9999px",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":       "radial-gradient(ellipse 60% 50% at 50% -5%, rgba(225,29,72,0.12) 0%, transparent 70%)",
        "card-gradient":   "linear-gradient(135deg, #0A0A0A 0%, #141414 100%)",
        "noise":           "url('/noise.svg')",
      },

      boxShadow: {
        sm:         "0 1px 2px rgba(0,0,0,0.5)",
        md:         "0 4px 16px rgba(0,0,0,0.4)",
        lg:         "0 8px 32px rgba(0,0,0,0.5)",
        card:       "0 0 0 1px rgba(255,255,255,0.08)",
        "glow":     "0 0 24px rgba(225,29,72,0.18)",
        "glow-blue":"0 0 24px rgba(10,132,255,0.15)",
        "glow-green":"0 0 24px rgba(48,209,88,0.15)",
      },

      animation: {
        "fade-in":    "fadeIn 0.35s ease forwards",
        "slide-up":   "slideUp 0.4s ease forwards",
        "slide-down": "slideDown 0.25s ease forwards",
        "pulse-dot":  "pulseDot 2s ease-in-out infinite",
        "number-roll":"numberRoll 0.8s ease forwards",
        "ring-fill":  "ringFill 1.2s ease forwards",
      },

      keyframes: {
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideDown:  { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot:   { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        numberRoll: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        ringFill:   { from: { "stroke-dashoffset": "339" }, to: { "stroke-dashoffset": "var(--ring-offset)" } },
      },
    },
  },
  plugins: [],
};

export default config;
