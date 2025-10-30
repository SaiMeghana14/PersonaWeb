document.addEventListener('DOMContentLoaded', async () => {
  const popupMode = document.getElementById('popupMode');
  chrome.storage.local.get(['mode'], items => { if (items.mode) popupMode.value = items.mode; });
  popupMode.addEventListener('change', () => {
    chrome.storage.local.set({ mode: popupMode.value });
  });

  document.getElementById('openSidebar').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { selection: '' } });
    window.close();
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Open the sidebar for Persona settings and preferences.');
  });
});
