# Fast Reader v3 Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut koyu+turuncu kimliği koruyup olgunlaştıran, token tabanlı bir design system kurmak; 3 yüzeyi (popup, HUD, seçim ikonu) yenilemek; popup içine ayarlar görünümü ve HUD'a okuma UX iyileştirmeleri eklemek.

**Architecture:** Tüm görsel değerler tek bir `tokens.css` içindeki iki katmanlı token setinden (primitive → semantik) gelir. Semantik token'lar koyu (varsayılan) + açık temaya `prefers-color-scheme` ve `<html data-theme>` override'ı ile eşlenir. Saf mantık (tema çözümleme, kalan süre, kelime bölme, ORP) `src/shared/settings.js` içinde chrome-bağımsız ES modülüne çıkarılır ve `node --test` ile birim testi yapılır; CSS/DOM işleri Chrome'da manuel doğrulanır.

**Tech Stack:** Vanilla JS (ES modules), CSS custom properties, Chrome Extension MV3, `chrome.storage.local`, Node.js built-in test runner (`node --test`, sıfır bağımlılık).

## Global Constraints

- Manifest V3; harici build/bundler yok — dosyalar doğrudan yüklenir.
- Yeni npm runtime bağımlılığı YOK. Test için yalnızca Node built-in `node:test` + `node:assert`.
- Komponentler SADECE semantik token kullanır; ham renk/px değeri elle yazılmaz.
- HUD her zaman koyu (tema seçiminden bağımsız).
- Erişilebilirlik: WCAG AA kontrast, tek tutarlı `:focus-visible` halkası, `prefers-reduced-motion` + `prefers-contrast: high` desteği.
- Spec: `docs/superpowers/specs/2026-09-05-design-system-design.md` (bu planın tek doğruluk kaynağı).
- Font: Inter, ağırlıklar 400/500/600/700 ile sınırlı.

---

## Dosya Yapısı

**Oluşturulacak:**
- `package.json` — kök; sadece `{"type":"module"}` (Node'un `.js`'i ESM okuması için; Chrome bunu okumaz).
- `src/styles/tokens.css` — primitive + semantik token'lar, tema override, motion token'ları.
- `src/styles/base.css` — reset, tipografi rampı, `:focus-visible`, scrollbar, reduced-motion.
- `src/styles/components.css` — Button, IconButton, Slider, Progress, Input, Toggle, Segmented, Kbd, Panel.
- `src/shared/settings.js` — saf yardımcılar (ES module): `DEFAULT_SETTINGS`, `resolveTheme`, `estimateRemainingMs`, `formatDuration`, `splitWords`, `orpIndex`.
- `test/settings.test.js` — `node --test` birim testleri.

**Değiştirilecek:**
- `src/popup/popup.html` — ayarlar (⚙) butonu + ayarlar görünümü; token/base/components css bağlantıları.
- `src/popup/popup.css` — token'lara taşınır; ayarlar görünümü stilleri.
- `src/popup/popup.js` — `type="module"`; ayarlar depolama, tema uygulama, görünüm geçişi.
- `src/hud/hud.html` — ORP çizgisi + kalan süre elemanları; token/base/components + hud.css.
- `src/hud/hud.js` — `type="module"`; ayarları oku, ORP/bağlam toggle, kalan süre, defaultWpm.
- `src/styles/content.css` — Selection FAB + iframe token'lara taşınır.
- `manifest.json` — version 3.0.0; `web_accessible_resources`'a yeni css + `src/shared/settings.js` + `hud.css`.
- `README.md` — sürüm geçmişi v3.0.

**Yeniden adlandırılacak:**
- `src/styles/styles.css` → `src/styles/hud.css` (HUD'a özel; token'lara taşınır, always-dark).

---

### Task 1: Token & base foundation

