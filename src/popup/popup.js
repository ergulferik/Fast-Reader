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
    await startInTab(tab, text);
    setTimeout(() => window.close(), 300);
  } catch (err) {
    console.error(err);
    showError(startErrorMessage(err));
    els.startBtn.disabled = false;
  }
});

// Send the text to the tab's content script. If it isn't there yet — the page was
// open before the extension was installed/updated, so the manifest content script
// never ran — inject it on demand and retry.
async function startInTab(tab, text) {
  const msg = { type: "START_FAST_READER_FROM_POPUP", text };
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["src/styles/content.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/content.js"] });
    await chrome.tabs.sendMessage(tab.id, msg);
  }
}

function startErrorMessage(err) {
  const m = (err && err.message) || "";
  if (/chrome:\/\/|cannot access|extension gallery|chrome web store/i.test(m)) {
    return "Bu sayfada çalışmıyor. Normal bir web sitesinde deneyin.";
  }
  return "Fast Reader başlatılamadı — sayfayı yenileyip tekrar deneyin.";
}

function showError(message) {
  const div = document.createElement("div");
  div.className = "error-notification"; div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
