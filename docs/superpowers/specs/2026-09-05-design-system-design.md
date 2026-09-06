# Fast Reader — Design System (v3) Design Document

**Date:** 2026-09-05
**Status:** Draft ready for discussion (awaiting approval)
**Scope:** Design system for the UI/UX refresh + refresh of the 3 existing surfaces + new settings panel + HUD reading UX improvements

**Finalized decisions:** Popup title in a plain accent color · HUD always dark · Settings as an in-popup transitional view · Dark/Light/System theme selection in Settings

---

## 1. Purpose and Direction

Establish a design system for the new version of Fast Reader that **preserves and matures the existing visual identity**. This is not "a brand-new look from scratch"; it is **evolution**: the same DNA (dark theme + orange accent + light glassmorphism), but:

- Reduce gradient/shimmer noise; use more refined shadows and typography.
- Put everything on **design tokens** (colors are currently hand-written in ~15 places).
- Add **automatic dark/light theme** support (`prefers-color-scheme`).
- Clean up existing inconsistencies.

### Design Principles

1. **Reading comes first.** The word is the hero; all controls recede. Decorations must not distract.
2. **Familiar but refined.** The user should feel "the same app, but better," not "something completely different."
3. **Systematic.** Color, spacing, typography, radius, shadow, motion — everything comes from tokens; no hand-written fixed values.
4. **Accessible.** Automatic dark+light, WCAG AA contrast, keyboard-first, `prefers-reduced-motion` and `prefers-contrast` support.

---

## 2. Current-State Audit (where we're coming from)

| Area | Current | Problem |
|------|-------|-------|
| Color | `#ff6b35 → #f7931e` gradient hand-written in ~15 places | No tokens; a single change = dozens of edits |
| Theme | Dark only | No `prefers-color-scheme` |
| Focus outline | Orange in the popup, `#667eea` (purple) in the HUD | Inconsistent — leftover legacy code |
| Radius | Mixed 8 / 10 / 12 / 16px | No scale |
| Spacing | Freeform 12 / 16 / 24px | No scale |
| Font weight | Random between 200–800 | No defined ramp |
| Button effect | Sliding shimmer (`::before`) + `translateY` hover | Feels dated |
| Close button | Separate red gradient | Not tied to the system |

All of these will be connected to the token system and fixed in this effort.

---

## 3. Token Architecture

A **two-layer** structure, in a single shared `src/styles/tokens.css` file:

### 3a. Primitive (raw) tokens — theme-independent
Color ramps and raw scales. NOT used directly in components; they only feed the semantic tokens.

```css
:root {
  /* Brand orange (single, refined tone + variants) */
  --orange-400: #ff8551;
  --orange-500: #ff6b35;   /* primary accent */
  --orange-600: #ef5a1f;   /* hover/pressed */
  --orange-050: #fff1ea;   /* background tone in light theme */

  /* Neutrals — not pure black, slightly warm */
  --neutral-950: #14110f;
  --neutral-900: #1c1917;
  --neutral-800: #292524;
  --neutral-700: #3a3532;
  --neutral-400: #a8a29e;
  --neutral-200: #e7e5e4;
  --neutral-100: #f5f4f2;
  --neutral-000: #ffffff;

  /* Status colors */
  --red-500: #ef4444;      /* close / error */
  --green-500: #22c55e;    /* completed */
}
```

### 3b. Semantic tokens — mapped per theme
Components use ONLY these. Dark is the default; light via `@media`.

