# PartyCue — KaraokeBox Live

Multi-device YouTube karaoke: open the **TV** view on a big screen, guests scan the QR code to queue songs from their phones, vote on performances, and get an AI judge score.

## Deploy (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/karame-dotcom/partycue)

1. Click the button and sign in to Render with GitHub.
2. Optionally paste a `GEMINI_API_KEY` (without it, the AI judge uses a built-in fallback scorer).
3. Click **Apply**. After the build finishes you get a public `https://partycue-xxxx.onrender.com` URL.

> Free Render instances sleep after ~15 min idle (first load then takes ~30 s) and room state is kept in memory, so it resets when the server restarts.

A `Dockerfile` is included for Google Cloud Run, Fly.io, Railway, etc. (listens on `$PORT`).

## Run locally

Requires Node.js 22.18+.

```bash
npm install
npm run dev        # dev server with hot reload on http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Optional env vars (in `.env`): `GEMINI_API_KEY`, `PORT`.
