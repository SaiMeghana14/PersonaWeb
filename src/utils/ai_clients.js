// NOTE: Replace the mock implementations with Chrome Built-in AI API calls when available.
// For now they provide deterministic demo behavior and show the prompt templates.

const aiClients = (() => {

  // Simple local mock summarizer (for UI testing offline)
  async function summarize({ input, mode = 'learn', persona = {} } = {}) {
    // TODO: Replace this block with a real Summarizer API call to Gemini Nano.
    // Example pseudocode:
    // return await chrome.ai.summarize({ model: 'gemini-nano', input, options: {...} });

    // Mock behavior: take first 2 sentences
    const truncated = input.split(/[.?!]\s/).slice(0, 2).join('. ') + (input.includes('.') ? '.' : '');
    return { text: truncated, summary: truncated };
  }

  async function rewrite({ input, instruction = 'Make it simpler', persona = {} } = {}) {
    // TODO: Use Rewriter API or Prompt API
    return { text: `[Rewritten (${instruction})]\n\n${input}` };
  }

  async function proofread({ input, target = 'professional' } = {}) {
    // TODO: Replace with Proofreader API
    // Example: chrome.ai.proofread({ input, style: target })
    return { text: `[Polished to ${target} tone]\n\n${input}` };
  }

  async function translate({ input, targetLang = 'en' } = {}) {
    // TODO: replace with Translator API call
    return { text: `[Translated to ${targetLang}]\n\n${input}` };
  }

  async function generateFlashcard({ input } = {}) {
    // TODO: Use Prompt/Writer API to create Q/A pair
    const q = `Q: What is the main idea of the passage?`;
    const a = `A: ${input.split('.').slice(0,2).join('. ')}.`;
    return { cards: [{ title: 'Flashcard', body: `${q}\n${a}` }] };
  }

  async function generateQuiz({ input } = {}) {
    // TODO: Use Writer/Prompt API to generate MCQs
    return { cards: [{ title: 'Quiz', body: `1) Based on passage: (A) ... (B) ...` }] };
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
