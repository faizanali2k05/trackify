/**
 * Trackify backend.
 *
 * Purpose: keep the AI provider key OFF user devices. The app POSTs chat
 * messages here; this server adds the secret key and calls the provider.
 *
 * Provider is pluggable via AI_PROVIDER:
 *   - "grok"   (default) — xAI, OpenAI-compatible  (key: GROK_API_KEY)
 *   - "openai"            — OpenAI                  (key: OPENAI_API_KEY)
 *   - "gemini"            — Google Gemini           (key: GEMINI_API_KEY)
 *
 * Endpoints:
 *   GET  /            → service banner
 *   GET  /health      → { ok: true }
 *   POST /api/ai/chat → { messages, max_tokens?, temperature? } -> { content }
 *
 * Deploy free on Render (render.yaml) or Heroku (Procfile). Node 18+ (built-in fetch).
 */
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); // mobile app has no fixed origin; lock down with ALLOWED_ORIGIN if you like
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 8080;
const PROVIDER = (process.env.AI_PROVIDER || 'grok').toLowerCase();

const SYSTEM_FALLBACK =
  'You are Trackify AI, a calm, encouraging personal-finance copilot. Ground answers in the user data provided. Be concise.';

// --- Provider adapters -----------------------------------------------------

async function callOpenAICompatible({ baseUrl, apiKey, model, messages, max_tokens, temperature }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens, temperature, stream: false }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from provider.');
  return content.trim();
}

async function callGemini({ apiKey, model, messages, max_tokens, temperature }) {
  // Flatten system messages into a system_instruction; map the rest to contents.
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: { maxOutputTokens: max_tokens, temperature },
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text().catch(() => res.statusText)}`);
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!content) throw new Error('Empty response from Gemini.');
  return content.trim();
}

function resolveProvider() {
  switch (PROVIDER) {
    case 'openai':
      return {
        key: process.env.OPENAI_API_KEY,
        run: (msgs, o) =>
          callOpenAICompatible({
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: msgs,
            ...o,
          }),
      };
    case 'gemini':
      return {
        key: process.env.GEMINI_API_KEY,
        run: (msgs, o) =>
          callGemini({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            messages: msgs,
            ...o,
          }),
      };
    case 'grok':
    default:
      return {
        key: process.env.GROK_API_KEY,
        run: (msgs, o) =>
          callOpenAICompatible({
            baseUrl: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
            apiKey: process.env.GROK_API_KEY,
            model: process.env.GROK_MODEL || 'grok-3',
            messages: msgs,
            ...o,
          }),
      };
  }
}

// --- Routes ----------------------------------------------------------------

app.get('/', (_req, res) => {
  res.json({ service: 'trackify-server', provider: PROVIDER, status: 'ok' });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/ai/chat', async (req, res) => {
  const { messages, max_tokens = 600, temperature = 0.4 } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] is required' });
  }

  const provider = resolveProvider();
  if (!provider.key) {
    return res.status(503).json({
      error: `AI_PROVIDER=${PROVIDER} but its API key env var is not set on the server.`,
    });
  }

  // Guarantee a system prompt exists.
  const hasSystem = messages.some((m) => m.role === 'system');
  const finalMessages = hasSystem ? messages : [{ role: 'system', content: SYSTEM_FALLBACK }, ...messages];

  try {
    const content = await provider.run(finalMessages, { max_tokens, temperature });
    res.json({ content });
  } catch (err) {
    console.error('[ai/chat]', err.message);
    res.status(502).json({ error: 'AI provider request failed', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Trackify server listening on :${PORT} (provider: ${PROVIDER})`);
});
