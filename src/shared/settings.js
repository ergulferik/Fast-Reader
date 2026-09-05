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
