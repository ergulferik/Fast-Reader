# Fast Reader v3 Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a token-based design system that preserves and matures the existing dark+orange identity; refresh the 3 surfaces (popup, HUD, selection icon); add a settings view inside the popup and reading-UX improvements to the HUD.

**Architecture:** All visual values come from a two-layer token set (primitive → semantic) inside a single `tokens.css`. The semantic tokens are mapped to a dark (default) + light theme via `prefers-color-scheme` and a `<html data-theme>` override. Pure logic (theme resolution, remaining time, word splitting, ORP) is extracted into a Chrome-independent ES module in `src/shared/settings.js` and unit-tested with `node --test`; CSS/DOM work is verified manually in Chrome.

**Tech Stack:** Vanilla JS (ES modules), CSS custom properties, Chrome Extension MV3, `chrome.storage.local`, Node.js built-in test runner (`node --test`, zero dependencies).

## Global Constraints

- Manifest V3; no external build/bundler — files are loaded directly.
- NO new npm runtime dependency. For testing, only Node's built-in `node:test` + `node:assert`.
- Components use ONLY semantic tokens; raw color/px values are never hand-written.
- The HUD is always dark (independent of the theme selection).
- Accessibility: WCAG AA contrast, a single consistent `:focus-visible` ring, `prefers-reduced-motion` + `prefers-contrast: high` support.
- Spec: `docs/superpowers/specs/2026-09-05-design-system-design.md` (the single source of truth for this plan).
- Font: Inter, limited to weights 400/500/600/700.

---

## File Structure

**To create:**
- `package.json` — root; just `{"type":"module"}` (so Node reads `.js` as ESM; Chrome does not read this).
- `src/styles/tokens.css` — primitive + semantic tokens, theme override, motion tokens.
- `src/styles/base.css` — reset, typography ramp, `:focus-visible`, scrollbar, reduced-motion.
- `src/styles/components.css` — Button, IconButton, Slider, Progress, Input, Toggle, Segmented, Kbd, Panel.
- `src/shared/settings.js` — pure helpers (ES module): `DEFAULT_SETTINGS`, `resolveTheme`, `estimateRemainingMs`, `formatDuration`, `splitWords`, `orpIndex`.
- `test/settings.test.js` — `node --test` unit tests.

**To modify:**
- `src/popup/popup.html` — settings (⚙) button + settings view; token/base/components css links.
- `src/popup/popup.css` — moved to tokens; settings view styles.
- `src/popup/popup.js` — `type="module"`; settings storage, theme application, view switching.
- `src/hud/hud.html` — ORP line + remaining-time elements; token/base/components + hud.css.
- `src/hud/hud.js` — `type="module"`; read settings, ORP/context toggle, remaining time, defaultWpm.
- `src/styles/content.css` — Selection FAB + iframe moved to tokens.
- `manifest.json` — version 3.0.0; add the new css + `src/shared/settings.js` + `hud.css` to `web_accessible_resources`.
- `README.md` — version history v3.0.

**To rename:**
- `src/styles/styles.css` → `src/styles/hud.css` (HUD-specific; moved to tokens, always-dark).

---

### Task 1: Token & base foundation

The core of the design system. Every subsequent task uses these tokens.

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Modify: `src/popup/popup.html` (only the `<head>` links — for temporary verification)

**Interfaces:**
- Produces: semantic CSS variables — `--surface`, `--surface-raised`, `--surface-overlay`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-hover`, `--accent-text`, `--focus-ring`, `--danger`, `--danger-hover`, `--success`; scale tokens — `--space-1..8`, `--radius-sm/md/lg/full`, `--font-display/title/body/label/caption`, `--fw-regular/medium/semibold/bold`, `--elevation-1/2`, `--blur-panel`, `--accent-glow`, `--ease-out`, `--dur-fast/base`. Theme override: `<html data-theme="light|dark">`.

- [ ] **Step 1: Create the `src/styles/tokens.css` file**

```css
/* ============ PRIMITIVE (theme-independent raw values) ============ */
:root {
  --orange-050: #fff1ea;
  --orange-400: #ff8551;
  --orange-500: #ff6b35;
  --orange-600: #ef5a1f;

  --neutral-000: #ffffff;
  --neutral-100: #f5f4f2;
  --neutral-200: #e7e5e4;
  --neutral-400: #a8a29e;
  --neutral-700: #3a3532;
  --neutral-800: #292524;
  --neutral-900: #1c1917;
  --neutral-950: #14110f;

  --red-500: #ef4444;
  --red-600: #dc2626;
  --green-500: #22c55e;

  /* Scales */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 999px;

  --font-display: clamp(3rem, 11vw, 9rem);
  --font-title: 1.125rem;
  --font-body: 0.875rem;
  --font-label: 0.75rem;
  --font-caption: 0.6875rem;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700;

  --blur-panel: blur(12px);
  --ease-out: cubic-bezier(.2, 0, 0, 1);
  --dur-fast: 120ms; --dur-base: 200ms;
}

/* ============ SEMANTIC — DARK (default) ============ */
:root {
  --surface: var(--neutral-950);
  --surface-raised: var(--neutral-900);
  --surface-overlay: rgba(28, 25, 23, 0.72);
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --text: var(--neutral-000);
  --text-muted: var(--neutral-400);
  --text-faint: rgba(255, 255, 255, 0.32);
  --accent: var(--orange-500);
  --accent-hover: var(--orange-400);
  --accent-text: #ffffff;
  --focus-ring: var(--orange-500);
  --danger: var(--red-500);
  --danger-hover: #ff5e6b;
  --success: var(--green-500);
  --elevation-1: 0 1px 2px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.24);
  --elevation-2: 0 4px 16px rgba(0,0,0,.32);
  --accent-glow: 0 0 0 3px rgba(255,107,53,.24);
}

