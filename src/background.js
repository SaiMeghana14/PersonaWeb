chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for quick actions (selection context)
  chrome.contextMenus.create({
    id: "persona-summarize",
    title: "PersonaWeb: Summarize selection",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "persona-polish",
    title: "PersonaWeb: Polish selection",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !info.selectionText) return;
  const action = info.menuItemId;
  chrome.tabs.sendMessage(tab.id, { type: "CONTEXT_ACTION", action, text: info.selectionText });
});

// Listen for messages from popup or content
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "OPEN_SIDEBAR") {
    const tabId = sender.tab?.id || (sender?.id ? sender.id : null);
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: "MOUNT_SIDEBAR", payload: msg.payload });
    } else {
      // broadcast to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: "MOUNT_SIDEBAR", payload: msg.payload });
      });
    }
  } else if (msg?.type === 'THEME_UPDATED') {
    // For future: sync preferences across extension parts
  }
});
