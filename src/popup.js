document.getElementById('openSidebar').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { selection: '' } });
  window.close();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  alert('Preferences not yet implemented in popup. Use sidebar preferences (coming soon).');
});
