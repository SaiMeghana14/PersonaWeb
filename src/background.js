// background.js - Manifest V3 service worker
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for quick actions
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

// Context menu handling
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !info.selectionText) return;
  const action = info.menuItemId;
  chrome.tabs.sendMessage(tab.id, { type: "CONTEXT_ACTION", action, text: info.selectionText });
});

// Simple message handlers
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "OPEN_SIDEBAR") {
    const tabId = sender.tab?.id;
    if (tabId) {
      // Ask content script to mount sidebar (content script handles injection)
      chrome.tabs.sendMessage(tabId, { type: "MOUNT_SIDEBAR", payload: msg.payload });
    }
  }
  // Important: return true if async; not used now.
});
