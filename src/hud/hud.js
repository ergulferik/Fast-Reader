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
