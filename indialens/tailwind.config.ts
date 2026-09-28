import type { Config } from "tailwindcss";

/**
 * Colour lives in ONE place: `src/app/globals.css`.
 *
 * This config used to declare a second, competing Apple-dark palette as literal
 * hex values (`bg: "#000000"`, `text-primary: "#F5F5F7"`, `accent: "#E11D48"`,
 * plus `fontSize.display-*`, `boxShadow.glow*`, and its own animations) while
 * `globals.css` declared a *light* palette in `:root` under a comment claiming
 * dark was the default. Two sources of truth, one of which was dead weight:
 * `bg-surface`, `text-primary`, `sys-blue` and friends were used in exactly
 * zero components, so the config's palette rendered nowhere, while the file
 * everyone actually wrote against rendered in light.
 *
 * So: the CSS custom properties are the source of truth, and every semantic
 * colour here is `rgb(var(--c-*-rgb) / <alpha-value>)`. That resolves to the
 * dark values by default, to the `[data-theme="light"]` values when the theme
 * is light, and to the `prefers-color-scheme: light` values when the OS asks
 * for light — from a single class name, with no `dark:` variant anywhere.
 *
 * If you need a new colour: add the `--c-*-rgb` triple to `:root` AND
 * `[data-theme="light"]` in globals.css, then expose it here. Never hardcode a
 * hex value in this file — that is exactly how the two systems diverged.
 */
const token = (name: string) => `rgb(var(--c-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg:       token("bg"),
        surface:  token("surface"),
        elevated: token("elevated"),
        overlay:  token("overlay"),

        // Accent (rose) — does not invert between themes
        accent:       token("accent"),
        "accent-hover": token("accent-hover"),
        "accent-dim":  "rgb(var(--c-accent-rgb) / 0.14)",

        // Text hierarchy
        ink:   token("ink"),   // primary
        "ink-2": token("ink-2"), // secondary
        "ink-3": token("ink-3"), // tertiary

        // Borders — alpha is applied at the use site, so one token serves
        // hairline (0.05) and strong (0.38) without a second palette entry.
        line:   token("line"),
        "line-2": token("line-2"),

        // System accents, for status and data
        "sys-blue":   token("blue"),
        "sys-green":  token("green"),
        "sys-amber":  token("amber"),
        "sys-red":    token("red"),
        "sys-purple": token("purple"),
        "sys-teal":   token("teal"),
      },

      fontFamily: {
        display: ["-apple-system", "SF Pro Display", "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body:    ["-apple-system", "SF Pro Text",    "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:    ["JetBrains Mono", "SF Mono", "Fira Code", "ui-monospace", "monospace"],
        sans:    ["-apple-system", "SF Pro Text",    "Inter", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },

      /**
       * Type scale. The `display-*` sizes here are duplicated by the `.display`
       * and `.headline` classes in globals.css; both now express the same
       * clamp() range so a heading written either way lands on the same size.
       * The `step-*` entries are the named type scale for new work — using
       * `text-step-1` reads better at review time than `text-[15px]` and stops
       * the ad-hoc px ramp that made pages look inconsistent with each other.
       */
      fontSize: {
        "display-xl": ["clamp(2.8rem, 5.5vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2rem, 4vw, 3.2rem)",     { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.4rem)",   { lineHeight: "1.12", letterSpacing: "-0.025em" }],

        // Quoted: `step-0` / `step-1` are valid JS numeric-literal-adjacent
        // keys and fail to parse unquoted.
        "step--1": ["13px", { lineHeight: "1.65" }],
        "step-0":  ["15px", { lineHeight: "1.6" }],
        "step-1":  ["17px", { lineHeight: "1.65" }],
        "step-2":  ["20px", { lineHeight: "1.4" }],
        "step-3":  ["24px", { lineHeight: "1.3" }],
      },

      /**
       * Radius and elevation both live here now, and both mirror the
       * `--r-*` / `--shadow-*` tokens in globals.css. Where a component can use
       * the `.card` / `.btn-*` classes it should; these exist for the cases
       * where a token has to compose into a longer className.
       */
      borderRadius: {
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        xl:   "var(--r-xl)",
        full: "var(--r-full)",
        card: "var(--r-lg)",
        tag:  "var(--r-full)",
      },

      boxShadow: {
        sm:    "var(--shadow-sm)",
        md:    "var(--shadow-md)",
        lg:    "var(--shadow-lg)",
        card:  "var(--shadow-card)",
        glow:  "var(--shadow-glow-accent)",
        focus: "var(--focus-ring)",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":       "var(--hero-glow)",
        "hero-glow-bottom": "var(--hero-glow-bottom)",
        "card-gradient":   "linear-gradient(var(--tw-gradient-stops))",
      },

      /**
       * Animations. `fadeIn` / `slideUp` / `slideDown` are defined in BOTH
       * this config and globals.css; the keyframes in globals.css win because
       * that file is imported after Tailwind's base layer. They are kept here
       * because Tailwind's `animate-*` utilities need the keyframes registered
       * in the theme — deleting this block silently deleted three animations
       * from the UI. The duplicated `pulseDot` definition is the exception: it
       * uses `var(--live-dot)` so it follows the theme.
       */
      animation: {
        "fade-in":    "fadeIn 0.35s ease forwards",
        "slide-up":   "slideUp 0.4s ease forwards",
        "slide-down": "slideDown 0.25s ease forwards",
        "pulse-dot":  "pulseDot 2s ease-in-out infinite",
        "number-roll": "numberRoll 0.8s ease forwards",
        "ring-fill":  "ringFill 1.2s ease forwards",
      },

      keyframes: {
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:    { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideDown:  { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseDot:   { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        numberRoll: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        ringFill:   { from: { strokeDashoffset: "339" }, to: { strokeDashoffset: "var(--ring-offset)" } },
      },
    },
  },
  plugins: [],
};

export default config;
