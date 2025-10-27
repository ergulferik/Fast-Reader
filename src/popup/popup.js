// DOM Elements
const textInput = document.getElementById("textInput");
const startBtn = document.getElementById("startBtn");
const clearBtn = document.getElementById("clearBtn");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Load saved text if any
  loadSavedText();

  // Auto-focus textarea on load
  textInput.focus();
});

// Clear button handler
clearBtn.addEventListener("click", () => {
  textInput.value = "";
  textInput.focus();
  saveText();
});

// Start button handler
startBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();

  if (!text || text.length < 10) {
    showError("Please enter at least 10 characters");
    return;
  }

  // Send text to content script
  await sendTextToContentScript(text);
});

// Handle Enter key in textarea
textInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    startBtn.click();
  }
});

// Auto-save while typing
textInput.addEventListener("input", () => {
  saveText();
});

// Send text to content script
async function sendTextToContentScript(text) {
  try {
    startBtn.disabled = true;
    startBtn.classList.add("loading");

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, {
      type: "START_FAST_READER_FROM_POPUP",
      text: text,
    });

    // Close popup after sending
    setTimeout(() => {
      window.close();
    }, 300);
  } catch (error) {
    console.error("Error sending text to content script:", error);
    showError("Error starting Fast Reader");
    startBtn.disabled = false;
    startBtn.classList.remove("loading");
  }
}

// Save text to chrome.storage
function saveText() {
  const text = textInput.value;
  chrome.storage.local.set({ popupTextInput: text });
}

// Load saved text from chrome.storage
async function loadSavedText() {
  try {
    const result = await chrome.storage.local.get(["popupTextInput"]);
    if (result.popupTextInput) {
      textInput.value = result.popupTextInput;
    }
  } catch (error) {
    console.error("Error loading saved text:", error);
  }
}

// Show error message
function showError(message) {
  // Create error notification
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-notification";
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 71, 87, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.style.animation = "slideUp 0.3s ease";
    setTimeout(() => errorDiv.remove(), 300);
  }, 3000);
}

// Add animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(-20px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

