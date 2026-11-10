import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PerformanceScore } from '../types/karaoke';
import { playFanfare, playApplause } from '../utils/audioEffects';
import { Trophy, Sparkles, Award, Star, FastForward, Bot } from 'lucide-react';

interface AIScoreModalProps {
  score: PerformanceScore | null;
  isOpen: boolean;
  onNextSong: () => void;
  autoAdvanceSeconds?: number;
}

export const AIScoreModal: React.FC<AIScoreModalProps> = ({
  score,
  isOpen,
  onNextSong,
  autoAdvanceSeconds = 8,
}) => {
  const [displayedScore, setDisplayedScore] = useState(0);
  const [countdown, setCountdown] = useState(autoAdvanceSeconds);

  useEffect(() => {
    if (!isOpen || !score) {
      setDisplayedScore(0);
      setCountdown(autoAdvanceSeconds);
      return;
    }

    // Play celebration audio and fire confetti
    playFanfare();
    setTimeout(() => playApplause(), 500);

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#a855f7'],
    });

    // Score count-up animation
    const target = score.score;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplayedScore(target);
        clearInterval(interval);
      } else {
        setDisplayedScore(current);
      }
    }, 25);

    // Countdown to next song
    setCountdown(autoAdvanceSeconds);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          onNextSong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countTimer);
    };
  }, [isOpen, score, autoAdvanceSeconds, onNextSong]);

  if (!isOpen || !score) return null;

  const getScoreGrade = (num: number) => {
    if (num >= 98) return { text: 'S+', color: 'text-amber-400' };
    if (num >= 93) return { text: 'S', color: 'text-fuchsia-400' };
    if (num >= 88) return { text: 'A+', color: 'text-cyan-400' };
    if (num >= 80) return { text: 'A', color: 'text-emerald-400' };
    return { text: 'B+', color: 'text-blue-400' };
  };

  const grade = getScoreGrade(displayedScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-fuchsia-500/70 rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden text-center neon-glow-pink">
        {/* Retro scanline background overlay */}
        <div className="absolute inset-0 crt-overlay opacity-30 pointer-events-none" />

        {/* AI Judge Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/50 text-fuchsia-300 text-xs font-arcade font-bold tracking-widest uppercase mb-4 shadow-md">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>AI Performance Judge</span>
        </div>

        {/* Singer & Song Title */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-black font-heading text-white tracking-wide truncate">
            {score.songTitle}
          </h2>
          <div className="text-sm font-bold text-amber-400 font-arcade mt-1">
            🎤 Performed by {score.singerName}
          </div>
        </div>

        {/* Score Display Area */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 rounded-full bg-slate-950 border-4 border-fuchsia-500/60 flex flex-col items-center justify-center shadow-2xl neon-glow-pink">
            <span className="text-[11px] uppercase tracking-widest font-mono text-cyan-400 font-bold">
              AI SCORE
            </span>
            <div className="text-6xl md:text-7xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-b from-white via-fuchsia-200 to-pink-400 tracking-tighter my-1">
              {displayedScore}
            </div>
            <div className={`text-sm font-extrabold font-arcade tracking-wider ${grade.color}`}>
              GRADE {grade.text}
            </div>
          </div>

          {/* Honorary Title Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border border-amber-400/50 text-amber-300 font-arcade font-bold text-sm tracking-wider uppercase shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{score.rank}</span>
          </div>
        </div>

        {/* AI Judge Critique */}
        <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-cyan-100 text-xs md:text-sm italic leading-relaxed shadow-inner">
          &ldquo;{score.critique}&rdquo;
        </div>

        {/* Breakdown sub-metrics */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Pitch</div>
            <div className="text-base font-bold font-arcade text-emerald-400">{score.pitch}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Energy</div>
            <div className="text-base font-bold font-arcade text-fuchsia-400">{score.energy}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Presence</div>
            <div className="text-base font-bold font-arcade text-cyan-400">{score.stagePresence}%</div>
          </div>
        </div>

        {/* Footer: Countdown & Skip Button */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Next song in {countdown}s</span>
          </div>

          <button
            onClick={onNextSong}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-black font-arcade text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <span>Next Song</span>
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
