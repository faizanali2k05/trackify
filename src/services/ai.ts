/**
 * AI service stub.
 *
 * In production this should call a Supabase Edge Function that proxies to Gemini
 * 2.5 Flash with the user's spend context as grounding. Keep model keys server-side —
 * never bundle them into the client. The function returned here is intentionally
 * shaped to support streaming via an async iterator once wired up.
 */
import type { AIMessage, Expense, Budget } from '@/types';

export type AIContext = {
  expenses: Expense[];
  budgets: Budget[];
  locale: string;
  currency: string;
};

export type AIStreamChunk = { delta: string; done: boolean };

/** Offline placeholder — returns a plausible canned response. Replace with Edge Function. */
export async function* streamAIResponse(
  prompt: string,
  _ctx: AIContext,
): AsyncGenerator<AIStreamChunk> {
  const reply = canned(prompt, _ctx);
  const tokens = reply.split(/(\s+)/);
  for (let i = 0; i < tokens.length; i++) {
    await new Promise((r) => setTimeout(r, 24));
    yield { delta: tokens[i], done: i === tokens.length - 1 };
  }
}

function canned(prompt: string, ctx: AIContext): string {
  const total = ctx.expenses.reduce((sum, e) => sum + e.amount, 0);
  const topCat = topCategory(ctx.expenses);
  const lower = prompt.toLowerCase();

  if (lower.includes('overspend') || lower.includes('over spend')) {
    return `Your largest category this period was ${topCat.name} at about ${topCat.total.toFixed(0)} ${ctx.currency}. That's roughly ${Math.round((topCat.total / Math.max(total, 1)) * 100)}% of total spending — worth a closer look.`;
  }
  if (lower.includes('save') || lower.includes('cut')) {
    return `Trimming ${topCat.name} by 20% would save about ${(topCat.total * 0.2).toFixed(0)} ${ctx.currency} per month. I can break that down by merchant if you'd like.`;
  }
  if (lower.includes('forecast') || lower.includes('predict') || lower.includes('next month')) {
    return `Based on your last 30 days, you're trending toward roughly ${(total * 1.05).toFixed(0)} ${ctx.currency} next month. Most variance comes from ${topCat.name}.`;
  }
  if (lower.includes('summary') || lower.includes('summarize') || lower.includes('summarise')) {
    return `You logged ${ctx.expenses.length} expenses totaling ${total.toFixed(0)} ${ctx.currency}. Top category: ${topCat.name}. Spending pace looks steady — no anomalies stand out.`;
  }
  return `I can help you analyze spending, forecast next month, or find savings. Try asking about a specific category or budget.`;
}

function topCategory(expenses: Expense[]) {
  const byCat = new Map<string, number>();
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  let best = { name: '—', total: 0 };
  for (const [name, total] of byCat) {
    if (total > best.total) best = { name, total };
  }
  return best;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type { AIMessage };
