# Trackify Server

A tiny Express backend whose job is to **keep your AI key off user devices**. The
app sends chat messages here; this server adds the secret key and calls the AI
provider, returning `{ content }`.

It is optional — the app works without it (on-device key or local summaries) — but
recommended for production so no secret ships inside the installable app.

## Run locally

```bash
cd server
npm install
cp .env.example .env     # set GROK_API_KEY (or switch AI_PROVIDER)
npm run dev              # http://localhost:8080  — GET /health → {"ok":true}
```

Then point the app at it: in the repo-root `.env`, set
`EXPO_PUBLIC_API_URL=http://localhost:8080` and restart `expo start`.
(On a physical phone use your computer's LAN IP, e.g. `http://192.168.1.20:8080`.)

## Deploy free

### Render (recommended — uses `render.yaml`)
1. Push this repo to GitHub.
2. render.com → **New + → Blueprint** → select the repo (it reads `render.yaml`).
3. In the service's **Environment** tab, set `GROK_API_KEY`.
4. Copy the service URL → set `EXPO_PUBLIC_API_URL` in the app's `.env`.

### Heroku (uses the root `Procfile`)
```bash
heroku create trackify-server
heroku config:set AI_PROVIDER=grok GROK_API_KEY=xai-xxxx
git push heroku main
```

## Endpoints
| Method | Path            | Body                                    | Returns        |
|--------|-----------------|-----------------------------------------|----------------|
| GET    | `/health`       | —                                       | `{ ok: true }` |
| POST   | `/api/ai/chat`  | `{ messages, max_tokens?, temperature? }` | `{ content }`  |

## Switch AI provider
Set `AI_PROVIDER` to `grok` (default), `openai`, or `gemini` and provide that
provider's key. See `.env.example`.
