# Spendify

Your financial life, intelligently designed.

A premium AI-native personal finance OS — Expo + React Native + TypeScript + NativeWind + Supabase + Gemini.

## Stack

- **App**: Expo SDK 52, React Native 0.76, TypeScript
- **Routing**: Expo Router (file-based, typed routes)
- **Styling**: NativeWind 4 (Tailwind) with semantic design tokens, light/dark/AMOLED
- **State**: Zustand + MMKV (offline-first, persisted)
- **Data**: TanStack Query (server cache, ready for Supabase)
- **UI**: Reanimated 3, expo-blur, lucide icons, FlashList
- **i18n**: i18next with 8 locales (EN, ES, AR, UR, HI, PT, FR, DE) + RTL
- **AI**: Gemini 2.5 Flash via Supabase Edge Functions (streaming stub included)
- **Backend** (optional): Supabase (Postgres + Auth + Storage + Realtime + Edge)

## Quick start

```bash
# 1. install (Windows / PowerShell or any shell)
npm install

# 2. run dev server
npm run start
#   then press i (iOS sim), a (Android emulator), or scan the QR with Expo Go
```

> **Note on Windows + iOS**: You can develop on Windows but to build/run the iOS app you need a Mac or a cloud build (EAS). Android and web work fully on Windows.

## Folder structure

```
spendify/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root: providers, theme, onboarding gate
│   ├── onboarding.tsx
│   └── (tabs)/                 # Tab navigator
│       ├── _layout.tsx         # Glass tab bar
│       ├── index.tsx           # Dashboard
│       ├── budgets.tsx         # Smart budget spaces
│       ├── expenses.tsx        # Expense list (FlashList)
│       ├── copilot.tsx         # AI chat (streaming)
│       └── settings.tsx        # Theme, language, plan
├── src/
│   ├── components/ui/          # Screen, GlassCard, AuroraBackground, Button, Text
│   ├── hooks/                  # useTheme, useHaptics, useCurrency
│   ├── lib/
│   │   ├── i18n/               # i18next + 8 locale JSONs
│   │   ├── theme/              # palette, semantic tokens, spacing/radius
│   │   ├── mmkv.ts             # MMKV singleton + Zustand storage adapter
│   │   └── query.ts            # TanStack QueryClient
│   ├── services/
│   │   ├── supabase.ts         # client stub (uncomment when wiring)
│   │   └── ai.ts               # streaming AI client (canned offline replies)
│   ├── store/                  # Zustand slices: settings, budgets, expenses
│   └── types/                  # Domain types
├── app.json / babel.config.js / metro.config.js / tailwind.config.js
└── global.css                  # Tailwind base + CSS variables for theme modes
```

## Design system

- **Semantic tokens only** — components never reference raw hex; use `bg-bg`, `text-text-muted`, `border-border`, `text-accent-violet`, etc.
- **Three themes**: `light`, `dark`, `amoled` (true-black for OLED). User can pick or follow system.
- **Frosted surfaces**: `GlassCard` swaps to a solid surface in AMOLED so OLED stays black.
- **Aurora backgrounds**: animated blobs driven on the UI thread via Reanimated; auto-disabled in AMOLED.
- **Typography**: Display = Space Grotesk, Body = Inter, Mono = IBM Plex (font files not yet installed — falls back to system).

## Connecting Supabase

1. Create a Supabase project.
2. Set env vars (Expo automatically inlines `EXPO_PUBLIC_*`):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. `npm install @supabase/supabase-js` and uncomment the `createClient` block in `src/services/supabase.ts`.
4. Apply your schema (suggested tables: `profiles`, `budgets`, `expenses`, `categories`, `ai_chats`, `subscriptions`, `family_members`, `notifications`) with RLS on every table.

## Connecting Gemini (AI Copilot)

Don't ship your Gemini key in the client. Deploy a Supabase Edge Function (`POST /chat`) that:

1. Verifies the user's JWT.
2. Fetches their recent expenses/budgets as grounding.
3. Calls Gemini 2.5 Flash with streaming.
4. Pipes Server-Sent Events back to the client.

Then replace the `streamAIResponse` body in `src/services/ai.ts` with a `fetch()` to that endpoint that yields chunks from the SSE stream. The component code in `app/(tabs)/copilot.tsx` already consumes an async iterator, so the call site stays the same.

## What's offline-first

- All app state lives in MMKV via Zustand `persist` — the app works fully offline.
- Seed data is provided so screens look populated on first launch.
- When Supabase is wired, treat MMKV as the cache and push deltas to Supabase via TanStack Query mutations + Realtime reconciliation.

## What's next

The scaffold covers the foundation. Natural next milestones:

- [ ] Create-expense modal (sheet, validation, smart category suggestions)
- [ ] Charts (animated bar/line via `react-native-svg` + Reanimated)
- [ ] OCR receipt scan flow (Gemini Vision via Edge Function)
- [ ] Voice expense input (`expo-speech-recognition` + LLM parser)
- [ ] Real Supabase + Gemini wiring
- [ ] Auth flow (email link / Apple / Google)
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
