# VividhEdu design system

One palette, one contract, one place it is defined. This file is the contract;
`src/app/globals.css` holds the values; `tailwind.config.ts` points at them.

## The decision

**Light is the default. Dark is the opt-in `[data-theme="dark"]`.**

This reverses the header comment that used to sit in `globals.css`, which
claimed "Dark = default" while `:root` was shipping `--bg: #FFFFFF` and
`--text-primary: #09090B`. The comment and the values disagreed, and
`tailwind.config.ts` declared a *third* palette (`bg: "#000000"`,
`text-primary: "#F5F5F7"`) that no component used.

Light won because the entire existing class vocabulary assumes it:
`<body className="bg-[#F8FAFC] text-zinc-950">`, plus ~1,350 `bg-white` /
`text-zinc-*` / `bg-black` / `border-slate-*` classes across 69 files. Making
dark the `:root` default would have put a black page behind all of them —
breaking 44 unconverted pages to improve 6. That trade is the wrong way round
during an incremental migration.

Dark is now a real, working theme rather than a comment: `ThemeToggle` is in the
navbar, `data-theme` is written before first paint by the inline script in
`layout.tsx`, and the choice persists under the `functional` consent category.

### On `prefers-color-scheme`

There is deliberately **no** `prefers-color-scheme` rule for dark.

The dark palette was originally the Apple-dark set carried in the Tailwind
config (`#000000` / `#0A0A0A` / `#F5F5F7`), tuned for an OLED dark surface. A
light-surface document in that palette is a different design, not a recolour:
it needs a lower text contrast ratio, because light-on-light type is harder to
read, and it needs hairline borders that are *darker* rather than white, since
a white border on white is invisible.

Shipping that as an automatic `prefers-color-scheme` flip would have applied a
second, untested palette to 44 pages that were never audited against it, and
the first thing a reviewer would have seen was broken text. Honoring the OS
preference is a genuine accessibility affordance and the eventual goal — but it
is a follow-up that needs its own contrast pass, not something to smuggle into
a token fix. The current state is deliberate and documented, not an oversight:

- The OS preference is **not** followed for the theme.
- The toggle is one click away and persists.
- Converting the remaining pages to tokens is the prerequisite for turning the
  OS preference back on safely.

## The two routes to a colour

Every colour resolves through one of exactly two routes.

**Route 1 — CSS custom property, via the `.t-*` classes or the component
classes in `globals.css`.** Use these in JSX when you want the class to be
short and obvious:

| Class | Token | Use for |
| --- | --- | --- |
| `t-bg` | `--bg` | page background |
| `t-surface` | `--bg-surface` | cards, panels, table headers |
| `t-elevated` | `--bg-elevated` | popovers, dialogs, sticky bars |
| `t-overlay` | `--bg-overlay` | scrims, hover fills |
| `t-chip` | `--bg-chip` | pills, secondary buttons |
| `t-input` | `--bg-input` | form fields |
| `t-text` | `--text-primary` | headings, body, primary labels |
| `t-muted` | `--text-secondary` | supporting copy |
| `t-faint` | `--text-tertiary` | metadata, timestamps, disabled |
| `t-accent` | `--accent` | brand emphasis, links |
| `t-border` | `--border` | default 1px border |
| `t-border-focus` | `--border-focus` | hovered/active border |
| `t-border-subtle` | `--border-subtle` | hairline row separators |
| `t-divider` | `--divider` | horizontal rules |
| `t-shadow` / `t-shadow-sm` / `t-shadow-card` | `--shadow-*` | elevation |

**Route 2 — semantic Tailwind colour.** Use when a colour has to compose
inside a longer className (padding variants, opacity, gradients):

`bg-bg` `bg-surface` `bg-elevated` `bg-overlay` `bg-accent` `bg-accent-dim`
`text-ink` `text-ink-2` `text-ink-3` `text-accent` `border-line`
`sys-blue` `sys-green` `sys-amber` `sys-red` `sys-purple` `sys-teal`

These are declared in `tailwind.config.ts` as
`rgb(var(--c-*-rgb) / <alpha-value>)`, so a single class name resolves to the
light or dark value depending on the active theme. `border-line/10` is the
idiomatic way to get a hairline that works in both themes.

