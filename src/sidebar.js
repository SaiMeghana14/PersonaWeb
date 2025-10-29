// src/sidebar.js (improved)
(() => {
  const selectedTextEl = document.getElementById('selectedText');
  const resultArea = document.getElementById('resultArea');
  const historyList = document.getElementById('historyList');
  const modeSelect = document.getElementById('modeSelect');
  const themeToggle = document.getElementById('themeToggle');
  const closeBtn = document.getElementById('closeBtn');
  const onboarding = document.getElementById('onboarding');
  const mainControls = document.getElementById('mainControls');
  const startBtn = document.getElementById('startBtn');
  const learnMore = document.getElementById('learnMore');
  const toneSelect = document.getElementById('toneSelect');
  const levelSelect = document.getElementById('levelSelect');

  async function init() {
    const dark = await storage.get('dark') || false;
    themeToggle.checked = dark;
    setDark(dark);

    const persona = await storage.get('persona') || { tone: 'Neutral', level: 'Intermediate' };
    toneSelect.value = persona.tone || 'Neutral';
    levelSelect.value = persona.level || 'Intermediate';
    modeSelect.value = (await storage.get('mode')) || 'learn';

    // Show onboarding only on first-run
    const seen = await storage.get('seenOnboarding');
    if (!seen) {
      onboarding.style.display = 'block';
      mainControls.style.display = 'none';
    } else {
      onboarding.style.display = 'none';
      mainControls.style.display = 'block';
    }
    refreshHistory();
  }

  // Theme
  const app = document.getElementById('app');
  function setDark(d) {
    app.classList.toggle('dark', d);
    storage.set('dark', d);
    chrome.runtime.sendMessage({ type: 'THEME_UPDATED', dark: d });
  }
  themeToggle.addEventListener('change', (e) => setDark(e.target.checked));

  // Onboarding actions
  startBtn.addEventListener('click', async () => {
    onboarding.style.display = 'none';
    mainControls.style.display = 'block';
    await storage.set('seenOnboarding', true);
    // populate demo text
    const demo = `Photosynthesis is the process by which plants convert light energy into chemical energy. It involves chlorophyll absorbing light and converting carbon dioxide and water into glucose and oxygen.`;
    selectedTextEl.value = demo;
    await performAction('summarize', demo);
  });
  learnMore.addEventListener('click', () => alert('PersonaWeb runs client-side AI (Gemini Nano etc.). Replace the ai_clients mock with built-in API calls when you have preview access.'));

  // Persona settings save
  toneSelect.addEventListener('change', () => savePersona());
  levelSelect.addEventListener('change', () => savePersona());
  modeSelect.addEventListener('change', () => storage.set('mode', modeSelect.value));

  async function savePersona() {
    const persona = { tone: toneSelect.value, level: levelSelect.value };
    await storage.set('persona', persona);
  }

  // History list
  async function refreshHistory() {
    const hist = await storage.get('history') || [];
    historyList.innerHTML = hist.slice().reverse().map(item => `<li><strong>${escapeHtml(item.type)}</strong><div style="font-size:12px;color:#8892a8">${new Date(item.t||Date.now()).toLocaleString()}</div><div style="margin-top:6px;font-size:13px">${escapeHtml((item.summary||'').slice(0,200))}</div></li>`).join('');
  }

  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const text = selectedTextEl.value.trim();
      if (!text) {
        showResult(`<em>Select some text on the page first or use demo.</em>`);
        return;
      }
      await performAction(action, text);
    });
  });

  window.addEventListener('message', (evt) => {
    const msg = evt.data;
    if (msg?.type === 'PERSONAWEB_INPUT') {
      selectedTextEl.value = msg.text || '';
      if (msg.autoAction) performAction(msg.autoAction, msg.text);
      // show main area
      onboarding.style.display = 'none';
      mainControls.style.display = 'block';
    }
  });

  closeBtn.addEventListener('click', () => {
    // remove iframe by sending a top-level message to the content script
    window.top.postMessage({ type: 'PERSONAWEB_CLOSE' }, '*');
  });

  function escapeHtml(s='') { return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function showResult(html) { resultArea.innerHTML = `<div class="result-content">${html}</div>`; }

  async function performAction(action, text) {
    showResult('<div>Processing…</div>');
    try {
      const persona = await storage.get('persona') || { tone: 'Neutral', level: 'Intermediate' };
      const mode = modeSelect.value || 'learn';
      let response;
      if (action === 'summarize') {
        response = await aiClients.summarize({ input: text, mode, persona });
      } else if (action === 'simplify') {
        response = await aiClients.rewrite({ input: text, instruction: 'Simplify for a beginner', persona });
      } else if (action === 'polish') {
        response = await aiClients.proofread({ input: text, target: 'professional' });
      } else if (action === 'translate') {
        const target = prompt('Translate to language (e.g., en, hi, es):', 'en') || 'en';
        response = await aiClients.translate({ input: text, targetLang: target });
      } else if (action === 'flashcard') {
        response = await aiClients.generateFlashcard({ input: text, persona });
      } else if (action === 'quiz') {
        response = await aiClients.generateQuiz({ input: text, persona });
      } else {
        response = { text: 'Action not implemented.' };
      }
      const html = (response?.cards || response?.text) ? (response.cards ? renderCards(response.cards) : `<pre>${escapeHtml(response.text)}</pre>`) : '<div>No result</div>';
      showResult(html);
      const hist = await storage.get('history') || [];
      hist.push({ type: action, input: text, summary: (response?.summary || (response?.text||'').slice(0,200)), t: Date.now() });
      await storage.set('history', hist);
      refreshHistory();
    } catch (err) {
      showResult(`<div style="color:#ff6b6b">Error: ${escapeHtml(err.message || err.toString())}</div>`);
    }
  }

  function renderCards(cards) {
    return cards.map(c => `<div style="padding:10px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02)"><strong>${escapeHtml(c.title||'Card')}</strong><div style="margin-top:6px">${escapeHtml(c.body||'')}</div></div>`).join('');
  }

  // Init on load
  init();
})();
