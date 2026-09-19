// DOM Elements
const en = document.getElementById("enabled");
const list = document.getElementById("list");
const ed = document.getElementById("editor");
const nameInput = document.getElementById("name"); // 'name' ki jagah descriptive naam diya
const promptInput = document.getElementById("prompt"); // 'prompt' ki jagah descriptive naam diya

let edit = null;

// Load initial data from Chrome Storage
async function load() {
    let s = await chrome.storage.local.get({ enabled: true, customPrompts: [] });
    en.checked = s.enabled;
    render(s.customPrompts);
}

// Render the list of custom prompts
function render(ps) {
    list.innerHTML = ps.length
        ? ps.map(p => `
            <div class="item">
                <b>${safe(p.name)}</b>
                <small>${safe(p.prompt).slice(0, 80)}</small>
                <button data-del="${p.id}">Delete</button>
                <button data-edit="${p.id}">Edit</button>
            </div>
          `).join("")
        : "<small>No custom prompts yet.</small>";

    // Attach click events to buttons
    list.querySelectorAll("[data-del]").forEach(b => b.onclick = () => del(b.dataset.del));
    list.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editPrompt(b.dataset.edit));
}

// HTML Escape to prevent XSS (Security check)
function safe(s) {
    return s.replace(/[&<>"]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    }[c]));
}

// Toggle enable/disable status
en.onchange = () => chrome.storage.local.set({ enabled: en.checked });

// Open Editor to Add New Prompt
document.getElementById("add").onclick = () => {
    edit = null;
    nameInput.value = "";
    promptInput.value = "";
    ed.classList.remove("hidden");
};

// Cancel and Close Editor
document.getElementById("cancel").onclick = () => ed.classList.add("hidden");

// Save or Update Prompt
document.getElementById("save").onclick = async () => {
    if (!nameInput.value.trim() || !promptInput.value.trim()) return;

    let s = await chrome.storage.local.get({ customPrompts: [] });
    let a = s.customPrompts;

    if (edit) {
        // Edit existing prompt
        a = a.map(p => p.id === edit ? { ...p, name: nameInput.value.trim(), prompt: promptInput.value.trim() } : p);
    } else {
        // Add new prompt
        a.push({
            id: crypto.randomUUID(),
            name: nameInput.value.trim(),
            prompt: promptInput.value.trim()
        });
    }

    await chrome.storage.local.set({ customPrompts: a });
    ed.classList.add("hidden");
    render(a);
};

// Delete Prompt
async function del(id) {
    let s = await chrome.storage.local.get({ customPrompts: [] });
    let a = s.customPrompts.filter(p => p.id !== id);
    await chrome.storage.local.set({ customPrompts: a });
    render(a);
}

// Populate Editor for Editing
async function editPrompt(id) {
    let s = await chrome.storage.local.get({ customPrompts: [] });
    let p = s.customPrompts.find(x => x.id === id);
    
    edit = id;
    nameInput.value = p.name;
    promptInput.value = p.prompt;
    ed.classList.remove("hidden");
}

// Initialize Application
load();