### Adding a colour

1. Define `--x-rgb: R G B;` in **both** `:root` and `[data-theme="dark"]` in
   `globals.css`. (Space-separated integers, no commas — Tailwind's
   `<alpha-value>` syntax interpolates after `rgb(`.)
2. Expose it in `tailwind.config.ts` via the `token()` helper.
3. Use the class.

Never hardcode a hex value in `tailwind.config.ts` — that is precisely how the
two systems diverged. Never write a hex literal into a component.

## Component classes

Prefer these over re-implementing them:

`.card` `.card-elevated` `.glass-card` `.card-accent` `.card-subtle`
`.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-accent`
`.badge` `.badge-{green,blue,red,amber,purple,teal,rose}`
`.epistemic-tag` `.tag-{evidence,response,ui,gap,match}`
`.form-input` `.form-label` `.form-select`
`.data-table` `.container-{xl,lg,md}`
`.kicker-web` `.kicker-accent` `.lead-p` `.body-p` `.mono`
`.selection-card` `.goal-chip` `.domain-chip`
`.skeleton` `.spinner`

## Accessibility baseline

- **Focus is never removed.** `globals.css` defines one `:focus-visible` rule
  for every interactive element, using `outline` (not `box-shadow`, which
  elements silently override) with `--focus-ring` so the ring is visible in
  both themes. Components that draw their own focus treatment (`.form-input`,
  `.dashed-ring`) opt out explicitly.
- **`prefers-reduced-motion: reduce`** collapses animation and transition
  durations to `0.01ms` rather than setting `animation: none`, so any
  `animationend` / `transitionend` handler still fires and state still advances.
- **Contrast.** The light palette's `--text-secondary` is `#5B5B60` on
  `#FFFFFF` (≈6.4:1) and `--text-tertiary` is `#86868B` (≈3.6:1, used only for
  non-essential metadata). Dark's equivalents are `#A1A1AA` on `#000000`
  (≈8.9:1) and `#8A8A8E` (≈5.6:1).
- **Every data surface** has three states: loading (skeleton, not a spinner),
  empty (`EmptyState`, which requires a next action), and error (`error.tsx`
  with a retry). A spinner is only correct for an action the user just took.

## Migration state

Converted to tokens — these render correctly in **both** themes:

| Surface | File |
| --- | --- |
| Shell | `components/AppShell.tsx`, `components/Navbar.tsx`, `components/Footer.tsx` |
| Home | `app/page.tsx` |
| Explore | `app/explore/page.tsx`, `app/explore/loading.tsx`, `app/explore/error.tsx` |
| Onboard | `app/onboard/page.tsx`, `components/OnboardWizard.tsx` |
| Workspace | `app/workspace/page.tsx` |
| Pricing | `app/pricing/page.tsx` |
| Privacy | `app/privacy/page.tsx` |
| Cookies | `app/cookies/page.tsx` |

**Not yet converted** — these still use `bg-white` / `text-zinc-*` / `bg-[#...]`
and render correctly only in the default light theme:

`about` `admissions` `advisor` `analyze` `career-trajectory` `college/[id]`
`compare` `contact` `global` `job-security` `marketplace` `methodology`
`portfolio-builder` `psychometric` `report/[token]` `terms` `admin` and the
~30 shared components under `components/`.

Migration order for the next pass, by traffic: `about` → `contact` →
`methodology` → `terms` → `marketplace` → `portfolio-builder` → `advisor` →
`global` → `psychometric` → `college/[id]` → `report/[token]` →
`career-trajectory` → `job-security` → `compare` → `admissions` → `admin`.

**Do not apply a site-wide `data-theme` flip until this list is empty.** That is
the whole reason the dark theme is opt-in rather than default: a dark-mode
visitor landing on an unconverted page today sees light-on-light, which is why
the toggle ships in the navbar but the OS preference does not.

To measure the debt at any time:

```sh
rg -o "bg-\[#[0-9a-fA-F]+|text-\[#[0-9a-fA-F]+|bg-white|bg-zinc-|text-zinc-|border-slate-" src | wc -l
```
