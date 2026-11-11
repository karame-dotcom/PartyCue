# PartyCue short-form video kit

## Files

| File | What it is |
|---|---|
| `partycue_demo_9x16.mp4` | Finished 32s vertical demo (1080×1920, 30fps). Silent on purpose; add a trending sound in TikTok/Reels/CapCut. |
| `raw-clips/tv-screen.mp4` | Full 80s TV-screen recording (1280×720) for your own edits |
| `raw-clips/phone-screen.mp4` | Full 80s phone-remote recording (390×844), in sync with the TV clip |
| `video-tools/` | Scripts that recorded and assembled the video, so it can be regenerated after UI changes |

### Recording note
YouTube was blocked in the recording environment, so the YouTube pieces were stand-ins:
- the search results and thumbnails are sample data
- the "lyrics" on the TV during singing are a placeholder visual, not a real karaoke video

Everything else is the real app UI: the QR screen, phone remote, queue, Now Singing countdown, AI score, ranking and confetti. The scores came from the built-in fallback scorer. If you want a real karaoke video in the singing shot, screen-record that one moment on your own TV or laptop and swap it in.

## Timeline of `partycue_demo_9x16.mp4`

| Time | On-screen text | Footage |
|---|---|---|
| 0.0–2.6 | You don't need a karaoke machine | TV "Tap to start the party" |
| 2.6–6.0 | STEP 1 · Open PartyCue on any TV | TV with QR code |
| 6.0–8.3 | STEP 2 · Guests scan the QR (no app download) | Phone: typing singer name |
| 8.3–12.8 | STEP 3 · Queue any song from YouTube | Phone: search, then tap Queue |
| 12.8–16.4 | STEP 4 · The TV calls you up | TV: Now Singing countdown |
| 16.4–19.4 | Sing your heart out | TV: song playing |
| 19.4–23.2 | STEP 5 · The AI judge scores you | TV: score 95 + confetti |
| 23.2–25.6 | Then your friend goes next... | TV: Carlo scores 88 |
| 25.6–29.0 | ...and the fight for #1 begins | TV: ranking |
| 29.0–32.4 | PartyCue · Free · No app · Any TV · Link in bio | End card |

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
python3 video-tools/build.py <out-dir> <edit-dir>
```

Edit `scenes.json` to change captions, in-points (`in`, seconds into the recording) or durations.
