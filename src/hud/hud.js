let words = [];
let index = 0;
let interval = null;
let wordsPerMinute = 250;
let paused = false;
let isReading = false;

const elements = {
  speed: document.getElementById("speed"),
  speedValue: document.getElementById("speedValue"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  closeBtn: document.getElementById("closeBtn"),
  currentWord: document.getElementById("currentWord"),
  prevWord: document.getElementById("prevWord"),
  nextWord: document.getElementById("nextWord"),
  readPart: document.getElementById("readPart"),
  unreadPart: document.getElementById("unreadPart"),
  wordCount: document.getElementById("wordCount"),
  progress: document.getElementById("progress"),
};

window.addEventListener("message", (event) => {
  if (event.data.type === "INIT_FAST_READER") {
    const text = event.data.text;
    words = text.split(/\s+/).filter((word) => word.length > 0);
    index = 0;
    updateWordCount();
    updateProgress();
    updateTextPreview();
    elements.currentWord.textContent = "Ready to start...";
    elements.prevWord.textContent = "";
    elements.nextWord.textContent = "";
  }
});

elements.speed.addEventListener("input", (e) => {
  wordsPerMinute = Number(e.target.value);
  elements.speedValue.textContent = wordsPerMinute;

  if (isReading && !paused) {
    clearInterval(interval);
    startReading();
  }
});

elements.startBtn.addEventListener("click", () => {
  if (!words.length) return;

  isReading = true;
  paused = false;
  elements.startBtn.disabled = true;
  elements.pauseBtn.disabled = false;
  elements.pauseBtn.textContent = "Pause";

  startReading();
});

elements.pauseBtn.addEventListener("click", () => {
  if (paused) {
    paused = false;
    elements.pauseBtn.textContent = "Pause";
    startReading();
  } else {
    paused = true;
    elements.pauseBtn.textContent = "Resume";
    clearInterval(interval);
  }
});

elements.resetBtn.addEventListener("click", () => {
  resetReader();
});

elements.closeBtn.addEventListener("click", () => {
  clearInterval(interval);
  window.parent.postMessage({ type: "CLOSE_FAST_READER" }, "*");
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (isReading) {
      elements.pauseBtn.click();
    } else {
      elements.startBtn.click();
    }
  } else if (e.key === "r" || e.key === "R") {
    resetReader();
  } else if (e.code === "Escape") {
    e.preventDefault();
    elements.closeBtn.click();
  }
});

function startReading() {
  clearInterval(interval);

  const speedInMs = (60 * 1000) / wordsPerMinute;

  interval = setInterval(() => {
    if (paused) return;

    if (index >= words.length) {
      clearInterval(interval);
      isReading = false;
      elements.startBtn.disabled = false;
      elements.pauseBtn.disabled = true;
      elements.pauseBtn.textContent = "Pause";
      elements.readPart.textContent += " " + elements.currentWord.textContent;
      elements.currentWord.textContent = "Reading completed!";
      elements.prevWord.textContent = "";
      return;
    }

    showWord(words[index]);
    index++;
    updateWordCount();
    updateProgress();
  }, speedInMs);
}

function showWord(word) {
  const formattedWord = formatWordWithCenterHighlight(word);
  elements.currentWord.innerHTML = formattedWord;

  const isCurrentWordLong = word.length > 12;
  const prevWord = index > 0 ? words[index - 1] : "";
  const nextWord = index < words.length - 1 ? words[index + 1] : "";

  if (isCurrentWordLong) {
    elements.prevWord.textContent = "";
    elements.nextWord.textContent = "";
    elements.currentWord.classList.add("long-word");
    elements.prevWord.classList.remove("long-word");
    elements.nextWord.classList.remove("long-word");
  } else {
    elements.prevWord.textContent = prevWord;
    elements.nextWord.textContent = nextWord;
    elements.currentWord.classList.remove("long-word");

    elements.prevWord.classList.toggle("long-word", prevWord.length > 12);
    elements.nextWord.classList.toggle("long-word", nextWord.length > 12);
  }

  updateTextPreview();
}

function formatWordWithCenterHighlight(word) {
  if (!word || word.length === 0) return word;

  const length = word.length;

  if (length === 1) {
    return `<span class="center-char">${word}</span>`;
  } else if (length % 2 === 0) {
    const mid1 = length / 2 - 1;
    const mid2 = length / 2;
    return word
      .split("")
      .map((char, index) => {
        if (index === mid1 || index === mid2) {
          return `<span class="center-char">${char}</span>`;
        }
        return char;
      })
      .join("");
  } else {
    const mid = Math.floor(length / 2);
    return word
      .split("")
      .map((char, index) => {
        if (index === mid) {
          return `<span class="center-char">${char}</span>`;
        }
        return char;
      })
      .join("");
  }
}

function updateWordCount() {
  elements.wordCount.textContent = `${index} / ${words.length}`;
}

function updateProgress() {
  const percentage = words.length > 0 ? (index / words.length) * 100 : 0;
  elements.progress.style.width = `${percentage}%`;
}

function updateTextPreview() {
  if (words.length === 0) return;

  const readWords = words.slice(0, index);
  elements.readPart.textContent = readWords.join(" ");

  elements.readPart.scrollTo({
    top: readPart.scrollHeight,
    behavior: "smooth",
  });

  const unreadWords = words.slice(index + 1);
  elements.unreadPart.textContent = unreadWords.join(" ");
}

function resetReader() {
  clearInterval(interval);
  index = 0;
  isReading = false;
  paused = false;

  elements.startBtn.disabled = false;
  elements.pauseBtn.disabled = true;
  elements.pauseBtn.textContent = "Pause";

  updateWordCount();
  updateProgress();
  updateTextPreview();
  elements.currentWord.textContent = "Ready to start...";
  elements.currentWord.classList.remove("long-word");
  elements.prevWord.textContent = "";
  elements.nextWord.textContent = "";
  elements.prevWord.classList.remove("long-word");
  elements.nextWord.classList.remove("long-word");
}
