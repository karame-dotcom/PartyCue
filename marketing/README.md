# PartyCue short-form video kit

## Files

| File | What it is |
|---|---|
| `partycue_demo_9x16.mp4` | Finished 37.6s vertical demo (1080×1920, 30fps) **with sound**: the app's own beeps and fanfare, applause, and an original background beat |
| `partycue_demo_9x16_sfx_only.mp4` | Same video with sound effects only, no music. Use this one when adding a voiceover or a trending sound. |
| `voiceover-script.md` | Timed narration script (English + Taglish) and step-by-step CapCut / ElevenLabs instructions |
| `raw-clips/tv-screen.mp4` | Full 85s TV-screen recording (1280×720) |
| `raw-clips/phone-screen.mp4` | Full 85s phone-remote recording (390×844), in sync with the TV clip |
| `raw-clips/sound-events.json` | When the app played each sound and spoke each line during the recording |
| `video-tools/` | Scripts that recorded and assembled the video (re-run after UI changes) |

Recorded from the app as of "Add high-pitched announcer voice introducing each singer": includes the saved-singer ✓ button, the announcer intro and the louder countdown beep.

### Recording note
YouTube was blocked in the recording environment, so the YouTube pieces were stand-ins:
- the search results and thumbnails are sample data
- the "lyrics" on the TV during singing are a placeholder visual, not a real karaoke video

Everything else is the real app UI. The scores came from the built-in fallback scorer. The browser's speech voice isn't captured in screen recordings, so the announcer and judge lines appear as on-screen captions. Add them as voice using `voiceover-script.md`.

## Timeline of `partycue_demo_9x16.mp4`

| Time | On-screen text | Footage | Sound |
|---|---|---|---|
| 0.0–2.6 | You don't need a karaoke machine | TV "Tap to start the party" | beat starts |
| 2.6–6.0 | STEP 1 · Open PartyCue on any TV | TV with QR code | |
| 6.0–8.6 | STEP 2 · Guests scan the QR | Phone: types "Jess", taps ✓ | |
| 8.6–13.4 | STEP 3 · Queue any song from YouTube | Phone: search, then Queue | |
| 13.4–17.0 | STEP 4 · The announcer calls you up | TV: "Our next singer... is Jess!" | |
| 17.0–20.4 | 3... 2... 1... sing! | TV: countdown | app's countdown beeps |
| 20.4–23.6 | Sing your heart out | TV: song + cheer confetti | app's fanfare |
| 23.6–27.8 | STEP 5 · The AI judge scores you | TV: score 92 | applause |
| 27.8–30.4 | Then your friend goes next... | TV: Carlo scores 91 | applause |
| 30.4–34.2 | ...and the fight for #1 begins | TV: ranking | app's fanfare + applause |
| 34.2–37.6 | PartyCue · Free · No app · Any TV · Link in bio | End card | fanfare |

## Script (for real-footage versions)

The best-performing version mixes **real party footage** (filmed on a phone) with these screen clips.

1. **Hook (0–3s):** Friends on a couch, TV off: "we don't have a karaoke machine." Hard cut to PartyCue lighting up the TV.
   Text: *You don't need a karaoke machine 🎤*
2. **Open on the TV (3–7s):** TV with QR. VO: "Open PartyCue on any smart TV or laptop."
3. **Scan (7–12s):** Real friends scanning the QR. VO: "Everyone scans the code. No app download."
4. **Queue (12–17s):** Phone search, then queue. VO: "Search any song on YouTube and add it from your phone."
5. **Sing (17–22s):** Countdown, then a real person belting it out. VO: "When it's your turn, the TV calls you up."
6. **AI judge (22–27s):** Score reveal + real group reaction. VO: "Then the AI judge scores you. No mercy." Text: *The AI judge has no mercy 💀*
7. **CTA (27–30s):** *PartyCue — free. Link in bio 🎉*

**Caption:** Turned our TV into a karaoke machine in 10 seconds 😭🎤 who's getting roasted by the AI judge first? #karaoke #partyideas #karaokenight #partygames #christmasparty #videoke

### Alternative hooks (swap in the first 3s)
- POV: your tita discovers the AI karaoke judge
- I built a karaoke app because videoke machines cost ₱10,000+
- Rating my friends' singing with AI 😬
- Christmas party idea that costs ₱0

## Regenerating the video

With the app running on `localhost:3000` (`npm run dev`):

```bash
node video-tools/record.cjs <out-dir>          # records synced TV + phone frames
cd <out-dir> && python3 /path/to/video-tools/mk.py tvf && python3 /path/to/video-tools/mk.py phf
node video-tools/cards.cjs <edit-dir>          # renders caption cards (needs scenes.json in <edit-dir>)
python3 video-tools/audio.py <out-dir> <edit-dir>          # builds the soundtrack (needs numpy)
python3 video-tools/build.py <out-dir> <edit-dir>
```

Edit `scenes.json` to change captions, in-points (`in`, seconds into the recording) or durations.
