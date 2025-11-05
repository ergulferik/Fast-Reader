let fastReaderIcon = null;
let currentIframe = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_FREAD_HUD") {
    if (message.text && message.text.length >= 10) {
      startFastReader(message.text);
      sendResponse({ success: true });
    } else {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP_WINDOW" });
      sendResponse({ success: true });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_FAST_READER_FROM_POPUP") {
    const text = message.text;
    startFastReader(text);
    sendResponse({ success: true });
  }
});

document.addEventListener("selectionchange", () => {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText && fastReaderIcon) {
    fastReaderIcon.remove();
    fastReaderIcon = null;
  }
});

document.addEventListener("mouseup", (e) => {
  const selectedText = window.getSelection().toString().trim();
  const text = selectedText.split(/\s+/).filter((word) => word.length > 0);
  if (!selectedText) {
    if (fastReaderIcon) {
      fastReaderIcon.remove();
      fastReaderIcon = null;
    }
    return;
  } else {
    if (text.length < 10) {
      if (fastReaderIcon) {
        fastReaderIcon.remove();
        fastReaderIcon = null;
      }
      return;
    }
  }

  if (fastReaderIcon) {
    fastReaderIcon.remove();
    fastReaderIcon = null;
  }

  fastReaderIcon = document.createElement("div");
  fastReaderIcon.classList.add("fast-reader-icon");

  const iconImg = document.createElement("img");
  iconImg.src = chrome.runtime.getURL("assets/icons/icon.png");
  iconImg.alt = "Fast Reader";
  iconImg.style.width = "100%";
  iconImg.style.height = "100%";
  iconImg.style.objectFit = "contain";

  fastReaderIcon.appendChild(iconImg);
  fastReaderIcon.title = "Fast Reader - Click to read selected text";

  const iconSize = 36;
  const margin = 12;
  let left = e.pageX + margin;
  let top = e.pageY - margin;

  if (left + iconSize > window.innerWidth) {
    left = e.pageX - iconSize - margin;
  }

  if (top + iconSize > window.innerHeight) {
    top = e.pageY - iconSize - margin;
  }

  fastReaderIcon.style.left = `${left}px`;
  fastReaderIcon.style.top = `${top}px`;

  document.body.appendChild(fastReaderIcon);

  fastReaderIcon.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();

    removeFastReaderIcon();

    startFastReader(selectedText);
  });

  setTimeout(() => {
    removeFastReaderIcon();
  }, 4000);
});

function removeFastReaderIcon() {
  if (fastReaderIcon) {
    fastReaderIcon.remove();
    fastReaderIcon = null;
  }
}

function startFastReader(selectedText) {
  if (currentIframe) {
    currentIframe.remove();
  }

  removeFastReaderIcon();

  const hudUrl = chrome.runtime.getURL("src/hud/hud.html");
  const iframe = document.createElement("iframe");

  iframe.src = hudUrl;
  iframe.classList.add("fast-reader-iframe");
  iframe.setAttribute("allow", "fullscreen");

  document.body.appendChild(iframe);
  currentIframe = iframe;

  iframe.onload = () => {
    iframe.contentWindow.postMessage({ type: "INIT_FAST_READER", text: selectedText }, "*");
  };

  const messageHandler = (event) => {
    if (event.data.type === "CLOSE_FAST_READER") {
      iframe.remove();
      currentIframe = null;
      window.removeEventListener("message", messageHandler);
    }
  };

  window.addEventListener("message", messageHandler);
}
