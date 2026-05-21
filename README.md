# Spendify

Your financial life, intelligently designed.

A premium AI-native personal finance app — Expo + React Native + TypeScript + NativeWind, with a conversational **Grok (xAI)** copilot grounded in your real spending.

## Stack

- **App**: Expo SDK 55, React Native 0.83, React 19, TypeScript
- **Routing**: Expo Router (file-based, typed routes)
- **Styling**: NativeWind 4 (Tailwind) with semantic design tokens, light/dark/AMOLED
- **State**: Zustand + AsyncStorage (offline-first, persisted — runs in Expo Go)
- **Data**: TanStack Query (used for the live AI insight; ready for Supabase)
- **UI**: Reanimated 4, expo-blur, lucide icons, FlashList, react-native-svg charts
- **i18n**: i18next with 8 locales (EN, ES, AR, UR, HI, PT, FR, DE) + RTL
- **AI**: Grok (xAI) chat API with on-device key + graceful offline fallback
- **Backend** (optional): Supabase (stubbed, off by default)

## Quick start

```bash
# 1. install
npm install

# 2. (optional) add your Grok key for full AI — or paste it in-app under Settings
cp .env.example .env   # then set EXPO_PUBLIC_GROK_API_KEY

# 3. run
npm run start
#   press a (Android) / i (iOS, Mac only) / w (web), or scan the QR with Expo Go
```

> Runs in **Expo Go** — no custom dev build needed. Storage uses AsyncStorage,
> and every native module here is supported by Expo Go on SDK 55.

## AI setup (Grok)

Spendify works with **no key** — it falls back to fast, deterministic on-device
summaries computed from your data. To enable the conversational copilot and live
insights:

1. Get a key from <https://console.x.ai>.
2. Provide it either way:
   - **In-app** (easiest): Settings → Spendify AI → paste your `xai-...` key. Stored only on-device.
   - **.env**: set `EXPO_PUBLIC_GROK_API_KEY` and restart the dev server.
3. Optional: `EXPO_PUBLIC_GROK_MODEL` (default `grok-3`) and `EXPO_PUBLIC_GROK_BASE_URL`.

The client sends a compact, grounded summary of your budgets/expenses so answers
reflect real numbers. `src/services/ai.ts` is the single integration point.

> Security: any `EXPO_PUBLIC_` value is bundled into the client. For production,
> proxy these calls through a server (e.g. a Supabase Edge Function) and keep the
> key there. The async-iterator interface in `streamAIResponse` makes that swap drop-in.

## Features

- **Dashboard** — balance, budget progress, quick actions, and a live AI insight card.
- **Budgets** — create/edit/delete budget spaces (monthly, travel, business, event, family) with color + type.
- **Expenses** — add/edit, search, filter (fixed/variable), date grouping, swipe-to-delete. Adding/removing an expense keeps the linked budget's "spent" in sync.
- **Analytics** — financial health score (animated SVG ring), 14-day spend trend, by-category breakdown, top merchants.
- **Copilot** — multi-turn chat with Grok, grounded in your data, with a typing stream.
- **Settings** — theme (light/dark/AMOLED/system), language (8 + RTL), currency picker, profile name, Grok key.

## Folder structure

```
spendify/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root: providers, theme, onboarding gate, modal routes
│   ├── onboarding.tsx
│   ├── analytics.tsx           # Analytics + charts + health score
│   ├── expense/                # new.tsx + [id].tsx (add/edit modal)
│   ├── budget/                 # new.tsx + [id].tsx (create/edit modal)
│   └── (tabs)/                 # Dashboard, Budgets, Expenses, Copilot, Settings
├── src/
│   ├── components/ui/          # Screen, GlassCard, Aurora, Button, Text, Icon, TextField
│   ├── features/               # ExpenseForm, BudgetForm
│   ├── hooks/                  # useTheme, useHaptics, useCurrency
│   ├── lib/
│   │   ├── i18n/               # i18next + 8 locale JSONs
│   │   ├── theme/              # palette, semantic tokens, spacing/radius
│   │   ├── analytics.ts        # stats, by-category, trend, financial health score
│   │   ├── constants.ts        # categories, budget types, currencies
│   │   ├── id.ts               # uid helper
│   │   ├── storage.ts          # AsyncStorage + Zustand persist adapter
│   │   └── query.ts            # TanStack QueryClient
│   ├── services/
│   │   ├── supabase.ts         # client stub (uncomment when wiring)
│   │   └── ai.ts               # Grok client + grounding + offline fallback
│   ├── store/                  # Zustand slices: settings, budgets, expenses
│   └── types/                  # Domain types
└── global.css                  # Tailwind base + CSS variables for theme modes
```

## Design system

- **Semantic tokens only** — components never reference raw hex; use `bg-bg`, `text-text-muted`, `border-border`, `text-accent-violet`, etc.
- **Three themes**: `light`, `dark`, `amoled` (true-black for OLED). User can pick or follow system.
- **Frosted surfaces**: `GlassCard` swaps to a solid surface in AMOLED so OLED stays black.
- **Aurora backgrounds**: animated blobs driven on the UI thread via Reanimated; auto-disabled in AMOLED.
- **Typography**: Display = Space Grotesk, Body = Inter, Mono = IBM Plex (font files not yet installed — falls back to system).

## What's offline-first

- All app state lives in AsyncStorage via Zustand `persist` — the app works fully offline.
- The AI degrades to on-device summaries when no key/network is available.
- Seed data is provided so screens look populated on first launch.

## What's next

- [ ] OCR receipt scan (expo-camera + a vision model)
- [ ] Voice expense input
- [ ] Real Supabase sync + auth
- [ ] Server-side AI proxy (move the key off-device)
- [ ] Recurring-payment automation, budget alerts/notifications
- [ ] EAS build profiles, app icons, splash assets

## Scripts

```
npm run start        # Expo dev server
npm run android      # open Android
npm run ios          # open iOS (Mac only)
npm run web          # PWA
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
```
