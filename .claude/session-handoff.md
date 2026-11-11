# Session handoff

**Branch:** `claude/tender-mccarthy-rppx2p` (working branch)
**main:** `a8f0d7a` — Render deploys `main` (https://partycue.onrender.com)
**Date:** 2026-11-11

## What we finished
- Imported the AI Studio "KaraokeBox Live" app, fixed the npm install conflict (esbuild), made it
  deployable on Render (`render.yaml`, `Dockerfile`), and renamed it **PartyCue**.
- TV song intro: announcer voice (high-pitched female, with live captions) introduces singer + song,
  then a loud 5-4-3-2-1 beep countdown; the video is held paused until the countdown ends.
- Score screen simplified: big score + spoken compliment with captions, then a numbered ranking of
  **all** singers (best score per singer, no top-5 limit) with "you are now top N" spoken.
- "Tap to start the party" screen on the TV to unlock sound; muted-autoplay fallback with
  "Tap to turn sound on".
- Remote: singer field has ✓ save, ✕ clear, and a saved-singers dropdown (remove per name) for
  one-phone parties. Removed extra host buttons (airhorn by Mic Tune, AI Score, Disco, History)
  and the button bar under the TV queue; fullscreen moved to the player bar.
- Created `main` from the working branch; user switched Render to deploy `main`.
- Added `CLAUDE.md` (daily routine + safety rules incl. live-site rule).
- Built and later **deleted** a Claude artifact version (no longer exists).

## Files changed (main ones)
- `server.ts` — leaderboard: best score per singer, unlimited (`recordLeaderboard`)
- `src/components/SongIntroScreen.tsx` (new), `AIScoreScreen.tsx` (rewritten),
  `SpokenCaption.tsx` (new), `HostScreen.tsx`, `YouTubePlayer.tsx`, `GuestRemote.tsx`, `App.tsx`
- `src/utils/voice.ts` (new: speech, voice pick, title cleanup), `src/utils/audioEffects.ts`
  (`playBeep`, `unlockAudio`)
- `src/hooks/useKaraokeRoom.ts`, `src/types/karaoke.ts`
- `render.yaml` (added `autoDeployTrigger: commit`), `Dockerfile`, `README.md`, `index.html`,
  `metadata.json`, `package.json`, `CLAUDE.md`

## Decisions
- Hosting: Render free plan (sleeps after ~15 min idle; rooms are in memory and reset on restart).
- TV setup: mirror/HDMI/Cast-tab for now; native TV app (Fire TV/Android TV) postponed for cost.
- Own karaoke catalog (Demucs + Whisper alignment) postponed; copyright/licensing noted.
- Keep `claude/determined-cray-rrwfla` (marketing video kit, adds only `marketing/`); not merged.
- Removed the 14 unused AI Studio design screenshots from `public/`.

## Unfinished / possibly buggy
- Real-device testing pending: announcer voice, beep volume, and YouTube auto-play after the
  countdown were only tested with a simulated player in a headless browser (no speakers).
- Voice quality depends on the device's built-in voices; TV browsers may have none (captions still show).
- Render auto-deploy may still be off in the dashboard; `render.yaml` sets it, but confirm
  Settings → Auto-Deploy = On Commit.
- `main` is 1 commit behind this branch (`42d7ce8`, CLAUDE.md live-site rule only) plus this handoff.
- GitHub default branch: user may still need to set it to `main`.

## Next step
User does a test party run on the live site (mirror/HDMI): tap to start, queue songs from two
names, check voice, beeps, playback, score and ranking; then report anything to adjust.
