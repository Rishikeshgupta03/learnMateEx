(() => {

  console.log("LearnMate loaded");

  let bubble = null;
  let popup = null;
  let selectedText = "";
  let timer = null;


  // -----------------------------
  // REMOVE ELEMENTS
  // -----------------------------

  function removeBubble() {
    if (bubble) {
      bubble.remove();
      bubble = null;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function removePopup() {
    if (popup) {
      popup.remove();
      popup = null;
    }
  }


  // -----------------------------
  // CREATE LEARNMATE POPUP
  // -----------------------------

  function createPopup(text) {
    removePopup();

    popup = document.createElement("div");
    popup.id = "learnmate-popup";

    popup.innerHTML = `
      <div class="lm-header">
        <div class="lm-logo">LM</div>
        <div>
          <div class="lm-title">LearnMate</div>
          <div class="lm-subtitle">Gemini AI Assistant</div>
        </div>
        <button id="lm-close">×</button>
      </div>

      <div class="lm-actions">
        <button data-action="summarize">✨ Summarize</button>
        <button data-action="explain">🧠 Explain Simply</button>
        <button data-action="grammar">✍️ Fix Grammar</button>
        <button data-action="deeper">📚 Learn Deeper</button>
        <button data-action="example">💡 Give Example</button>
        <button data-action="interview">🎯 Interview Mode</button>
        <button class="lm-full" data-action="rewrite">🔄 Rewrite Clearly</button>
      </div>

      <div class="lm-custom">
        <div class="lm-label">SAVED PROMPTS</div>
        <div id="lm-custom-list">Loading...</div>
      </div>

      <div class="lm-result">
        <div class="lm-result-header">
          <span>RESULT</span>
          <div>
            <button id="lm-copy">Copy</button>
            <button id="lm-listen">Listen</button>
          </div>
        </div>
        <div id="lm-result-text">Choose an action above.</div>
      </div>
    `;

    document.body.appendChild(popup);

    // -----------------------------
    // POSITION
    // -----------------------------
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 12;
    let left = rect.left + window.scrollX;
    const popupWidth = 380;

    if (left + popupWidth > window.scrollX + window.innerWidth) {
      left = window.scrollX + window.innerWidth - popupWidth - 15;
    }

    if (left < 10) {
      left = 10;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    setupPopupEvents();
    loadCustomPrompts();
  }


  // -----------------------------
  // POPUP EVENTS
  // -----------------------------

  function setupPopupEvents() {
    document.getElementById("lm-close").onclick = (e) => {
      e.stopPropagation();
      removePopup();
    };

    document.querySelectorAll("#learnmate-popup [data-action]").forEach(button => {
      button.onclick = (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        askGemini(action, null);
      };
    });

    document.getElementById("lm-copy").onclick = async (e) => {
      e.stopPropagation();
      const result = document.getElementById("lm-result-text").innerText;
      await navigator.clipboard.writeText(result);
    };

    document.getElementById("lm-listen").onclick = (e) => {
      e.stopPropagation();
      const result = document.getElementById("lm-result-text").innerText;
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(result));
    };
  }


  // -----------------------------
  // LOAD CUSTOM PROMPTS
  // -----------------------------

  async function loadCustomPrompts() {
    const list = document.getElementById("lm-custom-list");
    try {
      const settings = await chrome.storage.local.get({ customPrompts: [] });
      const prompts = settings.customPrompts;

      if (!prompts.length) {
        list.innerHTML = `<div class="lm-empty">No saved prompts yet.</div>`;
        return;
      }

      list.innerHTML = "";

      prompts.forEach(prompt => {
        const button = document.createElement("button");
        button.className = "lm-custom-button";
        button.innerText = "⚡ " + prompt.name;

        button.onclick = (e) => {
          e.stopPropagation();
          askGemini(null, prompt.prompt);
        };

        list.appendChild(button);
      });
    } catch (error) {
      console.error("LearnMate prompt error:", error);
    }
  }


  // -----------------------------
  // GEMINI REQUEST
  // -----------------------------

  async function askGemini(action, customPrompt) {
    const result = document.getElementById("lm-result-text");
    result.className = "lm-loading";
    result.innerText = "Gemini is thinking...";

    try {
      const settings = await chrome.storage.local.get({ backendUrl: "http://localhost:8787" });
      const response = await fetch(settings.backendUrl + "/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          customPrompt: customPrompt,
          text: selectedText,
          pageTitle: document.title,
          pageUrl: window.location.href
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gemini request failed");

      result.className = "";

result.innerHTML = data.result ? parseMarkdown(data.result) : "No result returned.";

    } catch (error) {
      console.error("LearnMate Gemini error:", error);
      result.className = "lm-error";
      result.innerText = "Unable to connect to Gemini.\n\n" + error.message;
    }
  }


  // -----------------------------
  // SELECTION BUBBLE & GLOBAL CLICKS
  // -----------------------------

  function showBubble(text) {
    removeBubble();
    selectedText = text;

    bubble = document.createElement("button");
    bubble.id = "learnmate-selection-bubble";
    bubble.innerHTML = "✨ Use LearnMate";
    document.body.appendChild(bubble);

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      removeBubble();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    bubble.style.top = `${rect.bottom + window.scrollY + 8}px`;
    bubble.style.left = `${Math.max(8, Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - 160))}px`;

    
    bubble.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation(); 
      createPopup(selectedText);
      removeBubble();
    };
  }

  document.addEventListener("mousedown", (event) => {
   
    if (bubble && bubble.contains(event.target)) {
      return;
    }

    
    if (popup && popup.contains(event.target)) {
      return;
    }

    
    removeBubble();
    removePopup();
  });

  
  document.addEventListener("mouseup", (event) => {
   
    if ((popup && popup.contains(event.target)) || (bubble && bubble.contains(event.target))) {
      return;
    }

    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";

    if (text.length > 0) {
      showBubble(text);
    }
  });

})();


  // -----------------------------
  // MARKDOWN TO HTML PARSER
  // -----------------------------
  function parseMarkdown(text) {
    if (!text) return "";

    let html = text;

     
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

     
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

     
    html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, "<li>$1</li>");
    
     
    if (html.includes("<li>")) {
     
    }

     
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

     
    html = html.replace(/\n/g, "<br>");

    return html;
  }
