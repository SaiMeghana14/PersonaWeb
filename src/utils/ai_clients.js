// Hybrid AI client: prefer on-device APIs when available, fall back to CLOUD endpoint.
// The file exposes async functions: summarize, rewrite, proofread, translate, generateFlashcard, generateQuiz

const aiClients = (() => {
  // ---- CONFIG: replace with your cloud fallback endpoint if you use cloud ----
  // This endpoint should accept JSON POST: { task: 'summarize', input: '...', persona: {...}, options: {...} }
  // and return JSON: { text: "...", summary: "...", cards: [...] }
  const CLOUD_FALLBACK_URL = "https://your-cloud-fallback.example.com/api/ai"; // <-- TODO: replace

  // Utility: use on-device API if supported
  function hasOnDeviceSummarizer() {
    try {
      return !!(window.ai && ai.summarizer);
    } catch (e) { return false; }
  }

  // Utility: call cloud fallback
  async function cloudCall(task, payload) {
    // IMPORTANT: implement proper auth in production. This is a placeholder.
    try {
      const resp = await fetch(CLOUD_FALLBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" /* , "Authorization": "Bearer <TOKEN>" */ },
        body: JSON.stringify({ task, payload })
      });
      if (!resp.ok) throw new Error(`Cloud fallback failed: ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error("cloudCall error:", err);
      throw err;
    }
  }

  // On-device summarizer wrapper (if available)
  async function onDeviceSummarize({ input, options = {} } = {}) {
    // Example of using hypothetical on-device API shape (check Canary docs / Early Preview)
    // This code attempts multiple likely patterns; adjust to match the official interface when available.
    try {
      if (window.ai && ai.summarizer && typeof ai.summarizer.create === 'function') {
        const summ = await ai.summarizer.create({ type: 'key-points', ...options });
        const out = await summ.summarize(input);
        if (out?.result) return { text: out.result, summary: out.result };
        if (typeof out === 'string') return { text: out, summary: out };
      }
      // Newer APIs might be: navigator.onDeviceModel.summarize(...)
      if (navigator.onDeviceModel && navigator.onDeviceModel.summarize) {
        const out = await navigator.onDeviceModel.summarize({ input, ...options });
        return { text: out.text || out.result, summary: out.summary || out.text || out.result };
      }
    } catch (e) {
      console.warn("onDeviceSummarize failed:", e);
    }
    throw new Error("onDeviceSummarize not available");
  }

  async function summarize({ input, mode = 'learn', persona = {} } = {}) {
    // Attempt on-device first
    if (hasOnDeviceSummarizer()) {
      try {
        const out = await onDeviceSummarize({ input, options: { mode, persona } });
        return { text: out.text || out.summary, summary: out.summary || out.text };
      } catch (e) {
        // fallback to cloud
      }
    }

    // fallback to cloud
    return await cloudCall('summarize', { input, mode, persona });
  }

  // Rewriter
  async function rewrite({ input, instruction = 'Rewrite more clearly', persona = {} } = {}) {
    // On-device attempt
    try {
      if (window.ai && ai.rewriter && typeof ai.rewriter.create === 'function') {
        const r = await ai.rewriter.create({ instruction, persona });
        const out = await r.rewrite(input);
        return { text: out?.result || out };
      }
      // generic prompt api idea
      if (window.ai && ai.prompt && ai.prompt.create) {
        const prompt = `Instruction: ${instruction}\n\nText:\n${input}`;
        const res = await ai.prompt.create({ prompt });
        return { text: res.output_text || (res?.choices?.[0]?.text) };
      }
    } catch (e) {
      console.warn("onDevice rewrite failed:", e);
    }
    // cloud fallback
    return await cloudCall('rewrite', { input, instruction, persona });
  }

  // Proofreader
  async function proofread({ input, target = 'professional' } = {}) {
    try {
      if (window.ai && ai.proofreader && ai.proofreader.create) {
        const pf = await ai.proofreader.create({ style: target });
        const out = await pf.proofread(input);
        return { text: out?.result || out };
      }
    } catch (e) {
      console.warn("onDevice proofread failed:", e);
    }
    return await cloudCall('proofread', { input, target });
  }

  // Translator
  async function translate({ input, targetLang = 'en' } = {}) {
    try {
      if (window.ai && ai.translator && ai.translator.create) {
        const t = await ai.translator.create({ targetLanguage: targetLang });
        const out = await t.translate(input);
        return { text: out?.result || out };
      }
    } catch (e) {
      console.warn("onDevice translate failed:", e);
    }
    return await cloudCall('translate', { input, targetLang });
  }

  // Flashcard generation (structured)
  async function generateFlashcard({ input, persona = {} } = {}) {
    // Prefer structured writer on-device
    try {
      if (window.ai && ai.writer && ai.writer.create) {
        const w = await ai.writer.create({ mode: 'flashcard' });
        const out = await w.generate({ text: input, persona });
        // Try to respect structured output
        if (out?.cards) return { cards: out.cards };
        if (out?.result) return { cards: [{ title: 'Flashcard', body: out.result }] };
        if (typeof out === 'string') return { cards: [{ title: 'Flashcard', body: out }] };
      }
    } catch (e) {
      console.warn("onDevice flashcard failed:", e);
    }
    // Cloud fallback
    return await cloudCall('flashcard', { input, persona });
  }

  // Quiz generation (structured)
  async function generateQuiz({ input, persona = {} } = {}) {
    try {
      if (window.ai && ai.writer && ai.writer.create) {
        const w = await ai.writer.create({ mode: 'quiz' });
        const out = await w.generate({ text: input, persona });
        if (out?.cards) return { cards: out.cards };
        if (out?.result) return { cards: [{ title: 'Quiz', body: out.result }] };
      }
    } catch (e) {
      console.warn("onDevice quiz failed:", e);
    }
    return await cloudCall('quiz', { input, persona });
  }

  // Public API
  return {
    summarize,
    rewrite,
    proofread,
    translate,
    generateFlashcard,
    generateQuiz
  };
})();
