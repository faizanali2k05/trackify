/**
 * Spendify AI — powered by Grok (xAI).
 *
 * Grok exposes an OpenAI-compatible chat API at https://api.x.ai/v1. We send a
 * compact, grounded summary of the user's budgets/expenses so answers reflect
 * real data instead of hallucinated numbers.
 *
 * Key resolution order (first non-empty wins):
 *   1. key passed in from the in-app Settings field (stored on-device)
 *   2. EXPO_PUBLIC_GROK_API_KEY from the environment / .env
 *
 * With no key, everything still works: we fall back to deterministic local
 * summaries computed from the same data. The app is never "broken" without AI.
 *
 * NOTE: any EXPO_PUBLIC_ value is bundled into the client and is therefore
 * visible to anyone with the app. For a production launch, proxy these calls
 * through a small server (e.g. a Supabase Edge Function) and keep the key there.
 */
import type { AIMessage, Budget, Expense } from '@/types';
import { uid } from '@/lib/id';
import {
  byCategory,
  dailyTrend,
  financialHealth,
  monthSpent,
  recurringMerchants,
  topMerchants,
  totalSpent,
} from '@/lib/analytics';

export type AIContext = {
  expenses: Expense[];
  budgets: Budget[];
  locale: string;
  currency: string;
  userName?: string;
  /** Prior turns for multi-turn chat (most recent last). */
  history?: AIMessage[];
  /** On-device key from Settings; overrides the env key when present. */
  apiKey?: string;
};

export type AIStreamChunk = { delta: string; done: boolean };

const GROK_BASE_URL = process.env.EXPO_PUBLIC_GROK_BASE_URL ?? 'https://api.x.ai/v1';
const GROK_MODEL = process.env.EXPO_PUBLIC_GROK_MODEL ?? 'grok-3';

function resolveKey(ctx: AIContext): string | undefined {
  const fromSettings = ctx.apiKey?.trim();
  const fromEnv = process.env.EXPO_PUBLIC_GROK_API_KEY?.trim();
  return fromSettings || fromEnv || undefined;
}

/** Whether a key is available from either source. Useful for UI hints. */
export function isAIConfigured(apiKey?: string): boolean {
  return Boolean((apiKey?.trim() || process.env.EXPO_PUBLIC_GROK_API_KEY?.trim()) ?? '');
}

const SYSTEM_PROMPT = `You are Spendify AI, a calm, sharp, and encouraging personal-finance copilot inside a premium budgeting app.

Rules:
- Ground every answer ONLY in the user's data provided in the context block. Never invent transactions or numbers.
- Be concise and conversational. Prefer 2–5 short sentences. Use plain language, not jargon.
- Always use the user's currency code when stating money amounts.
- Be specific and actionable: name categories, merchants, and concrete amounts to save.
- Be honest but kind about overspending. Reduce financial anxiety; never shame.
- If the data is too thin to answer, say so briefly and suggest what to log next.
- Do not use markdown headings or tables. Short sentences or compact bullet points only.`;

