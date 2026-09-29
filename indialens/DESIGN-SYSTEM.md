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

## THE DESIGN LANGUAGE

*This section is the contract for restyling work. If a page disagrees with it,
the page is wrong, not this section.*

The product models itself on actuarial and financial-terminal software —
Bloomberg, Stripe dashboard, Linear. Four words describe the target: **dense,
calm, precise, honest.** Concretely, that resolves to six rules.

### 1. The page owns the background; chrome is chrome

`<body>` and every route use `t-bg`. The navbar and footer are `t-surface`.
A page never wraps itself in `bg-surface` — several did, which made the whole
document read as one large card and destroyed the separation between the page
and the furniture around it. `page-shell` is the page frame.

### 2. Numbers are typography

This is a data product. Every figure is:

- **tabular** — `.num*` / `.metric*` set `font-variant-numeric: tabular-nums`,
  so a column of scores can be scanned. A column of proportional figures cannot.
- **mono, at one of six sizes** — `.num-0` … `.num-5`, or `.metric` /
  `.metric-lg` / `.metric-xl`. There is no seventh size. Score displays that
  drifted between pages were the clearest symptom of the template look.
- **self-describing** — `Metric` takes a `caption` naming the provenance. A
  number with no stated source is the thing the methodology page warns against.
- **visibly absent when unmeasured** — `null` renders `—` in `.num-na`, muted
  and letter-spaced, never in red, never as `0`, never tweened. A red dash
  would assert "this is the worst reading", which is a different claim.
  `<Metric value={null} />` is the standard way to express it.

A range is drawn as a range: `.range` puts the point in primary ink and the
interval beside it in tertiary. A confidence band is `.ci-track` + `.ci-fill`,
where the unfilled portion *is* the epistemics.

### 3. Depth is a hairline, not a shadow

`--shadow-card` is near-zero and cards should stay at their resting value.
Interactive cards (`--interactive`) lift on hover; **data panels never do**. A
wall of floating, hovering cards reads as a marketing page, and this is a
terminal. Separation comes from a 1px `--border` and surface tone.

Three surfaces, and the distinction is not cosmetic:

| Class | For |
| --- | --- |
| `.card` | interactive — lifts on hover |
| `.card-elevated` / `.panel-raised` | one emphasised card, static |
| `.panel` | the default for **data** — flat, hairline, no lift |

`.panel-head` / `.panel-title` is the only internal header a data panel has.

### 4. Rhythm is a 4-step scale, and there is one page header

Sections are `page-section` (96px) or `page-section-tight` (64px). Horizontal
gutters are `container-xl` (1280) or `container-lg`/`container-md` for prose.
Page padding-top and headline size are **not** per-page values: they come from
`.page-header` and `.page-title`. Drift between page headers was the single
biggest tell that this was a set of pages rather than a product.

### 5. Motion explains a state change, and nothing else

Exactly three are permitted, all defined in the `MOTION SYSTEM` block of
`globals.css`:

1. **Entry** — `Reveal` / `RevealGroup`, a 10px fade-up, once, staggered.
2. **Value** — `useCountUp`, a figure counting to its new value.
3. **Reveal** — chart series fading in from zero.

Bounce, elastic, overshoot, and gratuitous looping are banned. The two status
dots pulse forever because a live indicator that does not move is not one.

Reduced motion is honoured **three** ways, and all three are needed: the global
CSS rule collapses durations while still firing `animationend`; `.reveal`
forces its *end* state (a collapsed animation that ends on `opacity: 0` would
leave content permanently invisible); and `prefersReducedMotion()` short-circuits
the JS tween, which no CSS rule can reach.

Motion only ever **adds**. The `opacity: 0` start state lives in a class that
only JS adds, so no-JS, failed hydration and crawlers all get the real page.

### 6. States are shared components, never hand-rolled

`EmptyState` (always names the next action; distinguishes "nothing yet" from
"nothing matched"), `RouteError` (a failure is stated as a failure), the
`Skeleton*` family, `Notice` (tone vocabulary is semantic: an unconnected
optional integration is `warn`, **not** `error` — see §7), and `UnmeasuredNote`.

