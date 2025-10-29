(() => {
  // Wait for ai_clients & storage to be available (they are loaded via script tags)
  const selectedTextEl = document.getElementById('selectedText');
  const resultArea = document.getElementById('resultArea');
  const historyList = document.getElementById('historyList');
  const modeSelect = document.getElementById('modeSelect');
  const themeToggle = document.getElementById('themeToggle');
  const closeBtn = document.getElementById('closeBtn');

  // Setup theme switching
  const app = document.getElementById('app');
  function setDark(d) {
    app.classList.toggle('dark', d);
    storage.set('dark', d);
  }
  themeToggle.addEventListener('change', (e) => setDark(e.target.checked));
  storage.get('dark').then(v => { themeToggle.checked = !!v; setDark(!!v); });

  // Load history
  async function refreshHistory() {
    const hist = await storage.get('history') || [];
    historyList.innerHTML = hist.slice().reverse().map(item => `<li>${escapeHtml(item.summary || item.action || item.type)} <div style="font-size:11px;color:#8892a8">${new Date(item.t||Date.now()).toLocaleString()}</div></li>`).join('');
  }
  refreshHistory();

  // Listen to actions
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const text = selectedTextEl.value.trim();
      if (!text) {
        showResult(`<em>Select some text on the page first.</em>`);
        return;
      }
      await performAction(action, text);
    });
  });

  // Message bridge from parent page (content script)
  window.addEventListener('message', (evt) => {
    const msg = evt.data;
    if (msg?.type === 'PERSONAWEB_INPUT') {
      selectedTextEl.value = msg.text || '';
      // If autoAction provided, trigger it
      if (msg.autoAction) performAction(normalizeAction(msg.autoAction), msg.text);
    }
  });

  // Close button
  closeBtn.addEventListener('click', () => window.top.postMessage({ type: 'PERSONAWEB_CLOSE' }, '*'));

  // Helper
  function escapeHtml(s='') {
    return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function showResult(html) {
    resultArea.innerHTML = `<div class="result-content">${html}</div>`;
  }

  function normalizeAction(action) {
    if (action === 'persona-summarize') return 'summarize';
    if (action === 'persona-polish') return 'polish';
    return action;
  }

  // Core: performAction => calls ai_clients wrapper
  async function performAction(action, text) {
    showResult('<div>Processing…</div>');
    try {
      let response = null;
      const mode = modeSelect.value || 'learn';
      // Compose a persona or prompt template
      const persona = await storage.get('persona') || { tone: 'neutral', level: 'intermediate' };

      if (action === 'summarize') {
        // Use Summarizer API wrapper
        response = await aiClients.summarize({ input: text, mode, persona });
      } else if (action === 'simplify') {
        response = await aiClients.rewrite({ input: text, instruction: 'Simplify this for a beginner', persona });
      } else if (action === 'polish') {
        response = await aiClients.proofread({ input: text, target: 'professional' });
      } else if (action === 'translate') {
        // for demo prompt language selection - show modal prompt (simplified here)
        const target = prompt('Translate to language (e.g., en, hi, es):', 'en') || 'en';
        response = await aiClients.translate({ input: text, targetLang: target });
      } else if (action === 'flashcard') {
        response = await aiClients.generateFlashcard({ input: text, mode, persona });
      } else if (action === 'quiz') {
        response = await aiClients.generateQuiz({ input: text, mode, persona });
      } else {
        response = { text: 'Action not implemented.' };
      }

      // Display result
      const html = (response?.cards || response?.text) ? (response.cards ? renderCards(response.cards) : `<pre>${escapeHtml(response.text)}</pre>`) : '<div>No result</div>';
      showResult(html);

      // Save to history
      const hist = await storage.get('history') || [];
      hist.push({ type: action, input: text, summary: (response?.summary || response?.text?.slice?.(0,200)), t: Date.now() });
      await storage.set('history', hist);
      refreshHistory();
    } catch (err) {
      console.error(err);
      showResult(`<div style="color:#ff6b6b">Error: ${escapeHtml(err.message || err.toString())}</div>`);
    }
  }

  function renderCards(cards) {
    return cards.map(c => `<div style="padding:10px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02)">${escapeHtml(c.title||'Card')}<div style="margin-top:6px">${escapeHtml(c.body||'')}</div></div>`).join('');
  }
})();