/** Build a compact, token-efficient grounding summary from the user's data. */
function buildContextBlock(ctx: AIContext): string {
  const { expenses, budgets, currency } = ctx;
  const lines: string[] = [];
  const health = financialHealth(expenses, budgets);
  const total = totalSpent(expenses);

  lines.push(`Currency: ${currency}`);
  lines.push(`Today: ${new Date().toISOString().slice(0, 10)}`);
  if (ctx.userName) lines.push(`User name: ${ctx.userName}`);
  lines.push(
    `Totals: budget ${health.totalBudget.toFixed(0)}, spent ${health.totalSpent.toFixed(0)}, remaining ${health.remaining.toFixed(0)}, utilization ${(health.utilization * 100).toFixed(0)}%.`,
  );
  lines.push(`This month spent: ${monthSpent(expenses).toFixed(0)}. Lifetime logged: ${total.toFixed(0)} across ${expenses.length} expenses.`);
  lines.push(`Financial health score: ${health.score}/100 (${health.label}). Overspent budgets: ${health.overspentCount}.`);

  if (budgets.length) {
    lines.push('Budgets:');
    for (const b of budgets) {
      lines.push(`- ${b.name} (${b.type}): spent ${b.spent.toFixed(0)} of ${b.amount.toFixed(0)} ${b.currency}`);
    }
  }

  const cats = byCategory(expenses).slice(0, 6);
  if (cats.length) {
    lines.push('Top categories:');
    for (const c of cats) {
      lines.push(`- ${c.category}: ${c.total.toFixed(0)} (${(c.pct * 100).toFixed(0)}%)`);
    }
  }

  const merchants = topMerchants(expenses, 5);
  if (merchants.length) {
    lines.push('Top merchants: ' + merchants.map((m) => `${m.merchant} ${m.total.toFixed(0)}`).join(', '));
  }

  const recurring = recurringMerchants(expenses);
  if (recurring.length) {
    lines.push('Likely recurring: ' + recurring.map((m) => m.merchant).join(', '));
  }

  const recent = expenses.slice(0, 8);
  if (recent.length) {
    lines.push('Recent expenses:');
    for (const e of recent) {
      lines.push(`- ${e.date.slice(0, 10)} ${e.merchant} (${e.category}) ${e.amount.toFixed(2)}`);
    }
  }

  return lines.join('\n');
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function callGrok(
  messages: ChatMessage[],
  opts: { apiKey: string; maxTokens?: number; temperature?: number },
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 600,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.error?.message ?? JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '');
      }
      throw new Error(`Grok ${res.status}: ${detail || res.statusText}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Grok returned an empty response.');
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/** Yield text word-by-word so the UI gets a natural typing animation. */
async function* typeOut(text: string): AsyncGenerator<AIStreamChunk> {
  const tokens = text.split(/(\s+)/);
  for (let i = 0; i < tokens.length; i++) {
    await new Promise((r) => setTimeout(r, 16));
    yield { delta: tokens[i], done: i === tokens.length - 1 };
  }
  if (tokens.length === 0) yield { delta: '', done: true };
}

/**
 * Stream a conversational answer. Uses Grok when a key is available, otherwise
 * a deterministic local answer — either way it is rendered as a typing stream.
 */
export async function* streamAIResponse(
  prompt: string,
  ctx: AIContext,
): AsyncGenerator<AIStreamChunk> {
  const key = resolveKey(ctx);

  if (!key) {
    yield* typeOut(localAnswer(prompt, ctx));
    return;
  }

  let text: string;
  try {
    const history: ChatMessage[] = (ctx.history ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    text = await callGrok(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `User financial context:\n${buildContextBlock(ctx)}` },
        ...history,
        { role: 'user', content: prompt },
      ],
      { apiKey: key, maxTokens: 600, temperature: 0.4 },
    );
  } catch (err) {
    const note = __DEV__ ? ` (${(err as Error).message})` : '';
    text = `${localAnswer(prompt, ctx)}\n\n(Offline mode — couldn't reach Grok${note}.)`;
  }
  yield* typeOut(text);
}

/** A single short, proactive insight for the dashboard. Resolves to plain text. */
export async function generateInsight(ctx: AIContext): Promise<string> {
  const key = resolveKey(ctx);
  if (!key) return localInsight(ctx);
  try {
    return await callGrok(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `User financial context:\n${buildContextBlock(ctx)}` },
        {
          role: 'user',
          content:
            'In ONE or TWO short sentences, give the single most useful, specific observation about my spending right now. Be encouraging but honest. No preamble, no greeting.',
        },
      ],
      { apiKey: key, maxTokens: 120, temperature: 0.5 },
    );
  } catch {
    return localInsight(ctx);
  }
}

// ---------------------------------------------------------------------------
// Local fallbacks — deterministic, computed from the same data as the AI.
// ---------------------------------------------------------------------------

