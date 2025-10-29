(() => {
  const FLOAT_ID = 'personaweb-float-btn';
  let floatBtn = null;

  function createFloatButton() {
    if (document.getElementById(FLOAT_ID)) return;
    floatBtn = document.createElement('button');
    floatBtn.id = FLOAT_ID;
    floatBtn.title = 'PersonaWeb';
    floatBtn.style.position = 'absolute';
    floatBtn.style.zIndex = 2147483647;
    floatBtn.style.width = '44px';
    floatBtn.style.height = '44px';
    floatBtn.style.borderRadius = '22px';
    floatBtn.style.display = 'flex';
    floatBtn.style.alignItems = 'center';
    floatBtn.style.justifyContent = 'center';
    floatBtn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    floatBtn.style.background = '#ffffff';
    floatBtn.style.border = 'none';
    floatBtn.style.cursor = 'pointer';
    floatBtn.style.transition = 'transform .12s ease, opacity .12s ease';
    floatBtn.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon-48.png') + '" style="width:22px;height:22px;" alt="P">';
    document.body.appendChild(floatBtn);
    floatBtn.addEventListener('click', onFloatClick);
  }

  function removeFloatButton() {
    const el = document.getElementById(FLOAT_ID);
    if (el) el.remove();
  }

  function onFloatClick(e) {
    const selection = window.getSelection().toString();
    const rect = { x: e.clientX, y: e.clientY };
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { selection, rect }});
  }

  function positionFloat(x, y) {
    if (!floatBtn) createFloatButton();
    floatBtn.style.left = (x + window.scrollX + 8) + 'px';
    floatBtn.style.top = (y + window.scrollY + 8) + 'px';
    floatBtn.style.opacity = '1';
  }

  // Show button on text selection
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    const txt = sel?.toString?.().trim();
    if (!txt) {
      if (floatBtn) floatBtn.style.opacity = '0';
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    positionFloat(rect.right, rect.top);
  });

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'MOUNT_SIDEBAR') {
      // Inject sidebar if not already
      mountSidebar(msg.payload);
    } else if (msg?.type === 'CONTEXT_ACTION') {
      // e.g., perform quick action
      mountSidebar({ selection: msg.text, autoAction: msg.action });
    }
  });

  // Very small sidebar injection - uses web_accessible_resources
  function mountSidebar({ selection = '', rect = null, autoAction = null } = {}) {
    if (document.getElementById('personaweb-sidebar-root')) {
      // update selection in existing sidebar via postMessage
      const sidebarWindow = document.getElementById('personaweb-sidebar-iframe')?.contentWindow;
      if (sidebarWindow) sidebarWindow.postMessage({ type: 'PERSONAWEB_INPUT', text: selection, autoAction }, '*');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'personaweb-sidebar-iframe';
    iframe.src = chrome.runtime.getURL('src/sidebar.html');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      top: '0',
      height: '100vh',
      width: '420px',
      zIndex: 2147483646,
      border: 'none',
      boxShadow: '-12px 0 30px rgba(10,10,10,0.12)'
    });
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    document.body.appendChild(iframe);

    // Pass initial selection after iframe loads
    iframe.onload = () => {
      iframe.contentWindow.postMessage({ type: 'PERSONAWEB_INPUT', text: selection, autoAction }, '*');
    };
  }

  // Initialize float button
  createFloatButton();
})();
