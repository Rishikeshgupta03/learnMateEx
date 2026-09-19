chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get([
    "enabled",
    "backendUrl",
    "customPrompts"
  ]);

  await chrome.storage.local.set({
    enabled: existing.enabled ?? true,
    backendUrl: existing.backendUrl ?? "https://learn-mate-ex.vercel.app",
    customPrompts: existing.customPrompts ?? []
  });

  console.log("LearnMate installed");
});


chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    if (message.type === "GET_SETTINGS") {

      chrome.storage.local
        .get({
          enabled: true,
          backendUrl: "https://learn-mate-ex.vercel.app",
          customPrompts: []
        })
        .then(sendResponse);

      return true;
    }

  }
);