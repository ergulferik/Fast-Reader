let words = [];
let index = 0;
let interval = null;
let wordsPerMinute = 250;
let paused = false;
let isReading = false;

// DOM elementleri
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
  progress: document.getElementById("progress")
};

// Mesaj dinleyicisi - seçilen metni al
window.addEventListener("message", (event) => {
  if (event.data.type === "INIT_FAST_READER") {
    const text = event.data.text;
    console.log('Processing text:', text);
    words = text.split(/\s+/).filter(word => word.length > 0);
    console.log('Words array:', words);
    index = 0;
    updateWordCount();
    updateProgress();
    updateTextPreview();
    elements.currentWord.textContent = "Ready to start...";
    elements.prevWord.textContent = "";
    elements.nextWord.textContent = "";
  }
});

// Hız ayarı
elements.speed.addEventListener("input", (e) => {
  wordsPerMinute = Number(e.target.value);
  elements.speedValue.textContent = wordsPerMinute;
  
  // Eğer okuma devam ediyorsa, yeni hızla devam et
  if (isReading && !paused) {
    clearInterval(interval);
    startReading();
  }
});

// Başlat butonu
elements.startBtn.addEventListener("click", () => {
  if (!words.length) return;
  
  isReading = true;
  paused = false;
  elements.startBtn.disabled = true;
  elements.pauseBtn.disabled = false;
  elements.pauseBtn.textContent = "Pause";
  
  startReading();
});

// Duraklat/Devam butonu
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

// Sıfırla butonu
elements.resetBtn.addEventListener("click", () => {
  resetReader();
});

// Kapat butonu
elements.closeBtn.addEventListener("click", () => {
  clearInterval(interval);
  window.parent.postMessage({ type: "CLOSE_FAST_READER" }, "*");
});

// Klavye kısayolları
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (isReading) {
      elements.pauseBtn.click();
    } else {
      elements.startBtn.click();
    }
  } else if(e.key === "r" || e.key === "R"){
    resetReader()
  }else if (e.code === "Escape") {
    e.preventDefault();
    elements.closeBtn.click();
  }
});

function startReading() {
  clearInterval(interval);
  
  // Kelime/dakika'yı milisaniye'ye çevir
  const speedInMs = (60 * 1000) / wordsPerMinute;
  
  interval = setInterval(() => {
    if (paused) return;
    
    if (index >= words.length) {
      // Okuma tamamlandı
      clearInterval(interval);
      isReading = false;
      elements.startBtn.disabled = false;
      elements.pauseBtn.disabled = true;
      elements.pauseBtn.textContent = "Pause";
      elements.readPart.textContent +=  " " + elements.currentWord.textContent;
      elements.currentWord.textContent = "Reading completed!";
      elements.prevWord.textContent = "";
      return;
    }
    
    // Kelimeyi göster
    showWord(words[index]);
    index++;
    updateWordCount();
    updateProgress();
  }, speedInMs);
}

function showWord(word) {
  // Kelimeyi ortadaki karakteri turuncu olacak şekilde formatla
  const formattedWord = formatWordWithCenterHighlight(word);
  elements.currentWord.innerHTML = formattedWord;
  
  // Uzun kelime kontrolü
  const isCurrentWordLong = word.length > 12;
  const prevWord = index > 0 ? words[index - 1] : "";
  const nextWord = index < words.length - 1 ? words[index + 1] : "";
  
  // Eğer current word uzunsa, prev ve next word'leri gösterme
  if (isCurrentWordLong) {
    elements.prevWord.textContent = "";
    elements.nextWord.textContent = "";
    elements.currentWord.classList.add('long-word');
    elements.prevWord.classList.remove('long-word');
    elements.nextWord.classList.remove('long-word');
  } else {
    // Normal kelimeler için prev ve next word'leri göster
    elements.prevWord.textContent = prevWord;
    elements.nextWord.textContent = nextWord;
    elements.currentWord.classList.remove('long-word');
    
    // Prev ve next word'lerin uzunluk kontrolü
    elements.prevWord.classList.toggle('long-word', prevWord.length > 12);
    elements.nextWord.classList.toggle('long-word', nextWord.length > 12);
  }
  
  // Metin önizlemesini güncelle
  updateTextPreview();
  
}

function formatWordWithCenterHighlight(word) {
  if (!word || word.length === 0) return word;
  
  const length = word.length;
  
  if (length === 1) {
    // Tek karakter ise, o karakteri turuncu yap
    return `<span class="center-char">${word}</span>`;
  } else if (length % 2 === 0) {
    // Çift sayıda karakter ise, ortadaki iki karakteri turuncu yap
    const mid1 = length / 2 - 1;
    const mid2 = length / 2;
    return word.split('').map((char, index) => {
      if (index === mid1 || index === mid2) {
        return `<span class="center-char">${char}</span>`;
      }
      return char;
    }).join('');
  } else {
    // Tek sayıda karakter ise, ortadaki karakteri turuncu yap
    const mid = Math.floor(length / 2);
    return word.split('').map((char, index) => {
      if (index === mid) {
        return `<span class="center-char">${char}</span>`;
      }
      return char;
    }).join('');
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
  
  // Okunan kısmı oluştur
  const readWords = words.slice(0, index);
  elements.readPart.textContent = readWords.join(" ");

  elements.readPart.scrollTo({
    top: readPart.scrollHeight,
    behavior: "smooth"
  });
  
  // Okunmayan kısmı oluştur
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
  elements.currentWord.classList.remove('long-word');
  elements.prevWord.textContent = "";
  elements.nextWord.textContent = "";
  elements.prevWord.classList.remove('long-word');
  elements.nextWord.classList.remove('long-word');
}
