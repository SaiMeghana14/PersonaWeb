(() => {
  const FLOAT_ID = 'personaweb-float-btn';
  let floatBtn = null;
  let hideTimeout = null;

  function createFloatButton() {
    if (document.getElementById(FLOAT_ID)) return;
    floatBtn = document.createElement('button');
    floatBtn.id = FLOAT_ID;
    floatBtn.title = 'PersonaWeb';
    Object.assign(floatBtn.style, {
      position: 'absolute',
      zIndex: 2147483647,
      width: '46px',
      height: '46px',
      borderRadius: '23px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(15,23,42,0.12)',
      transition: 'transform .12s ease, opacity .12s ease, backdrop-filter .12s ease',
      background: '#ffffff',
      border: '1px solid rgba(15,23,42,0.06)',
      cursor: 'pointer',
      opacity: '0'
    });
    const img = document.createElement('img');
    img.style.width = '22px';
    img.style.height = '22px';
    img.alt = 'P';
    img.src = chrome.runtime.getURL('icons/icon-48.png');
    img.id = 'persona-icon';
    floatBtn.appendChild(img);
    document.body.appendChild(floatBtn);
    floatBtn.addEventListener('click', onFloatClick);
    floatBtn.addEventListener('mouseenter', () => floatBtn.style.transform = 'scale(1.03)');
    floatBtn.addEventListener('mouseleave', () => floatBtn.style.transform = 'scale(1)');
    // theme icon initial set
    chrome.storage.local.get(['dark'], (items) => setThemeIcon(Boolean(items.dark)));
  }

  function setThemeIcon(isDark) {
    const img = document.getElementById('persona-icon');
    if (!img) return;
    img.src = chrome.runtime.getURL('icons/icon-48.png');
  }

  function onFloatClick(e) {
    const selection = window.getSelection().toString();
    const rect = { x: e.clientX, y: e.clientY };
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR', payload: { selection, rect }});
  }

  function positionFloat(x, y) {
    if (!floatBtn) createFloatButton();
    const left = Math.min(Math.max(8, x + window.scrollX + 12), window.innerWidth - 60 + window.scrollX);
    const top = Math.min(Math.max(8, y + window.scrollY - 40), window.scrollY + window.innerHeight - 60);
    floatBtn.style.left = `${left}px`;
    floatBtn.style.top = `${top}px`;
    floatBtn.style.opacity = '1';
    floatBtn.style.transform = 'scale(1)';
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => { floatBtn.style.opacity = '0'; }, 6000);
  }

  // Show button when selection exists
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    const txt = sel?.toString?.().trim();
    if (!txt) {
      if (floatBtn) floatBtn.style.opacity = '0';
      return;
    }
    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      positionFloat(rect.right, rect.top);
    } catch (e) {
      positionFloat(window.innerWidth / 2 - 40, 100);
    }
  });

  // Listen for messages to mount the sidebar or run actions
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type === 'MOUNT_SIDEBAR') {
      mountSidebar(msg.payload);
    } else if (msg?.type === 'CONTEXT_ACTION') {
      mountSidebar({ selection: msg.text, autoAction: msg.action });
    } else if (msg?.type === 'THEME_UPDATED') {
      setThemeIcon(Boolean(msg.dark));
    }
  });

  // Remove sidebar trigger; also respond to top-level close
  window.addEventListener('message', (evt) => {
    if (evt.data?.type === 'PERSONAWEB_CLOSE') {
      const iframe = document.getElementById('personaweb-sidebar-iframe');
      if (iframe) iframe.remove();
    }
  });

  function mountSidebar({ selection = '', rect = null, autoAction = null } = {}) {
    if (document.getElementById('personaweb-sidebar-iframe')) {
      const iframe = document.getElementById('personaweb-sidebar-iframe');
      iframe.contentWindow.postMessage({ type: 'PERSONAWEB_INPUT', text: selection, autoAction }, '*');
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
      boxShadow: '-12px 0 40px rgba(10,10,10,0.12)',
      transition: 'transform .18s ease'
    });
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.postMessage({ type: 'PERSONAWEB_INPUT', text: selection, autoAction }, '*');
    };
  }

  createFloatButton();
})();