/* ============ SEMANTIC — LIGHT ============ */
/* System is light AND the user has not forced dark */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --surface: var(--neutral-100);
    --surface-raised: var(--neutral-000);
    --surface-overlay: rgba(255, 255, 255, 0.78);
    --border: rgba(0, 0, 0, 0.08);
    --border-strong: rgba(0, 0, 0, 0.16);
    --text: var(--neutral-900);
    --text-muted: #57534e;
    --text-faint: rgba(0, 0, 0, 0.32);
    --accent: var(--orange-600);
    --accent-hover: var(--orange-500);
    --focus-ring: var(--orange-600);
    --accent-glow: 0 0 0 3px rgba(239,90,31,.20);
    --elevation-1: 0 1px 2px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.08);
    --elevation-2: 0 4px 16px rgba(0,0,0,.12);
  }
}
/* User forced light (regardless of system) */
:root[data-theme="light"] {
  --surface: var(--neutral-100);
  --surface-raised: var(--neutral-000);
  --surface-overlay: rgba(255, 255, 255, 0.78);
  --border: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.16);
  --text: var(--neutral-900);
  --text-muted: #57534e;
  --text-faint: rgba(0, 0, 0, 0.32);
  --accent: var(--orange-600);
  --accent-hover: var(--orange-500);
  --focus-ring: var(--orange-600);
  --accent-glow: 0 0 0 3px rgba(239,90,31,.20);
  --elevation-1: 0 1px 2px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.08);
  --elevation-2: 0 4px 16px rgba(0,0,0,.12);
}
```

- [ ] **Step 2: Create the `src/styles/base.css` file**

```css
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text);
  background: var(--surface);
  -webkit-font-smoothing: antialiased;
}

/* Single consistent focus ring (replacing the old #667eea bug) */
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
:focus:not(:focus-visible) { outline: none; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--border); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: var(--radius-full); }
::-webkit-scrollbar-thumb:hover { background: var(--accent-hover); }
* { scrollbar-width: thin; scrollbar-color: var(--accent) transparent; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 3: Link token + base into `src/popup/popup.html` `<head>` (BEFORE the existing popup.css)**

Add BEFORE the `<link rel="stylesheet" href="popup.css" />` line:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
```

- [ ] **Step 4: Verify in Chrome (dark/light override)**

1. `chrome://extensions` → Developer mode → "Load unpacked" → repo folder.
2. Open the popup. In the DevTools console run:
   `document.documentElement.setAttribute('data-theme','light')`
   Expected: the background switches to a light color (`--surface` = `#f5f4f2`).
   `document.documentElement.setAttribute('data-theme','dark')` → switches to dark.
   `document.documentElement.removeAttribute('data-theme')` → returns to the system theme.

Expected: In all three cases the background/text are legible; no errors. (Since the current popup.css still uses the old fixed colors, full styling will settle in later tasks — here we only verify that the token layer works.)

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/base.css src/popup/popup.html
git commit -m "feat(design-system): add token foundation and base styles"
```

---

### Task 2: Shared settings helpers (TDD)

Chrome-independent pure logic. With real unit tests.

**Files:**
- Create: `package.json`
- Create: `src/shared/settings.js`
- Test: `test/settings.test.js`

**Interfaces:**
- Produces:
  - `DEFAULT_SETTINGS = { defaultWpm: 250, theme: "system", orp: true, contextWords: true }`
  - `resolveTheme(theme)` → `"light" | "dark" | null` — `null` for `"system"` (attribute is removed), otherwise returned as-is.
  - `splitWords(text)` → `string[]` (split on whitespace, drop empties).
  - `estimateRemainingMs(wordsLeft, wpm)` → `number` (ms). `0` if `wpm<=0`.
  - `formatDuration(ms)` → `string` (`"0:47"`, `"1:05"`, `"12:03"` format).
  - `orpIndex(len)` → `number` — index of the character to emphasize based on word length (RSVP focal point).

- [ ] **Step 1: Write a failing test — `test/settings.test.js`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS, resolveTheme, splitWords,
  estimateRemainingMs, formatDuration, orpIndex,
} from "../src/shared/settings.js";

test("DEFAULT_SETTINGS has expected shape", () => {
  assert.deepEqual(DEFAULT_SETTINGS,
    { defaultWpm: 250, theme: "system", orp: true, contextWords: true });
});

test("resolveTheme maps system to null, others passthrough", () => {
  assert.equal(resolveTheme("system"), null);
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("dark"), "dark");
});

test("splitWords splits on whitespace and drops empties", () => {
  assert.deepEqual(splitWords("  hello   world\n foo "), ["hello", "world", "foo"]);
  assert.deepEqual(splitWords(""), []);
});

test("estimateRemainingMs computes ms and guards wpm<=0", () => {
  assert.equal(estimateRemainingMs(250, 250), 60000);
  assert.equal(estimateRemainingMs(100, 0), 0);
});

test("formatDuration formats mm:ss with zero-padded seconds", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(47000), "0:47");
  assert.equal(formatDuration(65000), "1:05");
  assert.equal(formatDuration(723000), "12:03");
});

test("orpIndex returns center-ish index", () => {
  assert.equal(orpIndex(1), 0);
  assert.equal(orpIndex(5), 2);   // odd → floor(len/2)
  assert.equal(orpIndex(6), 2);   // even → len/2 - 1
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `node --test`
Expected: FAIL — `Cannot find module '../src/shared/settings.js'`.

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "fast-reader",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
```

- [ ] **Step 4: Create `src/shared/settings.js` (minimal implementation)**

```js
export const DEFAULT_SETTINGS = {
  defaultWpm: 250,
  theme: "system",
  orp: true,
  contextWords: true,
};

export function resolveTheme(theme) {
  return theme === "system" ? null : theme;
}

export function splitWords(text) {
  return String(text).split(/\s+/).filter((w) => w.length > 0);
}

export function estimateRemainingMs(wordsLeft, wpm) {
  if (!wpm || wpm <= 0) return 0;
  return Math.round((wordsLeft / wpm) * 60 * 1000);
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function orpIndex(len) {
  if (len <= 1) return 0;
  return len % 2 === 0 ? len / 2 - 1 : Math.floor(len / 2);
}
```

- [ ] **Step 5: Run the test, watch it pass**

Run: `node --test`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json src/shared/settings.js test/settings.test.js
git commit -m "feat(shared): add tested settings/reader helpers"
```

---

### Task 3: Component library

Component styles shared by all surfaces. Uses tokens only.

**Files:**
- Create: `src/styles/components.css`

**Interfaces:**
- Produces CSS classes: `.btn` + `.btn--primary/.btn--secondary/.btn--ghost`; `.icon-btn` (+ `.icon-btn--danger`); `.slider`; `.progress` + `.progress__fill`; `.field` (input/textarea); `.switch` (+ `input`); `.segmented` + `.segmented__option`; `.kbd`; `.panel`.

- [ ] **Step 1: Create `src/styles/components.css`**

```css
/* ---- Button ---- */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: var(--fw-semibold) var(--font-body)/1 "Inter", sans-serif;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out),
              box-shadow var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.btn:active:not(:disabled) { transform: scale(.98); }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--primary { background: var(--accent); color: var(--accent-text); }