```css
:root {
  /* Dark (default) */
  --surface:        var(--neutral-950);
  --surface-raised: var(--neutral-900);
  --surface-overlay: rgba(28, 25, 23, 0.72); /* glass panel */
  --border:         rgba(255, 255, 255, 0.08);
  --border-strong:  rgba(255, 255, 255, 0.16);
  --text:           var(--neutral-000);
  --text-muted:     var(--neutral-400);
  --text-faint:     rgba(255, 255, 255, 0.32); /* context words */
  --accent:         var(--orange-500);
  --accent-hover:   var(--orange-400);
  --accent-text:    #ffffff;
  --focus-ring:     var(--orange-500);
  --danger:         var(--red-500);
}

/* Light palette — defined in one place; the three selectors below all use it */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* light values */ }
}
:root[data-theme="light"] { /* light values */ }

/* Light values (used verbatim in the two selectors above) */
/*
  --surface: var(--neutral-100);  --surface-raised: var(--neutral-000);
  --surface-overlay: rgba(255,255,255,.78);
  --border: rgba(0,0,0,.08);      --border-strong: rgba(0,0,0,.16);
  --text: var(--neutral-900);     --text-muted: #57534e;
  --text-faint: rgba(0,0,0,.32);
  --accent: var(--orange-600);    --accent-hover: var(--orange-500);
  --accent-text: #fff;            --focus-ring: var(--orange-600);
  --danger: var(--red-500);
*/
```

### 3c. Manual theme override (FINALIZED)
The user can choose **Dark / Light / System** from Settings. Mechanism:

- Default = **System**: no attribute → `prefers-color-scheme` applies.
- When **Dark** is chosen: `<html data-theme="dark">` → dark values win under all conditions.
- When **Light** is chosen: `<html data-theme="light">` → light values win under all conditions.
- The choice is stored in `chrome.storage.local`; the popup and settings apply this attribute to `<html>`.

> **HUD is always dark (FINALIZED).** Because the HUD is a separate iframe overlaid on the user's page, it operates with a fixed dark palette for reading focus, **independent** of the theme choice. The HUD root is pinned to `data-theme="dark"`; it does not respond to `prefers-color-scheme`.

---

## 4. Scales

### Typography
Font: **Inter** (existing), fallback `"Segoe UI", -apple-system, sans-serif`. Weights limited to **400 / 500 / 600 / 700** (random 200/800 are removed).

| Token | Size | Usage |
|-------|-------|----------|
| `--font-display` | `clamp(3rem, 11vw, 9rem)` | HUD current word |
| `--font-title` | 1.125rem / 600 | Panel title |
| `--font-body` | 0.875rem / 400 | Text input, body |
| `--font-label` | 0.75rem / 500 | Labels, slider label |
| `--font-caption` | 0.6875rem / 400 | Footer, credit |

### Spacing (4-based)
`--space-1:4px` · `--space-2:8px` · `--space-3:12px` · `--space-4:16px` · `--space-6:24px` · `--space-8:32px`

### Radius
`--radius-sm:8px` · `--radius-md:12px` · `--radius-lg:16px` · `--radius-full:999px`
(The odd 10px value is removed.)

### Elevation / Glass (2 levels)
The shimmer effect is **removed entirely**. Blur is kept but standardized + lightened.

```css
--elevation-1: 0 1px 2px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.24);
--elevation-2: 0 4px 16px rgba(0,0,0,.32);
--blur-panel: blur(12px);        /* previously a mix of 8–20px */
--accent-glow: 0 0 0 3px rgba(255,107,53,.24); /* focus/hover glow */
```

### Motion
```css
--ease-out: cubic-bezier(.2, 0, 0, 1);
--dur-fast: 120ms;
--dur-base: 200ms;
```
Instead of `translateY(-2/-3px)` hover jumps, use a **subtle `scale(1.02)` + shadow** and a color transition. Under `@media (prefers-reduced-motion: reduce)` all transitions/animations are disabled.

---

## 5. Component Inventory

Components to be shared across all surfaces (all use semantic tokens):

- **Button** — `primary` (solid accent), `secondary` (border + transparent), `ghost` (text only), `icon` (square/round). Uppercase + letter-spacing removed; normal case, more readable.
- **IconButton / CloseButton** — neutral surface + `--danger` on hover (from the system, instead of a separate gradient).
- **Slider (range)** — accent thumb, `--border` track; a single style, WebKit + Firefox.
- **Progress** — thin, accent fill; glow from a token.
- **TextInput / Textarea** — `--surface-raised` background, `--border`, `--accent-glow` on focus.
- **Toggle / Switch** — NEW (for settings).
- **Segmented control** — NEW (for the theme: Dark/Light/System selection and font selection).
- **Kbd chip** — neutral surface (`--surface-raised` + `--border` instead of orange); shortcut badges.
- **Panel / Card** — glass surface, `--elevation`, `--radius-lg`.
- **Selection FAB** — content-script selection icon; refined, single size, consistent shadow.

