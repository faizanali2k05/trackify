# Trackify

**Manage your budget with ease.** A premium, AI-native personal-finance app —
Expo + React Native + TypeScript + NativeWind, with a conversational copilot
grounded in your real spending, cloud sync via Supabase, and **over-the-air
updates** so a push to GitHub updates every installed device.

Everything lives in **one repo**: the mobile app (`src/`), the database schema
(`database.sql`), and the optional backend (`server/`).

## Stack

- **App**: Expo SDK 55, React Native 0.83, React 19, TypeScript
- **Routing**: Expo Router (file-based, typed routes) — lives in `src/app/`
- **Styling**: NativeWind 4 (Tailwind) with semantic tokens; light/dark/AMOLED
- **State**: Zustand + AsyncStorage (offline-first, persisted)
- **Cloud**: Supabase (Postgres + Auth + Realtime) — optional, off until you add keys
- **AI**: backend proxy (Grok / OpenAI / Gemini) → on-device key → local fallback
- **OTA**: EAS Update + a GitHub Action that publishes on every push to `main`
- **i18n**: i18next, 8 locales (EN, ES, AR, UR, HI, PT, FR, DE) + RTL

## Project structure

```
trackify/
├── src/                      # ← ALL app code lives here
│   ├── app/                  # Expo Router screens = your navigation (see note below)
│   │   ├── _layout.tsx       # Root: providers, theme, onboarding gate, OTA updates
│   │   ├── (tabs)/           # Dashboard, Budgets, Expenses, Copilot, Settings
│   │   ├── budget/ expense/  # Add/edit modals
│   │   ├── analytics.tsx
│   │   └── onboarding.tsx
│   ├── components/ui/        # Screen, GlassCard, Aurora, Button, Text, Icon, TextField
│   ├── features/             # Feature forms (ExpenseForm, BudgetForm)
│   ├── hooks/                # useTheme, useHaptics, useCurrency, useOTAUpdates
│   ├── lib/                  # i18n, theme, analytics, constants, storage, query
│   ├── services/             # supabase.ts (client), ai.ts (copilot)
│   ├── store/                # Zustand slices: settings, budgets, expenses
│   └── types/                # Domain types
├── server/                   # Optional backend (AI proxy) → deploy on Render/Heroku
├── assets/                   # App icons, splash, brand, favicons
├── database.sql              # Run this in the Supabase SQL Editor (schema + RLS)
├── eas.json                  # EAS build/update channels
├── render.yaml  Procfile     # Backend deploy descriptors
└── .github/workflows/        # eas-update.yml — OTA publish on push
```

### Why is there a `src/app/` folder?
Expo Router is **file-based routing**: every file under `src/app/` automatically
becomes a screen/route (like Next.js). It's not extra code — it *is* your
navigation. We keep it inside `src/` so the repo has a single source folder.

## Quick start

```bash
npm install
cp .env.example .env     # optional — app runs fully offline with no keys
npm run start            # press a / i / w, or scan the QR with Expo Go
```

## Over-the-air updates (push to GitHub → live on all devices)

1. Create an Expo account, then run once and **commit** the result:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   npx eas-cli@latest update:configure
   ```
   (this writes `extra.eas.projectId` + `updates.url` into `app.json`).
2. Add an Expo access token to GitHub → **Settings → Secrets → Actions** as
   `EXPO_TOKEN` (create it at expo.dev → Account → Access tokens).
3. Build & install the app once per platform: `eas build --profile production`.
4. From now on, **every push to `main`** runs `.github/workflows/eas-update.yml`,
   which publishes a new JS bundle that installed apps download on next launch /
   foreground (see `src/hooks/useOTAUpdates.ts`).

> OTA ships **JavaScript & asset** changes. Native changes (new native modules,
> permissions, app icon) still need a new `eas build`.

## Supabase (cloud auth + sync)

1. Create a project at supabase.com.
2. SQL Editor → paste **`database.sql`** → Run (creates tables + Row Level
   Security + Realtime).
3. Settings → API → copy the URL and anon key into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart `expo start`. The client is in `src/services/supabase.ts` and is
   `null` until configured, so the app keeps working offline.

## Backend (keeps AI keys off devices)

See [`server/README.md`](server/README.md). Deploy free on **Render** (uses
`render.yaml`) or **Heroku** (uses `Procfile`), set your provider key there, then
put the service URL in `EXPO_PUBLIC_API_URL`. Without it, the app uses an
on-device key or deterministic local summaries.

## Scripts

```
npm run start        # Expo dev server
npm run android      # open Android
npm run ios          # open iOS (Mac only)
npm run web          # PWA
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
```