A loading state is a skeleton, never a spinner. A spinner implies the wait is
short, which is a lie on a 45s grounded-LLM budget, and it tells the user
nothing about what is coming, so the page jumps when the data lands.

## COMPONENT CLASSES

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

**Page frame** — `page-shell` `page-section` `page-section-tight` `page-band`
`page-band-alt` `page-header` `page-header-sm` `page-title` `page-title-sm`
`section-title` `section-lead` `prose-measure`

**Data** — `num-0`…`num-5` `num-na` `num-roll` `metric` `metric-lg`
`metric-xl` `metric-label` `metric-cell` `metric-cell-row` `range`
`range-point` `range-band` `ci-track` `ci-fill`

**Panels** — `panel` `panel-pad` `panel-pad-sm` `panel-pad-lg` `panel-head`
`panel-title` `panel-body` `panel-body-sm` `panel-raised` `notice`
`notice-{accent,warn,err,ok}` `notice-icon` `status-strip`

**Motion** — `reveal` `reveal-stagger` `is-in` `num-roll`
(`animate-fade-in` `animate-slide-up` remain for legacy call sites)

**Components** — `PageHeader` `SectionHeader` `SectionRule` (PageHeader.tsx) ·
`Reveal` `RevealGroup` (Reveal.tsx) · `Metric` `useCountUp`
`prefersReducedMotion` (lib/motion.ts) · `Notice` `UnmeasuredNote` (Notice.tsx)

**Note on `.card`:** `.card` is interactive and lifts on hover. Use `.panel`
for data. If a data block is currently `.card`, it is wrong — switch it.

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

## AI MODE: SHIPPED, NOT YET CONNECTED

`/advisor` is a real, finished, reachable feature. Its upstream — a
search-grounded engine via OpenRouter, optionally Gemini — is **not connected**,
because no key has been supplied. The route, the nav link and the page all stay.

The distinction the interface is built around, because collapsing it is the
failure this product exists to avoid:

| Condition | Signal | Treatment |
| --- | --- | --- |
| **Not connected** | `503` with `integration_unavailable` / `backend_unavailable` / `sonar_unavailable` | `<AIUnavailable>` — "not connected yet", the backend's own reason, and what still works |
| **Upstream failed** | `502`, timeout, anything else | `<Notice tone="warn">` — something *is* configured and did not answer |
| **Not measured** | no key, no gap — the data simply is not published | `<UnmeasuredNote>` |

Claiming "your question could not be answered" when the real state is "nothing
is listening" is a false claim about a live product. Claiming the key is
missing when the key is present and the provider is down is the same error in
the other direction. So the two are told apart by **status and payload shape**,
never guessed.

`AIModeStudio` probes `GET /api/v1/ai/status` once on mount and drives the whole
surface from the result. While the probe is in flight the form is present but
disabled, so a user cannot type into a box already known to be unusable. A
`503` from any AI call re-runs the probe so the surface settles into the
unavailable state rather than showing a stale form.

**Never rendered in the unavailable state:** a sample answer, a cached
response, an illustrative citation, or a "here is what we would have said". A
canned response on a citation-first surface is indistinguishable from a real
one once it is on screen.

## AI Mode: SHIPPED, NOT YET CONNECTED — continued

Same rule applies to any other surface gated on a key the owner has not
supplied (Tavily, Gemini, the `data.gov.in` key, Resend for report email). Each
fails closed in the backend already; the frontend's job is to name the state
rather than to show a generic failure. Nothing that genuinely works has been
disabled.

## Measurement of the debt

To measure the debt at any time:

```sh
rg -o "bg-\[#[0-9a-fA-F]+|text-\[#[0-9a-fA-F]+|bg-white|text-zinc-[0-9]+|border-slate-[0-9]+" src | wc -l
```

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

**Do not apply a site-wide `data-theme` flip until this list is empty.** That is
the whole reason the dark theme is opt-in rather than default: a dark-mode
visitor landing on an unconverted page today sees light-on-light, which is why
the toggle ships in the navbar but the OS preference does not.

To measure the debt at any time:

```sh
rg -o "bg-\[#[0-9a-fA-F]+|text-\[#[0-9a-fA-F]+|bg-white|bg-zinc-|text-zinc-|border-slate-" src | wc -l
```
