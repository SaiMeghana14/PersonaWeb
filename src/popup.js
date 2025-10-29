document.addEventListener('DOMContentLoaded', async () => {
  const popupMode = document.getElementById('popupMode');
  const storedMode = await new Promise(res => chrome.storage.local.get(['mode'], items => res(items.mode)));
  if (storedMode) popupMode.value = storedMode;
  popupMode.addEventListener('change', () => {
    chrome.storage.local.set({ mode: popupMode.value });
  });
});

document.getElementById('openSidebar').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { selection: '' } });
  window.close();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  alert('Preferences available in the sidebar. Open sidebar and configure Persona settings.');
});
