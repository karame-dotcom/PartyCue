// Announcer voice for the TV: a bright, high-pitched female voice via the browser's speech engine.

let cachedVoice: SpeechSynthesisVoice | null | undefined;

const FEMALE_HINTS =
  /female|woman|girl|samantha|victoria|karen|moira|tessa|fiona|zira|aria|jenny|sonia|libby|natasha|hazel|susan|serena|allison|ava|joanna|salli|kimberly|ivy|google us english|google uk english female/i;
const MALE_HINTS = /male|man\b|daniel|alex|fred|david|mark|guy|ryan|george|tom\b|aaron|arthur|oliver|james/i;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  try {
    const voices = window.speechSynthesis?.getVoices() || [];
    if (!voices.length) return null; // not loaded yet; try again next time
    const english = voices.filter((v) => /^en/i.test(v.lang));
    cachedVoice =
      english.find((v) => FEMALE_HINTS.test(v.name) && !/\bmale\b/i.test(v.name)) ||
      english.find((v) => !MALE_HINTS.test(v.name)) ||
      english[0] ||
      voices[0] ||
      null;
    return cachedVoice;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = undefined;
      pickVoice();
    };
  } catch {}
}

/** Reveal words one by one when the browser can't speak, so captions still play. */
export function revealOnTimer(text: string, onWord: (i: number) => void, isCancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const starts: number[] = [];
    text.replace(/\S+/g, (_m, idx: number) => {
      starts.push(idx);
      return '';
    });
    let i = 0;
    const step = () => {
      if (isCancelled()) return resolve();
      if (i >= starts.length) {
        onWord(text.length);
        return resolve();
      }
      onWord(starts[i++]);
      setTimeout(step, 330);
    };
    step();
  });
}

/**
 * Speak a line in the announcer voice. onWord gets the character index of the word being said
 * (text.length when finished). Resolves when done, with a timer fallback if speech is blocked.
 */
export function speak(
  text: string,
  onWord: (charIndex: number) => void = () => {}
): { done: Promise<void>; cancel: () => void } {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const done = new Promise<void>((resolve) => {
    const finish = () => {
      if (timer) clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(finish, Math.max(2500, text.split(/\s+/).length * 420) + 4000);
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted || cancelled) return;
      fallbackStarted = true;
      revealOnTimer(text, onWord, () => cancelled).then(finish);
    };
    try {
      const synth = window.speechSynthesis;
      if (!synth) throw new Error('no speech');
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.7; // high, bright "girl" announcer
      u.volume = 1;
      const voice = pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.onboundary = (e) => {
        if (!cancelled) onWord(e.charIndex);
      };
      u.onend = () => {
        if (!cancelled) onWord(text.length);
        finish();
      };
      // Speech refused or failed (e.g. no tap yet): still show the caption at reading speed
      u.onerror = fallback;
      synth.speak(u);
      // If the browser refuses to speak (no tap yet), still play the caption on a timer
      setTimeout(() => {
        if (!synth.speaking && !synth.pending) fallback();
      }, 700);
    } catch {
      fallback();
    }
  });
  return {
    done,
    cancel: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    },
  };
}

/** Make a YouTube title sound natural when read aloud: drop "(Karaoke)", "[Lyrics]", channel tags, etc. */
export function speakableTitle(title: string): string {
  let t = title
    .replace(/[([{][^)\]}]*(karaoke|lyrics?|instrumental|version|minus one|official|video|audio|hd|4k)[^)\]}]*[)\]}]/gi, ' ')
    .replace(/\b(karaoke( version)?|with lyrics|lyrics|instrumental|minus one|official (music )?video)\b/gi, ' ')
    .replace(/\s*[|•]\s*.*$/, ' ')
    .replace(/\s*-\s*(?=-|$)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
  return t || title;
}
