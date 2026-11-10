import React, { useEffect, useRef, useState } from 'react';
import { Mic2 } from 'lucide-react';
import { KaraokeSong } from '../types/karaoke';
import { ThemeStageVisuals } from './ThemeStageVisuals';
import { playFanfare } from '../utils/audioEffects';

interface SongIntroScreenProps {
  song: KaraokeSong;
  theme?: string;
  themeBg: string;
  themeGlow: string;
  seconds?: number;
  onDone: () => void;
}

/**
 * Full-screen "Now Singing" title card shown before each song starts.
 * Displays the singer and song over the active TV theme with a countdown,
 * then calls onDone so playback can begin.
 */
export const SongIntroScreen: React.FC<SongIntroScreenProps> = ({
  song,
  theme,
  themeBg,
  themeGlow,
  seconds = 5,
  onDone,
}) => {
  const [count, setCount] = useState(seconds);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setCount(seconds);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const left = seconds - Math.floor((Date.now() - startedAt) / 1000);
      if (left <= 0) {
        clearInterval(timer);
        playFanfare();
        onDoneRef.current();
      } else {
        setCount(left);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [song.id, seconds]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden ${themeBg} animate-in fade-in duration-300`}
    >
      <div className={`absolute inset-0 pointer-events-none ${themeGlow}`} />
      <ThemeStageVisuals theme={theme} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#131b38]/90 border border-sky-400/60 text-sky-300 font-arcade text-xs sm:text-sm uppercase tracking-[0.3em] shadow-lg mb-6">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Now Singing
        </div>

        {song.thumbnailUrl && (
          <img
            src={song.thumbnailUrl}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="w-40 sm:w-56 aspect-video object-cover rounded-2xl border-2 border-sky-400/50 shadow-2xl mb-6"
          />
        )}

        <div className="flex items-center gap-3 text-amber-300 font-arcade font-black text-3xl sm:text-5xl uppercase tracking-wide drop-shadow-[0_0_25px_rgba(251,191,36,0.55)]">
          <Mic2 className="w-8 h-8 sm:w-12 sm:h-12 shrink-0" />
          <span className="break-words">{song.singerName}</span>
        </div>

        <h1 className="mt-4 text-3xl sm:text-6xl font-black font-heading text-white leading-tight line-clamp-2 drop-shadow-[0_0_30px_rgba(56,189,248,0.45)]">
          {song.title}
        </h1>
        {song.author && <div className="mt-2 text-slate-400 text-sm sm:text-lg truncate max-w-xl">{song.author}</div>}

        <div className="mt-10 flex flex-col items-center">
          <div className="text-[11px] sm:text-xs font-arcade uppercase tracking-[0.35em] text-slate-400 mb-2">
            Starting in
          </div>
          <div
            key={count}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-fuchsia-400/80 bg-[#0a0e1e]/80 flex items-center justify-center shadow-[0_0_40px_rgba(217,70,239,0.5)] animate-in zoom-in-50 duration-300"
          >
            <span className="text-6xl sm:text-7xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-br from-sky-300 via-fuchsia-400 to-amber-300">
              {count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