Design system'in çekirdeği. Bundan sonraki her task bu token'ları kullanır.

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Modify: `src/popup/popup.html` (yalnızca `<head>` link'leri — geçici doğrulama için)

**Interfaces:**
- Produces: semantik CSS değişkenleri — `--surface`, `--surface-raised`, `--surface-overlay`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--text-faint`, `--accent`, `--accent-hover`, `--accent-text`, `--focus-ring`, `--danger`, `--danger-hover`, `--success`; ölçek token'ları — `--space-1..8`, `--radius-sm/md/lg/full`, `--font-display/title/body/label/caption`, `--fw-regular/medium/semibold/bold`, `--elevation-1/2`, `--blur-panel`, `--accent-glow`, `--ease-out`, `--dur-fast/base`. Tema override: `<html data-theme="light|dark">`.

- [ ] **Step 1: `src/styles/tokens.css` dosyasını oluştur**

```css
/* ============ PRIMITIVE (tema-bağımsız ham değerler) ============ */
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

  /* Ölçekler */
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

/* ============ SEMANTİK — KOYU (varsayılan) ============ */
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

/* ============ SEMANTİK — AÇIK ============ */
/* Sistem açık VE kullanıcı koyu'ya zorlamadıysa */
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
/* Kullanıcı açık'a zorladıysa (sistem ne olursa olsun) */
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

- [ ] **Step 2: `src/styles/base.css` dosyasını oluştur**

```css
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text);
  background: var(--surface);
  -webkit-font-smoothing: antialiased;
}

/* Tek tutarlı focus halkası (eski #667eea hatasının yerine) */
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

- [ ] **Step 3: `src/popup/popup.html` `<head>`'ine token + base bağla (mevcut popup.css'ten ÖNCE)**

`<link rel="stylesheet" href="popup.css" />` satırının ÖNÜNE ekle:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
```

- [ ] **Step 4: Chrome'da doğrula (koyu/açık override)**

1. `chrome://extensions` → Developer mode → "Load unpacked" → repo klasörü.
2. Popup'ı aç. DevTools console'da çalıştır:
   `document.documentElement.setAttribute('data-theme','light')`
   Beklenen: zemin açık renge döner (`--surface` = `#f5f4f2`).
   `document.documentElement.setAttribute('data-theme','dark')` → koyu döner.
   `document.documentElement.removeAttribute('data-theme')` → sistem temasına döner.

Expected: Üç durumda da zemin/metin okunur; hata yok. (Mevcut popup.css hâlâ eski sabit renkleri kullandığı için tam stil sonraki task'larda oturacak — burada yalnızca token katmanının çalıştığını doğruluyoruz.)

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/base.css src/popup/popup.html
git commit -m "feat(design-system): add token foundation and base styles"
```

---

### Task 2: Shared settings helpers (TDD)

Chrome-bağımsız saf mantık. Gerçek birim testleriyle.

**Files:**
- Create: `package.json`
- Create: `src/shared/settings.js`
- Test: `test/settings.test.js`

**Interfaces:**
- Produces:
  - `DEFAULT_SETTINGS = { defaultWpm: 250, theme: "system", orp: true, contextWords: true }`
  - `resolveTheme(theme)` → `"light" | "dark" | null` — `"system"` için `null` (attribute silinir), aksi halde aynen döner.
  - `splitWords(text)` → `string[]` (boşluklara böl, boşları at).
  - `estimateRemainingMs(wordsLeft, wpm)` → `number` (ms). `wpm<=0` ise `0`.
  - `formatDuration(ms)` → `string` (`"0:47"`, `"1:05"`, `"12:03"` biçimi).
  - `orpIndex(len)` → `number` — kelime uzunluğuna göre vurgulanacak karakter indeksi (RSVP odak noktası).

- [ ] **Step 1: Failing test yaz — `test/settings.test.js`**

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

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `node --test`
Expected: FAIL — `Cannot find module '../src/shared/settings.js'`.

- [ ] **Step 3: `package.json` oluştur**

```json
{
  "name": "fast-reader",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
```

- [ ] **Step 4: `src/shared/settings.js` oluştur (minimal implementasyon)**

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

- [ ] **Step 5: Testi çalıştır, geçtiğini gör**

Run: `node --test`
Expected: PASS — 6 test.

- [ ] **Step 6: Commit**

```bash
git add package.json src/shared/settings.js test/settings.test.js
git commit -m "feat(shared): add tested settings/reader helpers"
```

---

### Task 3: Component library

Tüm yüzeylerin paylaşacağı komponent stilleri. Yalnızca token kullanır.

**Files:**
- Create: `src/styles/components.css`

**Interfaces:**
- Produces CSS sınıfları: `.btn` + `.btn--primary/.btn--secondary/.btn--ghost`; `.icon-btn` (+ `.icon-btn--danger`); `.slider`; `.progress` + `.progress__fill`; `.field` (input/textarea); `.switch` (+ `input`); `.segmented` + `.segmented__option`; `.kbd`; `.panel`.

- [ ] **Step 1: `src/styles/components.css` oluştur**

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

- [ ] **Step 2: Chrome'da görsel doğrulama (geçici sandbox)**

`src/popup/popup.html` `<head>`'ine geçici olarak `<link rel="stylesheet" href="../styles/components.css" />` ekle, `<body>` başına geçici bir test bloğu koy:

```html
<div style="padding:16px; display:flex; flex-direction:column; gap:12px">
  <button class="btn btn--primary">Primary</button>
  <button class="btn btn--secondary">Secondary</button>
  <label class="switch"><input type="checkbox" checked><span class="switch__track"></span></label>
  <div class="segmented">
    <button class="segmented__option" aria-pressed="true">Koyu</button>
    <button class="segmented__option">Açık</button>
    <button class="segmented__option">Sistem</button>
  </div>
  <kbd class="kbd">Space</kbd>
</div>
```

Uzantıyı reload et, popup'ı aç. Beklenen: butonlar, toggle (açık=turuncu, sağda), segmented (seçili=turuncu), kbd doğru görünür; `data-theme` değişince renkler tema ile döner.

- [ ] **Step 3: Geçici test bloğunu ve geçici link'i geri al**

Step 2'de eklenen geçici `<div>` bloğunu sil. `components.css` link'ini de sil (Task 4'te kalıcı olarak eklenecek). `popup.html` Task 1 sonundaki haline dönsün.

- [ ] **Step 4: Commit**

```bash
git add src/styles/components.css
git commit -m "feat(design-system): add token-based component library"
```

---

### Task 4: Popup refactor + settings view

Popup'ı token/komponentlere taşı, ayarlar görünümünü ve tema/depolama mantığını ekle.

**Files:**
- Modify: `src/popup/popup.html`
- Modify: `src/popup/popup.css`
- Modify: `src/popup/popup.js`

**Interfaces:**
- Consumes: `src/shared/settings.js` (`DEFAULT_SETTINGS`, `resolveTheme`); `components.css`, `tokens.css`, `base.css`.
- Produces: `chrome.storage.local` içinde `settings` nesnesi (`DEFAULT_SETTINGS` şekli). `applyTheme(theme)` fonksiyonu `<html>`'e `data-theme` uygular/siler.

- [ ] **Step 1: `src/popup/popup.html` — head + iki görünüm + ayarlar butonu**

`<head>` içinde, `popup.css`'ten önce token/base/components bağla:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
    <link rel="stylesheet" href="../styles/components.css" />
    <link rel="stylesheet" href="popup.css" />
```

`<body>` içeriğini iki görünümlü yapıya çevir (giriş + ayarlar), scripti module yap:

```html
  <body>
    <div class="popup-container">
      <div class="popup-header">
        <h1 class="popup-title">Fast Reader</h1>
        <button id="settingsBtn" class="icon-btn" title="Ayarlar" aria-label="Ayarlar">⚙</button>
      </div>

      <!-- GİRİŞ GÖRÜNÜMÜ -->
      <section id="readerView" class="popup-body">
        <textarea id="textInput" class="field text-input"
          placeholder="Metni buraya girin veya yapıştırın..." rows="10"></textarea>
        <div class="input-actions">
          <button id="startBtn" class="btn btn--primary">Başlat</button>
          <button id="clearBtn" class="btn btn--secondary">Temizle</button>
        </div>
      </section>

      <!-- AYARLAR GÖRÜNÜMÜ -->
      <section id="settingsView" class="popup-body settings-view" hidden>
        <button id="backBtn" class="btn btn--ghost back-btn" aria-label="Geri">← Geri</button>

        <div class="setting-row">
          <label for="defaultWpm">Varsayılan hız</label>
          <div class="setting-control">
            <span id="defaultWpmValue">250</span> kel/dk
            <input id="defaultWpm" class="slider" type="range" min="100" max="1000" value="250" />
          </div>
        </div>

        <div class="setting-row">
          <span>Tema</span>
          <div class="segmented" id="themeSeg" role="group" aria-label="Tema">
            <button class="segmented__option" data-theme-value="dark">Koyu</button>
            <button class="segmented__option" data-theme-value="light">Açık</button>
            <button class="segmented__option" data-theme-value="system">Sistem</button>
          </div>
        </div>

        <div class="setting-row">
          <label for="orpToggle">ORP odak çizgisi</label>
          <label class="switch"><input id="orpToggle" type="checkbox" /><span class="switch__track"></span></label>
        </div>

        <div class="setting-row">
          <label for="contextToggle">Bağlam kelimeleri</label>
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

- [ ] **Step 2: `src/popup/popup.css` — token'lara taşı + ayarlar stilleri**

`popup.css`'i baştan yaz (eski sabit renkler ve `.action-btn`/`.btn-*` blokları komponentlere devredildiği için kaldırılır):

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
  color: var(--accent); /* sade accent — gradyan yok */
}

.popup-body {
  flex: 1; display: flex; flex-direction: column;
  gap: var(--space-4); padding: var(--space-6);
}
.text-input { flex: 1; resize: none; }
.input-actions { display: flex; gap: var(--space-3); }
.input-actions .btn { flex: 1; }

/* Ayarlar görünümü */
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

/* Hata bildirimi (popup.js'ten taşındı) */
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

- [ ] **Step 3: `src/popup/popup.js` — module + ayarlar + tema + görünüm geçişi**

Baştan yaz:

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

// --- Görünüm geçişi ---
els.settingsBtn.addEventListener("click", () => {
  els.readerView.hidden = true; els.settingsView.hidden = false;
});
els.backBtn.addEventListener("click", () => {
  els.settingsView.hidden = true; els.readerView.hidden = false; els.textInput.focus();
});

// --- Ayar kontrolleri ---
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

// --- Giriş görünümü ---
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
  if (!text || text.length < 10) { showError("Lütfen en az 10 karakter girin"); return; }
  try {
    els.startBtn.disabled = true;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: "START_FAST_READER_FROM_POPUP", text });
    setTimeout(() => window.close(), 300);
  } catch (err) {
    console.error(err); showError("Fast Reader başlatılamadı"); els.startBtn.disabled = false;
  }
});

function showError(message) {
  const div = document.createElement("div");
  div.className = "error-notification"; div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
```

- [ ] **Step 4: Manifest'i module popup için doğrula (değişiklik gerekmez)**

MV3'te popup sayfası `<script type="module">` destekler; `web_accessible_resources` gerekmez (popup uzantı sayfasıdır). `src/shared/settings.js` popup'a göreli import ile yüklenir. Ek manifest değişikliği YOK (web erişimi Task 5'te HUD için eklenecek).

- [ ] **Step 5: Chrome'da doğrula**

Uzantıyı reload et. Beklenen:
1. Popup açık/koyu temaya göre görünür; başlık sade turuncu; butonlar yeni stil.
2. ⚙ → ayarlar görünümü açılır; ← ile geri döner.
3. Tema segmented'ından "Açık" seç → popup anında açık temaya döner; popup'ı kapatıp aç → seçim korunur (storage).
4. Varsayılan hız slider'ı değeri günceller ve saklanır.
5. Metin gir → Başlat çalışır (aktif sekmede content script varsa HUD açılır).

- [ ] **Step 6: Commit**

```bash
git add src/popup/popup.html src/popup/popup.css src/popup/popup.js
git commit -m "feat(popup): token refactor + in-popup settings view with theme control"
```

---

### Task 5: HUD restyle to tokens (always-dark) + rename

`styles.css`'i `hud.css`'e taşı, token'lara çevir, HUD'u her zaman koyu sabitle.

**Files:**
- Rename: `src/styles/styles.css` → `src/styles/hud.css`
- Modify: `src/styles/hud.css` (yeniden adlandırılan dosya)
- Modify: `src/hud/hud.html`
- Modify: `manifest.json`

**Interfaces:**
- Consumes: `tokens.css`, `base.css`, `components.css`.
- Produces: `web_accessible_resources`'ta `src/styles/hud.css`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/components.css`, `src/shared/settings.js` erişilebilir.

- [ ] **Step 1: Dosyayı yeniden adlandır**

```bash
git mv src/styles/styles.css src/styles/hud.css
```

- [ ] **Step 2: `src/hud/hud.html` — head'i token zincirine bağla + kök koyu sabitle**

`<html lang="en">` → `<html lang="tr" data-theme="dark">` (HUD her zaman koyu). `<head>` içindeki `<link rel="stylesheet" href="../styles/styles.css" />` satırını şununla değiştir:

```html
    <link rel="stylesheet" href="../styles/tokens.css" />
    <link rel="stylesheet" href="../styles/base.css" />
    <link rel="stylesheet" href="../styles/components.css" />
    <link rel="stylesheet" href="../styles/hud.css" />
```

- [ ] **Step 3: `src/styles/hud.css` — sabit değerleri token'la değiştir**

Aşağıdaki eşleme tablosuna göre dosyadaki TÜM sabit değerleri değiştir (bul-değiştir). HUD kökü `data-theme="dark"` olduğundan token'lar koyu değerlere çözülür.

| Eski (sabit) | Yeni (token) |
|---|---|
| `rgba(0, 0, 0, 0.85)` (hud zemin) | `var(--surface-overlay)` |
| `linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)` | `var(--accent)` |
| `linear-gradient(135deg, #ff7b45 0%, #ffa726 100%)` (hover) | `var(--accent-hover)` |
| `#ff6b35` (speed-display, center-char) | `var(--accent)` |
| `#ffffff` / `white` metin | `var(--text)` |
| `rgba(255,255,255,0.9/0.8/0.7)` | `var(--text-muted)` |
| `rgba(255, 255, 255, 0.3)` (bağlam/preview) | `var(--text-faint)` |
| `rgba(255, 255, 255, 0.1/0.2)` (border/track) | `var(--border)` |
| `rgba(255, 255, 255, 0.16)` | `var(--border-strong)` |
| `border-radius: 12px/16px/8px` | `var(--radius-md/lg/sm)` |
| `padding/gap: 8/12/16/24px` | `var(--space-2/3/4/6)` |
| `#667eea` (focus outline — HATA) | sil (global `:focus-visible` base.css'te) |
| kapat butonu kırmızı gradyan | `.icon-btn .icon-btn--danger` (bkz. aşağı) |
| `::before` kayan parıltı blokları (`.btn::before`, `.action-btn::before`) | **tamamen sil** |
| `transform: translateY(-2px/-3px)` hover | `transform: scale(1.02)` |

Ek olarak şu yapısal düzenlemeler:
- `.fast-reader-hud` gradyan `::before` overlay bloğunu **sil** (rafine yön).
- `.close-btn`'in kendi renk/gradyan kurallarını sil; markup Task 6'da `class="icon-btn icon-btn--danger"` olacak, bu yüzden hud.css'te yalnızca konum kalsın:
  ```css
  .close-btn { position: absolute; top: var(--space-4); right: var(--space-4); z-index: 10; }
  ```
- `.btn` (HUD içi) çakışmasını önlemek için HUD butonları da `components.css`'teki `.btn` sınıflarını kullanacak (markup Task 6). hud.css'teki eski `.btn`, `.btn-primary`, `.btn-secondary` bloklarını **sil**.
- `.fast-reader-controls`'u panel'e yaklaştır: `background: var(--surface-overlay); backdrop-filter: var(--blur-panel); box-shadow: var(--elevation-2); border: 1px solid var(--border); border-radius: var(--radius-lg);`
- `kbd` bloğunu sil (markup `.kbd` komponentini kullanacak).
- Alt bölümdeki `@media (prefers-contrast: high)` ve responsive blokları koru; içlerindeki sabit renkleri de token'la güncelle.
- `scrollbar` blokları base.css'e taşındı → hud.css'teki scrollbar bloklarını **sil**.

- [ ] **Step 4: `manifest.json` — web_accessible_resources güncelle**

`web_accessible_resources[0].resources` dizisini şu şekilde değiştir:

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

- [ ] **Step 5: Chrome'da doğrula**

Uzantıyı reload et. Bir sayfada 10+ kelimelik metin seç → seçim ikonuna tıkla (veya popup'tan Başlat). Beklenen:
1. HUD açılır ve **sistem teması açık olsa bile koyu** görünür.
2. Kontrol paneli, butonlar, slider, progress, kbd rozetleri token'lı yeni stille görünür.
3. Kayan parıltı efekti YOK; hover'da butonlar hafif büyür.
4. Kapat butonu nötr; üzerine gelince kırmızıya döner.
5. Console'da 404 (eksik css/js) veya CSP hatası YOK.

- [ ] **Step 6: Commit**

```bash
git add src/styles/hud.css src/hud/hud.html manifest.json
git commit -m "feat(hud): token restyle, always-dark, drop shimmer/gradient noise"
```

---

### Task 6: HUD reading UX (ORP line, remaining time, context toggle)

HUD davranışını modülleştir ve okuma UX'ini geliştir; ayarları uygula.

**Files:**
- Modify: `src/hud/hud.html`
- Modify: `src/hud/hud.js`
- Modify: `src/styles/hud.css`

**Interfaces:**
- Consumes: `src/shared/settings.js` (`DEFAULT_SETTINGS`, `splitWords`, `estimateRemainingMs`, `formatDuration`, `orpIndex`).
- Produces: HUD `INIT_FAST_READER` mesajı sonrası `chrome.storage.local`'dan `settings` okur; `settings.orp`/`settings.contextWords`/`settings.defaultWpm` uygulanır.

- [ ] **Step 1: `src/hud/hud.html` — ORP çizgisi, kalan süre, buton/kbd/kapat markup**

`<html ... data-theme="dark">` (Task 5). Kapat butonu ve kbd'yi komponentlere geçir; ORP çizgisi ve kalan süre ekle. `<body>` içeriğinin ilgili kısımlarını şu şekilde güncelle:

```html
    <button id="closeBtn" class="close-btn icon-btn icon-btn--danger" title="Kapat" aria-label="Kapat">✖</button>
    <div class="fast-reader-controls">
      <h2 class="title">Fast Reader</h2>
      <div class="speed-control">
        <label for="speed">Okuma hızı</label>
        <div class="speed-display"><span id="speedValue">250</span> kel/dk</div>
        <input id="speed" class="slider" type="range" min="100" max="1000" value="250" />
      </div>
      <div class="progress-info">
        <span id="wordCount">0 / 0</span>
        <span id="remaining" class="remaining">0:00</span>
        <div class="progress"><div id="progress" class="progress__fill"></div></div>
      </div>
      <div class="buttons">
        <button id="startBtn" class="btn btn--primary">Başlat</button>
        <button id="pauseBtn" class="btn btn--secondary" disabled>Duraklat</button>
        <button id="resetBtn" class="btn btn--secondary">Sıfırla</button>
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
      <div class="shortcut"><kbd class="kbd">Space</kbd> Oynat/Duraklat</div>
      <div class="shortcut"><kbd class="kbd">R</kbd> Sıfırla</div>
      <div class="shortcut"><kbd class="kbd">Esc</kbd> Kapat</div>
    </div>
    <script type="module" src="hud.js"></script>
```

- [ ] **Step 2: `src/styles/hud.css` — ORP çizgisi + kalan süre stilleri ekle**

Dosya sonuna ekle:

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

- [ ] **Step 3: `src/hud/hud.js` — module + ayarları uygula + ORP/kalan süre**

Baştan yaz (davranış korunur, ayarlar + UX eklenir):

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
    el.currentWord.textContent = "Başlamaya hazır...";
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
  el.startBtn.disabled = true; el.pauseBtn.disabled = false; el.pauseBtn.textContent = "Duraklat";
  startReading();
});
el.pauseBtn.addEventListener("click", () => {
  if (paused) { paused = false; el.pauseBtn.textContent = "Duraklat"; startReading(); }
  else { paused = true; el.pauseBtn.textContent = "Devam"; clearInterval(interval); }
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
      el.startBtn.disabled = false; el.pauseBtn.disabled = true; el.pauseBtn.textContent = "Duraklat";
      el.currentWord.textContent = "Okuma tamamlandı!";
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
  el.startBtn.disabled = false; el.pauseBtn.disabled = true; el.pauseBtn.textContent = "Duraklat";
  updateAll();
  el.currentWord.textContent = "Başlamaya hazır..."; el.currentWord.classList.remove("long-word");
  el.prevWord.textContent = ""; el.nextWord.textContent = "";
  el.prevWord.classList.remove("long-word"); el.nextWord.classList.remove("long-word");
}
```

- [ ] **Step 4: Chrome'da doğrula**

Uzantıyı reload et. Popup'tan Başlat ile HUD'u aç. Beklenen:
1. HUD açılışta popup'taki varsayılan hızı kullanır.
2. Space ile okuma başlar; kelimeler orta karakter turuncu vurgulu akar.
3. `progress-info`'da `x / y` ve **kalan süre** (`m:ss`) görünür; hız değişince kalan süre güncellenir.
4. Ayarlar'da **ORP odak çizgisi kapalı** iken HUD'da dikey çizgi görünmez; açıkken görünür.
5. Ayarlar'da **Bağlam kelimeleri kapalı** iken önceki/sonraki kelimeler boş kalır.
6. Reset/kapat/klavye kısayolları çalışır.

- [ ] **Step 5: Commit**

```bash
git add src/hud/hud.html src/hud/hud.js src/styles/hud.css
git commit -m "feat(hud): ORP guide, remaining time, context toggle, settings-driven"
```

---

### Task 7: Selection FAB (content.css) to tokens

Content script seçim ikonu ve iframe'i token'lara taşı. FAB her zaman koyu okunur olmalı (sayfa üstünde).

**Files:**
- Modify: `src/styles/content.css`

**Interfaces:**
- Consumes: `tokens.css` DEĞİL — content.css sayfaya enjekte edilir ve token dosyası orada yüklü değildir. Bu yüzden FAB **kendi kendine yeten** sabit değerlerle kalır (tokensız), ama design system paletiyle uyumlu. (Manifest content_scripts yalnızca content.css yükler.)

- [ ] **Step 1: `src/styles/content.css` — FAB'ı rafine et, iframe'i sadeleştir**

Baştan yaz (palet spec ile uyumlu sabitler; enjekte bağlamda token yok):

```css
/* Seçim ikonu — sayfaya enjekte edilir, token bağımsız */
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

- [ ] **Step 2: Chrome'da doğrula**

Uzantıyı reload et. Bir sayfada 10+ kelime seç. Beklenen: turuncu çerçeveli, tek boyutlu ikon imlecin yanında belirir; hover'da hafif büyür (kayan parıltı yok); tıklayınca HUD açılır. Seçim kalkınca ikon kaybolur.

- [ ] **Step 3: Commit**

```bash
git add src/styles/content.css
git commit -m "feat(content): refine selection FAB to match design system"
```

---

### Task 8: Cleanup, version bump, docs

Son rötuşlar ve sürüm.

**Files:**
- Modify: `manifest.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: tüm önceki task'lar tamamlanmış olmalı.

- [ ] **Step 1: `manifest.json` — version bump**

`"version": "2.0.0"` → `"version": "3.0.0"`.

- [ ] **Step 2: `README.md` — sürüm geçmişi ve tema/ayarlar notu**

`## 📊 Version History` bölümünün başına ekle:

```markdown
- **v3.0** (Current)
  - Token tabanlı design system (koyu + otomatik açık tema)
  - Popup içi ayarlar: varsayılan hız, tema (Koyu/Açık/Sistem), ORP ve bağlam toggle'ları
  - HUD: ORP odak çizgisi, kalan süre göstergesi, rafine görünüm (parıltı/gradyan gürültüsü kaldırıldı)
  - Erişilebilirlik: WCAG AA kontrast, tutarlı focus halkası, reduced-motion
```

Ayrıca "Design Philosophy" bölümüne "Light & Dark: otomatik + manuel tema seçimi" satırını ekle.

- [ ] **Step 3: Tam regresyon doğrulaması**

Uzantıyı reload et, uçtan uca kontrol:
1. `node --test` → tüm birim testler PASS.
2. Popup: açık/koyu (sistem + manuel), ayarlar kalıcı, Başlat/Temizle çalışır.
3. Seçimle HUD: FAB → HUD koyu; okuma, hız, kalan süre, ORP/bağlam ayarları uygulanır.
4. Sağ tık menüsü (FRead) → HUD açılır (background.js akışı bozulmadı).
5. Console'da hata/404/CSP uyarısı YOK.
6. `grep -rn "667eea\|f7931e\|#ff6b35" src/` → yalnızca `tokens.css` (primitive tanımı) ve `content.css` (enjekte, tokensız) sonuç vermeli; başka yerde sabit kalmamalı.

- [ ] **Step 4: Commit**

```bash
git add manifest.json README.md
git commit -m "chore: bump to v3.0.0 and update docs"
```

---

## Self-Review Notları

- **Spec kapsamı:** Token mimarisi (Task 1) · saf mantık/tema çözümleme (Task 2) · komponentler (Task 3) · popup + ayarlar + tema seçimi (Task 4) · HUD always-dark restyle (Task 5) · HUD okuma UX/ORP/kalan süre (Task 6) · seçim FAB (Task 7) · erişilebilirlik (Task 1 base + tüm task doğrulamaları) · migrasyon/temizlik/sürüm (Task 8). Spec'in 12 bölümü de bir task'a bağlı.
- **Tip tutarlılığı:** `settings` nesnesi `{ defaultWpm, theme, orp, contextWords }` şekli Task 2/4/6'da aynı; `resolveTheme`/`applyTheme`, `splitWords`, `estimateRemainingMs`/`formatDuration`, `orpIndex` imzaları Task 2'de tanımlı ve tüketildikleri yerlerle uyumlu.
- **Erişim modeli:** popup uzantı sayfası (module import serbest); HUD web'e enjekte iframe → `hud.js` + `settings.js` + tüm css `web_accessible_resources`'ta (Task 5). content.css enjekte bağlamda token'sız (Task 7 notu).
- **Bilinçli kapsam dışı:** onboarding, tam yeniden tasarım, font kütüphanesi, kelime öbekleme (spec Bölüm 11).