.btn--primary:hover:not(:disabled) { background: var(--accent-hover); box-shadow: var(--elevation-1); }
.btn--secondary { background: transparent; color: var(--text); border-color: var(--border-strong); }
.btn--secondary:hover:not(:disabled) { background: var(--surface-raised); border-color: var(--accent); }
.btn--ghost { background: transparent; color: var(--text-muted); }
.btn--ghost:hover:not(:disabled) { color: var(--text); background: var(--surface-raised); }

/* ---- Icon button ---- */
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem;
  border: 1px solid var(--border); border-radius: var(--radius-full);
  background: var(--surface-raised); color: var(--text-muted);
  cursor: pointer; font-size: 1rem;
  transition: color var(--dur-fast) var(--ease-out),
              background var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.icon-btn:hover { color: var(--text); transform: scale(1.05); }
.icon-btn--danger:hover { color: #fff; background: var(--danger); border-color: var(--danger); }

/* ---- Slider ---- */
.slider {
  width: 100%; height: 6px; appearance: none;
  background: var(--border); border-radius: var(--radius-full);
  outline: none; cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 20px; height: 20px; border-radius: var(--radius-full);
  background: var(--accent); border: 2px solid var(--surface);
  transition: transform var(--dur-fast) var(--ease-out);
}
.slider::-webkit-slider-thumb:hover { transform: scale(1.12); }
.slider::-moz-range-thumb {
  width: 20px; height: 20px; border: 2px solid var(--surface);
  border-radius: var(--radius-full); background: var(--accent);
}

/* ---- Progress ---- */
.progress { width: 100%; height: 4px; background: var(--border);
  border-radius: var(--radius-full); overflow: hidden; }
.progress__fill { height: 100%; width: 0%; background: var(--accent);
  transition: width var(--dur-base) var(--ease-out); }

/* ---- Field ---- */
.field {
  width: 100%; padding: var(--space-4);
  background: var(--surface-raised); color: var(--text);
  border: 1px solid var(--border); border-radius: var(--radius-md);
  font: var(--fw-regular) var(--font-body)/1.6 "Inter", sans-serif;
  transition: border-color var(--dur-fast) var(--ease-out),
              box-shadow var(--dur-fast) var(--ease-out);
}
.field::placeholder { color: var(--text-faint); }
.field:hover:not(:focus) { border-color: var(--border-strong); }
.field:focus { outline: none; border-color: var(--accent); box-shadow: var(--accent-glow); }

/* ---- Switch (toggle) ---- */
.switch { position: relative; display: inline-block; width: 40px; height: 24px; }
.switch input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
.switch__track {
  position: absolute; inset: 0; border-radius: var(--radius-full);
  background: var(--border-strong);
  transition: background var(--dur-fast) var(--ease-out);
}
.switch__track::before {
  content: ""; position: absolute; left: 3px; top: 3px;
  width: 18px; height: 18px; border-radius: var(--radius-full);
  background: var(--neutral-000);
  transition: transform var(--dur-fast) var(--ease-out);
}
.switch input:checked + .switch__track { background: var(--accent); }
.switch input:checked + .switch__track::before { transform: translateX(16px); }
.switch input:focus-visible + .switch__track { box-shadow: var(--accent-glow); }

/* ---- Segmented control ---- */
.segmented { display: inline-flex; padding: 3px; gap: 2px;
  background: var(--surface-raised); border: 1px solid var(--border);
  border-radius: var(--radius-md); }
.segmented__option {
  flex: 1; padding: var(--space-2) var(--space-3); border: none;
  background: transparent; color: var(--text-muted);
  border-radius: var(--radius-sm); cursor: pointer;
  font: var(--fw-medium) var(--font-label)/1 "Inter", sans-serif;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.segmented__option[aria-pressed="true"] { background: var(--accent); color: var(--accent-text); }
.segmented__option:hover:not([aria-pressed="true"]) { color: var(--text); }

/* ---- Kbd ---- */
.kbd {
  display: inline-block; padding: var(--space-1) var(--space-2);
  background: var(--surface-raised); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); color: var(--text-muted);
  font: var(--fw-semibold) var(--font-caption)/1 monospace;
}

/* ---- Panel ---- */
.panel {
  background: var(--surface-overlay);
  -webkit-backdrop-filter: var(--blur-panel); backdrop-filter: var(--blur-panel);
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
}
```

- [ ] **Step 2: Visual verification in Chrome (temporary sandbox)**

Temporarily add `<link rel="stylesheet" href="../styles/components.css" />` into `src/popup/popup.html` `<head>`, and place a temporary test block at the start of `<body>`:

```html
<div style="padding:16px; display:flex; flex-direction:column; gap:12px">
  <button class="btn btn--primary">Primary</button>
  <button class="btn btn--secondary">Secondary</button>
  <label class="switch"><input type="checkbox" checked><span class="switch__track"></span></label>
  <div class="segmented">
    <button class="segmented__option" aria-pressed="true">Dark</button>
    <button class="segmented__option">Light</button>
    <button class="segmented__option">System</button>
  </div>
  <kbd class="kbd">Space</kbd>
</div>
```

Reload the extension and open the popup. Expected: the buttons, toggle (on=orange, on the right), segmented (selected=orange), and kbd render correctly; when `data-theme` changes, the colors follow the theme.

- [ ] **Step 3: Revert the temporary test block and the temporary link**

Delete the temporary `<div>` block added in Step 2. Also delete the `components.css` link (it will be added permanently in Task 4). Return `popup.html` to its state at the end of Task 1.

- [ ] **Step 4: Commit**

```bash
git add src/styles/components.css
git commit -m "feat(design-system): add token-based component library"
```

---

### Task 4: Popup refactor + settings view

Move the popup to tokens/components, and add the settings view and theme/storage logic.

**Files:**
- Modify: `src/popup/popup.html`
- Modify: `src/popup/popup.css`
- Modify: `src/popup/popup.js`

**Interfaces:**
- Consumes: `src/shared/settings.js` (`DEFAULT_SETTINGS`, `resolveTheme`); `components.css`, `tokens.css`, `base.css`.
- Produces: a `settings` object in `chrome.storage.local` (shape of `DEFAULT_SETTINGS`). The `applyTheme(theme)` function applies/removes `data-theme` on `<html>`.

- [ ] **Step 1: `src/popup/popup.html` — head + two views + settings button**

In `<head>`, link token/base/components before `popup.css`:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
    <link rel="stylesheet" href="../styles/components.css" />
    <link rel="stylesheet" href="popup.css" />
```

Convert the `<body>` content into a two-view structure (reader + settings), and make the script a module:

```html
  <body>
    <div class="popup-container">
      <div class="popup-header">
        <h1 class="popup-title">Fast Reader</h1>
        <button id="settingsBtn" class="icon-btn" title="Settings" aria-label="Settings">⚙</button>
      </div>

      <!-- READER VIEW -->
      <section id="readerView" class="popup-body">
        <textarea id="textInput" class="field text-input"
          placeholder="Enter or paste text here..." rows="10"></textarea>
        <div class="input-actions">
          <button id="startBtn" class="btn btn--primary">Start</button>
          <button id="clearBtn" class="btn btn--secondary">Clear</button>
        </div>
      </section>

      <!-- SETTINGS VIEW -->
      <section id="settingsView" class="popup-body settings-view" hidden>
        <button id="backBtn" class="btn btn--ghost back-btn" aria-label="Back">← Back</button>

        <div class="setting-row">
          <label for="defaultWpm">Default speed</label>
          <div class="setting-control">
            <span id="defaultWpmValue">250</span> wpm
            <input id="defaultWpm" class="slider" type="range" min="100" max="1000" value="250" />
          </div>
        </div>

        <div class="setting-row">
          <span>Theme</span>
          <div class="segmented" id="themeSeg" role="group" aria-label="Theme">
            <button class="segmented__option" data-theme-value="dark">Dark</button>
            <button class="segmented__option" data-theme-value="light">Light</button>
            <button class="segmented__option" data-theme-value="system">System</button>
          </div>
        </div>

        <div class="setting-row">
          <label for="orpToggle">ORP focus line</label>
          <label class="switch"><input id="orpToggle" type="checkbox" /><span class="switch__track"></span></label>
        </div>

        <div class="setting-row">
          <label for="contextToggle">Context words</label>
          <label class="switch"><input id="contextToggle" type="checkbox" /><span class="switch__track"></span></label>
        </div>
      </section>

      <div class="popup-footer">
        <a href="https://ergulferik.github.io/Portfolio-Website/" target="_blank" class="creator-credit">
          <img src="../../assets/icons/ef.png" alt="Ergül Ferik" class="creator-icon" />
          <span>Powered by Ergül Ferik</span>
        </a>
      </div>
    </div>
    <script type="module" src="popup.js"></script>
  </body>
```

- [ ] **Step 2: `src/popup/popup.css` — move to tokens + settings styles**

Rewrite `popup.css` from scratch (the old fixed colors and the `.action-btn`/`.btn-*` blocks are removed since they are delegated to components):

```css
body { width: 400px; min-height: 500px; }

.popup-container {
  display: flex; flex-direction: column; min-height: 500px;
  background: var(--surface);
}

.popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
}
.popup-title {
  font-size: 1.375rem; font-weight: var(--fw-bold);
  color: var(--accent); /* plain accent — no gradient */
}

.popup-body {
  flex: 1; display: flex; flex-direction: column;
  gap: var(--space-4); padding: var(--space-6);
}
.text-input { flex: 1; resize: none; }
.input-actions { display: flex; gap: var(--space-3); }
.input-actions .btn { flex: 1; }

/* Settings view */
.settings-view { gap: var(--space-6); }
.back-btn { align-self: flex-start; min-height: auto; padding: var(--space-2) var(--space-3); }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-4); font-size: var(--font-body); color: var(--text);
}
.setting-row > label, .setting-row > span:first-child { font-weight: var(--fw-medium); }
.setting-control { display: flex; flex-direction: column; align-items: flex-end;
  gap: var(--space-2); font-size: var(--font-label); color: var(--text-muted); min-width: 160px; }
.setting-control .slider { width: 160px; }
#defaultWpmValue { color: var(--accent); font-weight: var(--fw-bold); }

.popup-footer {
  padding: var(--space-4); text-align: center; border-top: 1px solid var(--border);
}
.creator-credit {
  display: inline-flex; align-items: center; gap: var(--space-2);
  font-size: var(--font-caption); color: var(--text-faint); text-decoration: none;
  transition: color var(--dur-fast) var(--ease-out);
}
.creator-credit:hover { color: var(--accent); }
.creator-icon { width: 16px; height: 16px; border-radius: var(--radius-full); object-fit: cover; }

/* Error notification (moved from popup.js) */
.error-notification {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: var(--danger); color: #fff;
  padding: var(--space-3) var(--space-6); border-radius: var(--radius-sm);
  font-size: var(--font-body); font-weight: var(--fw-medium);
  box-shadow: var(--elevation-2); z-index: 10000;
  animation: slideDown var(--dur-base) var(--ease-out);
}
@keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; } }
```

- [ ] **Step 3: `src/popup/popup.js` — module + settings + theme + view switching**

Rewrite from scratch:

```js
import { DEFAULT_SETTINGS, resolveTheme } from "../shared/settings.js";

const $ = (id) => document.getElementById(id);
const els = {
  textInput: $("textInput"), startBtn: $("startBtn"), clearBtn: $("clearBtn"),
  settingsBtn: $("settingsBtn"), backBtn: $("backBtn"),
  readerView: $("readerView"), settingsView: $("settingsView"),
  defaultWpm: $("defaultWpm"), defaultWpmValue: $("defaultWpmValue"),
  themeSeg: $("themeSeg"), orpToggle: $("orpToggle"), contextToggle: $("contextToggle"),
};

let settings = { ...DEFAULT_SETTINGS };

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  if (resolved) document.documentElement.setAttribute("data-theme", resolved);
  else document.documentElement.removeAttribute("data-theme");
}

async function loadSettings() {
  const res = await chrome.storage.local.get(["settings"]);
  settings = { ...DEFAULT_SETTINGS, ...(res.settings || {}) };
  applyTheme(settings.theme);
  els.defaultWpm.value = settings.defaultWpm;
  els.defaultWpmValue.textContent = settings.defaultWpm;
  els.orpToggle.checked = settings.orp;
  els.contextToggle.checked = settings.contextWords;
  els.themeSeg.querySelectorAll(".segmented__option").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.themeValue === settings.theme)));
}

async function saveSettings() {
  await chrome.storage.local.set({ settings });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  const saved = await chrome.storage.local.get(["popupTextInput"]);
  if (saved.popupTextInput) els.textInput.value = saved.popupTextInput;
  els.textInput.focus();
});

// --- View switching ---
els.settingsBtn.addEventListener("click", () => {
  els.readerView.hidden = true; els.settingsView.hidden = false;
});
els.backBtn.addEventListener("click", () => {
  els.settingsView.hidden = true; els.readerView.hidden = false; els.textInput.focus();
});

// --- Settings controls ---
els.defaultWpm.addEventListener("input", (e) => {
  settings.defaultWpm = Number(e.target.value);
  els.defaultWpmValue.textContent = settings.defaultWpm; saveSettings();
});
els.themeSeg.addEventListener("click", (e) => {
  const btn = e.target.closest(".segmented__option"); if (!btn) return;
  settings.theme = btn.dataset.themeValue;
  els.themeSeg.querySelectorAll(".segmented__option").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === btn)));
  applyTheme(settings.theme); saveSettings();
});
els.orpToggle.addEventListener("change", (e) => { settings.orp = e.target.checked; saveSettings(); });
els.contextToggle.addEventListener("change", (e) => { settings.contextWords = e.target.checked; saveSettings(); });

// --- Reader view ---
els.clearBtn.addEventListener("click", () => {
  els.textInput.value = ""; els.textInput.focus();
  chrome.storage.local.set({ popupTextInput: "" });
});
els.textInput.addEventListener("input", () => {
  chrome.storage.local.set({ popupTextInput: els.textInput.value });
});
els.textInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") els.startBtn.click();
});
els.startBtn.addEventListener("click", async () => {
  const text = els.textInput.value.trim();
  if (!text || text.length < 10) { showError("Please enter at least 10 characters"); return; }
  try {
    els.startBtn.disabled = true;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: "START_FAST_READER_FROM_POPUP", text });
    setTimeout(() => window.close(), 300);
  } catch (err) {
    console.error(err); showError("Could not start Fast Reader"); els.startBtn.disabled = false;
  }
});

function showError(message) {
  const div = document.createElement("div");
  div.className = "error-notification"; div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
```

- [ ] **Step 4: Verify the manifest for the module popup (no change required)**

In MV3 the popup page supports `<script type="module">`; `web_accessible_resources` is not required (the popup is an extension page). `src/shared/settings.js` is loaded via a relative import from the popup. NO additional manifest change (web access will be added for the HUD in Task 5).

- [ ] **Step 5: Verify in Chrome**

Reload the extension. Expected:
1. The popup renders according to the light/dark theme; the title is plain orange; the buttons use the new style.
2. ⚙ → the settings view opens; ← returns.
3. Select "Light" from the theme segmented → the popup switches to light immediately; close and reopen the popup → the selection persists (storage).
4. The default-speed slider updates the value and stores it.
5. Enter text → Start works (if the active tab has a content script, the HUD opens).

- [ ] **Step 6: Commit**

```bash
git add src/popup/popup.html src/popup/popup.css src/popup/popup.js
git commit -m "feat(popup): token refactor + in-popup settings view with theme control"
```

---

### Task 5: HUD restyle to tokens (always-dark) + rename

Move `styles.css` to `hud.css`, convert it to tokens, and pin the HUD to always-dark.

**Files:**
- Rename: `src/styles/styles.css` → `src/styles/hud.css`
- Modify: `src/styles/hud.css` (the renamed file)
- Modify: `src/hud/hud.html`
- Modify: `manifest.json`

**Interfaces:**
- Consumes: `tokens.css`, `base.css`, `components.css`.
- Produces: `src/styles/hud.css`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/shared/settings.js` made accessible in `web_accessible_resources`.

- [ ] **Step 1: Rename the file**

```bash
git mv src/styles/styles.css src/styles/hud.css
```

- [ ] **Step 2: `src/hud/hud.html` — link the head to the token chain + pin the root to dark**

`<html lang="en">` → `<html lang="en" data-theme="dark">` (the HUD is always dark). Replace the `<link rel="stylesheet" href="../styles/styles.css" />` line in `<head>` with:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
    <link rel="stylesheet" href="../styles/components.css" />
    <link rel="stylesheet" href="../styles/hud.css" />
```

- [ ] **Step 3: `src/styles/hud.css` — replace fixed values with tokens**

Replace ALL fixed values in the file according to the mapping table below (find-and-replace). Since the HUD root is `data-theme="dark"`, the tokens resolve to the dark values.

| Old (constant) | New (token) |
|---|---|
| `rgba(0, 0, 0, 0.85)` (hud background) | `var(--surface-overlay)` |
| `linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)` | `var(--accent)` |
| `linear-gradient(135deg, #ff7b45 0%, #ffa726 100%)` (hover) | `var(--accent-hover)` |
| `#ff6b35` (speed-display, center-char) | `var(--accent)` |
| `#ffffff` / `white` text | `var(--text)` |
| `rgba(255,255,255,0.9/0.8/0.7)` | `var(--text-muted)` |
| `rgba(255, 255, 255, 0.3)` (context/preview) | `var(--text-faint)` |
| `rgba(255, 255, 255, 0.1/0.2)` (border/track) | `var(--border)` |
| `rgba(255, 255, 255, 0.16)` | `var(--border-strong)` |
| `border-radius: 12px/16px/8px` | `var(--radius-md/lg/sm)` |
| `padding/gap: 8/12/16/24px` | `var(--space-2/3/4/6)` |
| `#667eea` (focus outline — BUG) | remove (global `:focus-visible` in base.css) |
| close button red gradient | `.icon-btn .icon-btn--danger` (see below) |
| `::before` sliding shimmer blocks (`.btn::before`, `.action-btn::before`) | **remove entirely** |
| `transform: translateY(-2px/-3px)` hover | `transform: scale(1.02)` |

In addition, these structural adjustments:
- **Remove** the `.fast-reader-hud` gradient `::before` overlay block (refined direction).
- Remove `.close-btn`'s own color/gradient rules; the markup in Task 6 will be `class="icon-btn icon-btn--danger"`, so in hud.css only the positioning remains:
  ```css
  .close-btn { position: absolute; top: var(--space-4); right: var(--space-4); z-index: 10; }
  ```
- To avoid a `.btn` (inside the HUD) collision, the HUD buttons will also use the `.btn` classes from `components.css` (markup in Task 6). **Remove** the old `.btn`, `.btn-primary`, `.btn-secondary` blocks in hud.css.
- Bring `.fast-reader-controls` closer to the panel: `background: var(--surface-overlay); backdrop-filter: var(--blur-panel); box-shadow: var(--elevation-2); border: 1px solid var(--border); border-radius: var(--radius-lg);`
- Remove the `kbd` block (the markup will use the `.kbd` component).
- Keep the `@media (prefers-contrast: high)` and responsive blocks in the lower section; also update the fixed colors inside them to tokens.
- The `scrollbar` blocks were moved to base.css → **remove** the scrollbar blocks in hud.css.

- [ ] **Step 4: `manifest.json` — update web_accessible_resources**

Change the `web_accessible_resources[0].resources` array to:

```json
      "resources": [
        "src/hud/hud.html",
        "src/hud/hud.js",
        "src/shared/settings.js",
        "src/styles/tokens.css",
        "src/styles/base.css",
        "src/styles/components.css",
        "src/styles/hud.css",
        "src/styles/content.css",
        "assets/icons/*"
      ],
```

- [ ] **Step 5: Verify in Chrome**

Reload the extension. On a page, select 10+ words of text → click the selection icon (or Start from the popup). Expected:
1. The HUD opens and appears **dark even when the system theme is light**.
2. The control panel, buttons, slider, progress, and kbd badges render with the new token-based style.
3. NO sliding shimmer effect; on hover the buttons grow slightly.
4. The close button is neutral; on hover it turns red.
5. NO 404 (missing css/js) or CSP errors in the console.

- [ ] **Step 6: Commit**

```bash
git add src/styles/hud.css src/hud/hud.html manifest.json
git commit -m "feat(hud): token restyle, always-dark, drop shimmer/gradient noise"
```

---

### Task 6: HUD reading UX (ORP line, remaining time, context toggle)

Modularize the HUD behavior and improve the reading UX; apply the settings.

**Files:**
- Modify: `src/hud/hud.html`
- Modify: `src/hud/hud.js`
- Modify: `src/styles/hud.css`

**Interfaces:**
- Consumes: `src/shared/settings.js` (`DEFAULT_SETTINGS`, `splitWords`, `estimateRemainingMs`, `formatDuration`, `orpIndex`).
- Produces: after the HUD `INIT_FAST_READER` message, reads `settings` from `chrome.storage.local`; applies `settings.orp`/`settings.contextWords`/`settings.defaultWpm`.

- [ ] **Step 1: `src/hud/hud.html` — ORP line, remaining time, button/kbd/close markup**

`<html ... data-theme="dark">` (Task 5). Move the close button and kbd to components; add the ORP line and remaining time. Update the relevant parts of the `<body>` content as follows:

```html
    <button id="closeBtn" class="close-btn icon-btn icon-btn--danger" title="Close" aria-label="Close">✖</button>
    <div class="fast-reader-controls">
      <h2 class="title">Fast Reader</h2>
      <div class="speed-control">
        <label for="speed">Reading speed</label>
        <div class="speed-display"><span id="speedValue">250</span> wpm</div>
        <input id="speed" class="slider" type="range" min="100" max="1000" value="250" />
      </div>
      <div class="progress-info">
        <span id="wordCount">0 / 0</span>
        <span id="remaining" class="remaining">0:00</span>
        <div class="progress"><div id="progress" class="progress__fill"></div></div>
      </div>
      <div class="buttons">
        <button id="startBtn" class="btn btn--primary">Start</button>
        <button id="pauseBtn" class="btn btn--secondary" disabled>Pause</button>
        <button id="resetBtn" class="btn btn--secondary">Reset</button>
      </div>
    </div>

    <div id="wordDisplay" class="fast-reader-word-display">
      <div class="text-preview"><div id="readPart" class="read-part"></div></div>
      <div class="word-container">
        <div class="orp-guide" id="orpGuide" hidden></div>
        <span id="prevWord" class="word-context prev-word"></span>
        <span id="currentWord" class="current-word"></span>
        <span id="nextWord" class="word-context next-word"></span>
      </div>
      <div class="text-preview"><div id="unreadPart" class="unread-part"></div></div>
    </div>

    <div class="keyboard-shortcuts">
      <div class="shortcut"><kbd class="kbd">Space</kbd> Play/Pause</div>
      <div class="shortcut"><kbd class="kbd">R</kbd> Reset</div>
      <div class="shortcut"><kbd class="kbd">Esc</kbd> Close</div>
    </div>
    <script type="module" src="hud.js"></script>
```

- [ ] **Step 2: `src/styles/hud.css` — add ORP line + remaining time styles**

Add to the end of the file:

```css
.orp-guide {
  position: absolute; left: 50%; top: 50%;
  width: 2px; height: 1.4em; transform: translate(-50%, -50%);
  background: var(--accent); opacity: .5; pointer-events: none;
}
.remaining { font-size: var(--font-label); color: var(--text-muted); text-align: center; }
.progress-info { display: flex; flex-direction: column; gap: var(--space-2); align-items: center; }
.current-word .center-char { color: var(--accent); }
```

- [ ] **Step 3: `src/hud/hud.js` — module + apply settings + ORP/remaining time**

Rewrite from scratch (behavior preserved, settings + UX added):

```js
import {
  DEFAULT_SETTINGS, splitWords, estimateRemainingMs, formatDuration, orpIndex,
} from "../shared/settings.js";

let words = [], index = 0, interval = null;
let wordsPerMinute = DEFAULT_SETTINGS.defaultWpm;
let paused = false, isReading = false;
let settings = { ...DEFAULT_SETTINGS };

const $ = (id) => document.getElementById(id);
const el = {
  speed: $("speed"), speedValue: $("speedValue"),
  startBtn: $("startBtn"), pauseBtn: $("pauseBtn"), resetBtn: $("resetBtn"), closeBtn: $("closeBtn"),
  currentWord: $("currentWord"), prevWord: $("prevWord"), nextWord: $("nextWord"),
  readPart: $("readPart"), unreadPart: $("unreadPart"),
  wordCount: $("wordCount"), remaining: $("remaining"), progress: $("progress"),
  orpGuide: $("orpGuide"),
};

async function loadSettings() {
  try {
    const res = await chrome.storage.local.get(["settings"]);
    settings = { ...DEFAULT_SETTINGS, ...(res.settings || {}) };
  } catch { settings = { ...DEFAULT_SETTINGS }; }
  wordsPerMinute = settings.defaultWpm;
  el.speed.value = wordsPerMinute;
  el.speedValue.textContent = wordsPerMinute;
  el.orpGuide.hidden = !settings.orp;
}

window.addEventListener("message", async (event) => {
  if (event.data.type === "INIT_FAST_READER") {
    await loadSettings();
    words = splitWords(event.data.text);
    index = 0;
    updateAll();
    el.currentWord.textContent = "Ready to start...";
    el.prevWord.textContent = ""; el.nextWord.textContent = "";
  }
});

el.speed.addEventListener("input", (e) => {
  wordsPerMinute = Number(e.target.value);
  el.speedValue.textContent = wordsPerMinute;
  updateRemaining();
  if (isReading && !paused) { clearInterval(interval); startReading(); }
});

el.startBtn.addEventListener("click", () => {
  if (!words.length) return;
  isReading = true; paused = false;
  el.startBtn.disabled = true; el.pauseBtn.disabled = false; el.pauseBtn.textContent = "Pause";
  startReading();
});
el.pauseBtn.addEventListener("click", () => {
  if (paused) { paused = false; el.pauseBtn.textContent = "Pause"; startReading(); }
  else { paused = true; el.pauseBtn.textContent = "Resume"; clearInterval(interval); }
});
el.resetBtn.addEventListener("click", resetReader);
el.closeBtn.addEventListener("click", () => {
  clearInterval(interval);
  window.parent.postMessage({ type: "CLOSE_FAST_READER" }, "*");
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); isReading ? el.pauseBtn.click() : el.startBtn.click(); }
  else if (e.key === "r" || e.key === "R") resetReader();
  else if (e.code === "Escape") { e.preventDefault(); el.closeBtn.click(); }
});

function startReading() {
  clearInterval(interval);
  const speedInMs = (60 * 1000) / wordsPerMinute;
  interval = setInterval(() => {
    if (paused) return;
    if (index >= words.length) {
      clearInterval(interval); isReading = false;
      el.startBtn.disabled = false; el.pauseBtn.disabled = true; el.pauseBtn.textContent = "Pause";
      el.currentWord.textContent = "Reading complete!";
      el.prevWord.textContent = ""; el.nextWord.textContent = "";
      return;
    }
    showWord(words[index]); index++; updateAll();
  }, speedInMs);
}

function showWord(word) {
  el.currentWord.innerHTML = formatWordWithCenterHighlight(word);
  const isLong = word.length > 12;
  const showContext = settings.contextWords && !isLong;
  const prev = showContext && index > 0 ? words[index - 1] : "";
  const next = showContext && index < words.length - 1 ? words[index + 1] : "";
  el.prevWord.textContent = prev; el.nextWord.textContent = next;
  el.currentWord.classList.toggle("long-word", isLong);
  el.prevWord.classList.toggle("long-word", prev.length > 12);
  el.nextWord.classList.toggle("long-word", next.length > 12);
  updateTextPreview();
}

function formatWordWithCenterHighlight(word) {
  if (!word) return word;
  const mid = orpIndex(word.length);
  const isEven = word.length > 1 && word.length % 2 === 0;
  return word.split("").map((ch, i) => {
    if (i === mid || (isEven && i === mid + 1)) return `<span class="center-char">${ch}</span>`;
    return ch;
  }).join("");
}

function updateAll() { updateWordCount(); updateProgress(); updateRemaining(); updateTextPreview(); }
function updateWordCount() { el.wordCount.textContent = `${index} / ${words.length}`; }
function updateProgress() {
  el.progress.style.width = `${words.length ? (index / words.length) * 100 : 0}%`;
}
function updateRemaining() {
  el.remaining.textContent = formatDuration(estimateRemainingMs(Math.max(0, words.length - index), wordsPerMinute));
}
function updateTextPreview() {
  if (!words.length) { el.readPart.textContent = ""; el.unreadPart.textContent = ""; return; }
  el.readPart.textContent = words.slice(0, index).join(" ");
  el.readPart.scrollTo({ top: el.readPart.scrollHeight, behavior: "smooth" });
  el.unreadPart.textContent = words.slice(index + 1).join(" ");
}

function resetReader() {
  clearInterval(interval); index = 0; isReading = false; paused = false;
  el.startBtn.disabled = false; el.pauseBtn.disabled = true; el.pauseBtn.textContent = "Pause";
  updateAll();
  el.currentWord.textContent = "Ready to start..."; el.currentWord.classList.remove("long-word");
  el.prevWord.textContent = ""; el.nextWord.textContent = "";
  el.prevWord.classList.remove("long-word"); el.nextWord.classList.remove("long-word");
}
```

- [ ] **Step 4: Verify in Chrome**

Reload the extension. Open the HUD via Start from the popup. Expected:
1. On open, the HUD uses the default speed from the popup.
2. Space starts reading; the words flow with the center character highlighted orange.
3. `progress-info` shows `x / y` and the **remaining time** (`m:ss`); when the speed changes, the remaining time updates.
4. When **ORP focus line is off** in settings, the vertical line is not shown in the HUD; when on, it is shown.
5. When **Context words is off** in settings, the previous/next words stay empty.
6. Reset/close/keyboard shortcuts work.

- [ ] **Step 5: Commit**

```bash
git add src/hud/hud.html src/hud/hud.js src/styles/hud.css
git commit -m "feat(hud): ORP guide, remaining time, context toggle, settings-driven"
```

---

### Task 7: Selection FAB (content.css) to tokens

Move the content-script selection icon and iframe to tokens. The FAB must always be dark and legible (on top of the page).

**Files:**
- Modify: `src/styles/content.css`

**Interfaces:**
- Consumes: NOT `tokens.css` — content.css is injected into the page and the token file is not loaded there. Therefore the FAB stays **self-contained** with fixed values (token-less), but consistent with the design-system palette. (Manifest content_scripts loads only content.css.)

- [ ] **Step 1: `src/styles/content.css` — refine the FAB, simplify the iframe**

Rewrite from scratch (constants consistent with the spec palette; no tokens in the injected context):

```css
/* Selection icon — injected into the page, token-independent */
.fast-reader-icon {
  position: absolute;
  width: 2rem; height: 2rem;
  display: flex; align-items: center; justify-content: center;
  border-radius: 999px; overflow: hidden;
  border: 2px solid #ff6b35;
  box-shadow: 0 4px 16px rgba(0,0,0,.32);
  cursor: pointer; user-select: none;
  z-index: 2147483647;
  transition: transform 120ms cubic-bezier(.2,0,0,1), box-shadow 120ms cubic-bezier(.2,0,0,1);
}
.fast-reader-icon img { width: 100%; height: 100%; object-fit: contain; border-radius: 999px; }
.fast-reader-icon:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(255,107,53,.5); }
.fast-reader-icon:active { transform: scale(1.02); }

.fast-reader-iframe {
  position: fixed; inset: 0; width: 100vw; height: 100vh;
  border: none; background: transparent; z-index: 2147483646;
}
```

- [ ] **Step 2: Verify in Chrome**

Reload the extension. On a page, select 10+ words. Expected: a single-size icon with an orange border appears next to the cursor; on hover it grows slightly (no sliding shimmer); clicking opens the HUD. When the selection clears, the icon disappears.

- [ ] **Step 3: Commit**

```bash
git add src/styles/content.css
git commit -m "feat(content): refine selection FAB to match design system"
```

---

### Task 8: Cleanup, version bump, docs

Final touches and versioning.

**Files:**
- Modify: `manifest.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: all previous tasks must be complete.

- [ ] **Step 1: `manifest.json` — version bump**

`"version": "2.0.0"` → `"version": "3.0.0"`.

- [ ] **Step 2: `README.md` — version history and theme/settings note**

Add to the top of the `## 📊 Version History` section:

```markdown
- **v3.0** (Current)
  - Token-based design system (dark + automatic light theme)
  - In-popup settings: default speed, theme (Dark/Light/System), ORP and context toggles
  - HUD: ORP focus line, remaining-time indicator, refined look (shimmer/gradient noise removed)
  - Accessibility: WCAG AA contrast, consistent focus ring, reduced-motion
```

Also add the line "Light & Dark: automatic + manual theme selection" to the "Design Philosophy" section.

- [ ] **Step 3: Full regression verification**

Reload the extension and check end-to-end:
1. `node --test` → all unit tests PASS.
2. Popup: light/dark (system + manual), settings persist, Start/Clear work.
3. HUD via selection: FAB → HUD dark; reading, speed, remaining time, and ORP/context settings applied.
4. Right-click menu (FRead) → HUD opens (the background.js flow is not broken).
5. NO error/404/CSP warning in the console.
6. `grep -rn "667eea\|f7931e\|#ff6b35" src/` → should return only `tokens.css` (primitive definition) and `content.css` (injected, token-less); no constants should remain elsewhere.

- [ ] **Step 4: Commit**

```bash
git add manifest.json README.md
git commit -m "chore: bump to v3.0.0 and update docs"
```

---

## Self-Review Notes

- **Spec coverage:** Token architecture (Task 1) · pure logic/theme resolution (Task 2) · components (Task 3) · popup + settings + theme selection (Task 4) · HUD always-dark restyle (Task 5) · HUD reading UX/ORP/remaining time (Task 6) · selection FAB (Task 7) · accessibility (Task 1 base + all task verifications) · migration/cleanup/versioning (Task 8). All 12 sections of the spec are tied to a task.
- **Type consistency:** the `settings` object shape `{ defaultWpm, theme, orp, contextWords }` is the same across Tasks 2/4/6; the `resolveTheme`/`applyTheme`, `splitWords`, `estimateRemainingMs`/`formatDuration`, `orpIndex` signatures are defined in Task 2 and consistent with where they are consumed.
- **Access model:** the popup is an extension page (module import allowed); the HUD is an iframe injected into the web → `hud.js` + `settings.js` + all css in `web_accessible_resources` (Task 5). content.css is token-less in the injected context (Task 7 note).
- **Deliberately out of scope:** onboarding, a full redesign, a font library, word chunking (spec Section 11).