---

## 6. Surface 1 — Popup

The existing structure is kept (title / textarea / actions / credit) and moved onto tokens.

Changes:
- Width stays at 400px; inner spacing snaps to the `--space` scale.
- The gradient text in the title becomes a **plain `--accent` color** (FINALIZED — no gradient hero).
- Buttons use the new Button component; uppercase is dropped.
- **New:** a small **settings (⚙) icon button** in the top right → switches to the Settings view inside the popup.
- Theme: per the choice (Dark/Light/System); automatic in System.

---

## 7. Surface 2 — HUD (reading screen) + UX Improvements

Not just styling — the reading experience improves too:

- **ORP focus line:** a fixed vertical alignment guide at the center of the current word; words align to this axis (the classic RSVP focus point). The highlighted center character is `--accent`.
- **Calm context:** previous/next words in `--text-faint`; the read/unread preview panels are less obtrusive, with a single consistent style.
- **Control panel:** a floating glass panel at the top; lightened blur + `--elevation-2`. Speed, progress, play/pause/reset.
- **Progress + remaining time:** next to `x / y words`, an estimated remaining time (computed from WPM).
- **Shortcut hints:** at the bottom right; `--kbd` badges go neutral, dismissible/dimmed.
- **Close:** IconButton, `--danger` on hover.
- The HUD is **always dark** (independent of the theme choice — see Section 3c).

---

## 8. Surface 3 — Settings Panel (NEW)

**An in-popup transitional view** (FINALIZED — no separate window). Pressing the ⚙ icon smoothly transitions the popup from the entry view to the settings view; a back (←) arrow at the top. Persisted via `chrome.storage.local`. Minimal, genuinely valuable preferences (YAGNI):

- **Default reading speed** (WPM) — slider. The HUD uses this on open.
- **Theme** — Segmented: **Dark / Light / System** (FINALIZED). The choice is applied to `<html data-theme>` (see 3c); it affects the popup + settings surface, except the HUD.
- **ORP focus line** — Toggle (on/off).
- **Context words** — Toggle (show/hide previous/next words).

Settings state is kept in a single `settings` object (`{ defaultWpm, theme, orp, contextWords }`); read on popup open and at HUD start.

---

## 9. Accessibility

- All text/background pairs are WCAG **AA** (normal text ≥ 4.5:1, large text ≥ 3:1). In the light theme the accent is shifted to `--orange-600` because `#ff6b35` does not pass AA on white.
- A visible `:focus-visible` ring (`--accent-glow`), a single consistent style — the existing `#667eea` bug is fixed.
- `prefers-reduced-motion` and `prefers-contrast: high` are supported.
- Keyboard: Space/R/Esc are preserved; all interactive elements are tab-accessible.

---

## 10. File Structure and Migration

```
src/styles/
  tokens.css      # NEW — primitive + semantic tokens (single source)
  base.css        # NEW — reset, typography ramp, shared helpers
  components.css  # NEW — Button, Slider, Toggle, Kbd, Panel...
  content.css     # Selection FAB + iframe (moved onto tokens)
  hud.css         # (styles.css renamed) HUD-specific
  popup.css       # popup + settings view (moved onto tokens)
```

Migration principle: every fixed color/spacing/radius value is replaced with its corresponding token; the inline styles in `popup.js` (error notification) are moved to a tokenized class.

---

## 11. Out of Scope (YAGNI)

- Onboarding / intro screen (not in this version).
- Full visual redesign / new brand palette.
- Font options library (Inter is enough; later if requested).
- Word chunking (chunk / multiple words) — a reading-engine change, a separate effort.

---

## 12. Decisions (finalized)

1. **Popup title:** plain `--accent` color (no gradient hero).
2. **HUD theme:** always dark, independent of the theme choice.
3. **Settings:** in-popup transitional view (no separate window).
4. **Theme control:** Dark / Light / System selection in Settings; default System (automatic).