function localInsight(ctx: AIContext): string {
  const { expenses, budgets, currency } = ctx;
  if (expenses.length === 0) {
    return "Log your first expense and I'll start spotting patterns and savings for you.";
  }
  const health = financialHealth(expenses, budgets);
  const cats = byCategory(expenses);
  const top = cats[0];

  if (health.overspentCount > 0) {
    return `${health.overspentCount} budget${health.overspentCount > 1 ? 's are' : ' is'} over its limit. Reining in ${top?.category ?? 'your top category'} would bring things back in line.`;
  }
  if (health.hasBudget && health.utilization < 0.75 && top) {
    return `You're at ${(health.utilization * 100).toFixed(0)}% of budget with room to spare — ${top.category} leads at ${(top.pct * 100).toFixed(0)}% of spend. Nicely balanced.`;
  }
  if (top) {
    return `${top.category} is your biggest category at ${top.total.toFixed(0)} ${currency} (${(top.pct * 100).toFixed(0)}% of spending). Worth a quick look.`;
  }
  return 'Your spending looks steady — no anomalies stand out this period.';
}

function localAnswer(prompt: string, ctx: AIContext): string {
  const { expenses, budgets, currency } = ctx;
  const lower = prompt.toLowerCase();
  const total = totalSpent(expenses);
  const cats = byCategory(expenses);
  const top = cats[0] ?? { category: '—', total: 0, pct: 0 };
  const health = financialHealth(expenses, budgets);

  if (expenses.length === 0) {
    return "I don't see any expenses yet. Add a few — or scan a receipt — and I can summarize, forecast, and find savings.";
  }

  if (/(health|score|how am i doing|doing well)/.test(lower)) {
    return `Your financial health score is ${health.score}/100 (${health.label}). You've spent ${health.totalSpent.toFixed(0)} of ${health.totalBudget.toFixed(0)} ${currency} — ${(health.utilization * 100).toFixed(0)}% of budget${health.overspentCount ? `, with ${health.overspentCount} space(s) over limit` : ''}.`;
  }
  if (/(overspend|over spend|over budget|too much)/.test(lower)) {
    return `Your largest category is ${top.category} at ${top.total.toFixed(0)} ${currency} — about ${(top.pct * 100).toFixed(0)}% of total spending. ${health.overspentCount ? `${health.overspentCount} budget(s) are currently over their limit.` : 'No budget is over its limit yet.'}`;
  }
  if (/(save|cut|reduce|less)/.test(lower)) {
    const saving = top.total * 0.2;
    return `Trimming ${top.category} by 20% would save about ${saving.toFixed(0)} ${currency}. The recurring charges are usually the easiest place to start.`;
  }
  if (/(forecast|predict|next month|projection|trend)/.test(lower)) {
    const trend = dailyTrend(expenses, 7);
    const dailyAvg = trend.reduce((a, p) => a + p.total, 0) / 7;
    return `Over the last 7 days you've averaged ${dailyAvg.toFixed(0)} ${currency}/day. At that pace you're trending toward roughly ${(dailyAvg * 30).toFixed(0)} ${currency} over a month. Most variance comes from ${top.category}.`;
  }
  if (/(summary|summarize|summarise|recap|overview)/.test(lower)) {
    return `You've logged ${expenses.length} expenses totaling ${total.toFixed(0)} ${currency}. Top category: ${top.category} (${(top.pct * 100).toFixed(0)}%). Health score ${health.score}/100 — ${health.label}.`;
  }
  for (const c of cats) {
    if (lower.includes(c.category.toLowerCase())) {
      return `You've spent ${c.total.toFixed(0)} ${currency} on ${c.category} across ${c.count} expense(s) — ${(c.pct * 100).toFixed(0)}% of your total.`;
    }
  }
  return `I can summarize your spending, forecast next month, check your health score, or find savings. Top category right now is ${top.category} at ${(top.pct * 100).toFixed(0)}% of spend. (Add a Grok API key in Settings for richer, conversational answers.)`;
}

export { uid };
export type { AIMessage };
