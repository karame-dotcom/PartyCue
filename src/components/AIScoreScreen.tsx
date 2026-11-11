import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AIScoreResult } from '../utils/aiScoring';
import { KaraokeSong, LeaderboardEntry, PerformanceScore } from '../types/karaoke';
import { playApplause, playFanfare } from '../utils/audioEffects';

interface AIScoreScreenProps {
  song: KaraokeSong;
  scoreResult: AIScoreResult | PerformanceScore;
  leaderboard?: LeaderboardEntry[];
  onComplete: () => void;
  /** Minimum seconds each stage (score, ranking) stays on screen. */
  durationSeconds?: number;
}

const COMPLIMENTS = [
  'Wow {name}, you are an amazing singer!',
  'If you were a pop star, I would definitely be your biggest fan!',
  '{name}, that voice gave me goosebumps!',
  'Somebody call the record label, {name} is ready!',
  'That was a concert, not karaoke! Incredible, {name}!',
  'The whole room is in love with your voice, {name}!',
  'Encore! Encore! {name}, that was pure magic!',
  'You just turned this party into a sold-out show!',
  '{name}, you sing like the radio is jealous of you!',
  'I would buy a ticket to hear that again, {name}!',
];

const ordinalTop = (n: number) => `top ${n}`;

/** Speak a line with the browser's voice. Resolves when finished (or after a timeout fallback). */
function speak(text: string, onWord: (charIndex: number) => void): { done: Promise<void>; cancel: () => void } {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const done = new Promise<void>((resolve) => {
    const fallbackMs = Math.max(2500, text.split(/\s+/).length * 380);
    const finish = () => {
      if (timer) clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(finish, fallbackMs + 4000);
    try {
      const synth = window.speechSynthesis;
      if (!synth) throw new Error('no speech');
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1.1;
      u.volume = 1;
      const voices = synth.getVoices();
      const preferred =
        voices.find((v) => /en/i.test(v.lang) && /female|samantha|google us|zira|aria|jenny/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (preferred) u.voice = preferred;
      u.onboundary = (e) => {
        if (!cancelled) onWord(e.charIndex);
      };
      u.onend = () => {
        if (!cancelled) onWord(text.length);
        finish();
      };
      u.onerror = () => {
        onWord(text.length);
        finish();
      };
      synth.speak(u);
      // If the browser refuses to speak (no user interaction yet), reveal the caption on a timer
      setTimeout(() => {
        if (!cancelled && !synth.speaking && !synth.pending) {
          revealOnTimer(text, onWord, () => cancelled).then(finish);
        }
      }, 700);
    } catch {
      revealOnTimer(text, onWord, () => cancelled).then(finish);
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

function revealOnTimer(text: string, onWord: (i: number) => void, isCancelled: () => boolean): Promise<void> {
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

/** Caption that highlights words as they are spoken. */
const Caption: React.FC<{ text: string; spokenTo: number }> = ({ text, spokenTo }) => {
  const parts = text.split(/(\s+)/);
  let pos = 0;
  return (
    <p className="max-w-4xl text-center text-2xl sm:text-4xl font-bold leading-snug px-4">
      {parts.map((part, i) => {
        const start = pos;
        pos += part.length;
        if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
        const said = start <= spokenTo;
        return (
          <span
            key={i}
            className={`transition-colors duration-200 ${said ? 'text-white drop-shadow-[0_0_18px_rgba(56,189,248,0.6)]' : 'text-slate-600'}`}
          >
            {part}
          </span>
        );
      })}
    </p>
  );
};

export const AIScoreScreen: React.FC<AIScoreScreenProps> = ({
  song,
  scoreResult,
  leaderboard = [],
  onComplete,
  durationSeconds = 5,
}) => {
  const [stage, setStage] = useState<1 | 2>(1);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [spokenTo, setSpokenTo] = useState(-1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const name = song.singerName || 'Superstar';
  const score = Math.round(scoreResult.score);

  const compliment = useMemo(
    () => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)].replace(/\{name\}/g, name),
    // one compliment per performance
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [song.id]
  );

  // Ranking: make sure this singer is in the list even if the room update hasn't arrived yet
  const ranking = useMemo(() => {
    const key = name.trim().toLowerCase();
    const list = leaderboard.map((e) => ({ name: e.singerName, score: e.score }));
    const idx = list.findIndex((e) => e.name.trim().toLowerCase() === key);
    if (idx === -1) list.push({ name, score });
    else if (list[idx].score < score) list[idx] = { name: list[idx].name, score };
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [leaderboard, name, score]);
  const myRank = ranking.findIndex((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()) + 1;

  const rankLine =
    myRank === 1
      ? `${name}, you are now the top 1! You are the karaoke champion!`
      : `${name}, you are now ${ordinalTop(myRank)}! Keep singing to reach number one!`;

  useEffect(() => {
    let alive = true;
    let current: { cancel: () => void } | null = null;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    playApplause();
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.55 }, colors: ['#f59e0b', '#ec4899', '#06b6d4', '#a855f7'] });

    // Count the score up
    const start = Date.now();
    const anim = setInterval(() => {
      const p = Math.min((Date.now() - start) / 1400, 1);
      setAnimatedScore(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p >= 1) clearInterval(anim);
    }, 25);

    (async () => {
      // Stage 1: score + compliment
      await wait(1500);
      if (!alive) return;
      const stage1Start = Date.now();
      const s1 = speak(compliment, setSpokenTo);
      current = s1;
      await s1.done;
      await wait(Math.max(800, durationSeconds * 1000 - (Date.now() - stage1Start)));
      if (!alive) return;

      // Stage 2: ranking + announcement
      setStage(2);
      setSpokenTo(-1);
      playFanfare();
      if (myRank === 1) {
        confetti({ particleCount: 160, spread: 120, origin: { y: 0.4 }, colors: ['#fbbf24', '#38bdf8', '#f43f5e'] });
      }
      await wait(600);
      if (!alive) return;
      const stage2Start = Date.now();
      const s2 = speak(rankLine, setSpokenTo);
      current = s2;
      await s2.done;
      await wait(Math.max(1200, durationSeconds * 1000 - (Date.now() - stage2Start)));
      if (alive) onCompleteRef.current();
    })();

    return () => {
      alive = false;
      clearInterval(anim);
      current?.cancel();
    };
    // run once per performance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070a14]/95 backdrop-blur-xl overflow-hidden animate-in fade-in duration-300 cursor-pointer"
      onClick={() => {
        // Clicking anywhere lets the browser speak if it was waiting for an interaction
        try {
          window.speechSynthesis?.resume();
        } catch {}
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {stage === 1 && (
        <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-amber-300 font-arcade font-black text-2xl sm:text-4xl uppercase tracking-widest">
            🎤 {name}
          </div>
          <div className="text-[9rem] sm:text-[13rem] leading-none font-black font-arcade text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-pink-500 drop-shadow-[0_0_40px_rgba(251,191,36,0.35)]">
            {animatedScore}
          </div>
          <Caption text={compliment} spokenTo={spokenTo} />
        </div>
      )}

      {stage === 2 && (
        <div className="relative z-10 w-full flex flex-col items-center gap-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="font-heading font-black text-3xl sm:text-5xl text-white tracking-wide">🏆 Ranking</div>
          <ol className="w-full max-w-xl max-h-[50vh] overflow-y-auto space-y-2 text-xl sm:text-3xl font-bold">
            {ranking.map((e, i) => {
              const me = i + 1 === myRank;
              return (
                <li
                  key={`${e.name}-${i}`}
                  className={`flex items-center gap-4 px-5 py-3 rounded-2xl border ${
                    me ? 'bg-amber-500/20 border-amber-400 text-amber-200 scale-[1.03]' : 'bg-[#0e142a] border-[#1b2548] text-slate-200'
                  }`}
                >
                  <span className="w-10 font-arcade">{i + 1}.</span>
                  <span className="flex-1 truncate">{e.name}</span>
                  <span className="font-arcade text-amber-300">{e.score}</span>
                </li>
              );
            })}
          </ol>
          <Caption text={rankLine} spokenTo={spokenTo} />
        </div>
      )}
    </div>
  );
};
