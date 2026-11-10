import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { AIScoreResult } from '../utils/aiScoring';
import { KaraokeSong, LeaderboardEntry, PerformanceScore } from '../types/karaoke';
import { playApplause, playFanfare } from '../utils/audioEffects';
import {
  Trophy,
  Sparkles,
  Mic2,
  Star,
  FastForward,
  Bot,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Users,
  Radio,
  ChevronRight,
} from 'lucide-react';

interface AIScoreScreenProps {
  song: KaraokeSong;
  scoreResult: AIScoreResult | PerformanceScore;
  leaderboard?: LeaderboardEntry[];
  onComplete: () => void;
  durationSeconds?: number;
}

export const AIScoreScreen: React.FC<AIScoreScreenProps> = ({
  song,
  scoreResult,
  leaderboard = [],
  onComplete,
  durationSeconds = 12,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [stage, setStage] = useState<1 | 2>(1);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Extract rank change details if provided
  const rankChange = (scoreResult as PerformanceScore).rankChange;
  const crowdScore = (scoreResult as PerformanceScore).crowdScore;
  const voteCount = (scoreResult as PerformanceScore).voteCount;
  const micScore = (scoreResult as PerformanceScore).micScore;
  const pitchVal = 'pitch' in scoreResult ? scoreResult.pitch : (scoreResult as AIScoreResult).pitchRating;
  const energyVal = 'energy' in scoreResult ? scoreResult.energy : (scoreResult as AIScoreResult).energyRating;
  const critiqueText = 'critique' in scoreResult ? scoreResult.critique : (scoreResult as AIScoreResult).comment;

  // Grade color helper
  const getGrade = (score: number) => {
    if (score >= 98) return { label: 'S+ LEGENDARY', color: 'text-amber-300 border-amber-400 bg-amber-950/80 neon-glow-amber' };
    if (score >= 94) return { label: 'S SUPERSTAR', color: 'text-fuchsia-300 border-fuchsia-400 bg-fuchsia-950/80 neon-glow-pink' };
    if (score >= 89) return { label: 'A+ CROWD PLEASER', color: 'text-cyan-300 border-cyan-400 bg-cyan-950/80 neon-glow-cyan' };
    if (score >= 84) return { label: 'A CERTIFIED BANGER', color: 'text-emerald-300 border-emerald-400 bg-emerald-950/80' };
    return { label: 'B+ PARTY ANIMAL', color: 'text-purple-300 border-purple-400 bg-purple-950/80' };
  };

  const gradeInfo = getGrade(scoreResult.score);

  // Compute current singer rank from leaderboard if present
  const currentRankIndex = leaderboard.findIndex(
    (entry) =>
      entry.singerName.toLowerCase() === song.singerName.toLowerCase() &&
      Math.abs(entry.score - scoreResult.score) < 1
  );
  const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : (rankChange?.toRank || null);

  useEffect(() => {
    // Initial celebration
    playApplause();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#a855f7'],
    });

    // Score counter animation
    const startTime = Date.now();
    const animDuration = 1400;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * scoreResult.score));

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 25);

    // Switch to Stage 2 (Ranking Update) halfway through
    const stage2Timer = setTimeout(() => {
      setStage(2);
      playFanfare();
      confetti({
        particleCount: 160,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#fbbf24', '#38bdf8', '#f43f5e', '#a855f7'],
      });
    }, 5500);

    // Countdown timer for automatic transition
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(stage2Timer);
      clearInterval(countdown);
    };
  }, [scoreResult.score, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#070a14]/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-4xl bg-[#0e142a] border-2 border-sky-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden my-auto">
        {/* Stage Progress Indicator & Mode Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1b2548]">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131b38] border border-sky-400/50 text-sky-300 font-arcade text-xs uppercase tracking-widest shadow-lg">
              <Bot className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>COMPETITION KARAOKE</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>

            {/* 2-Stage Step Pills */}
            <div className="flex items-center gap-1.5 bg-[#0a0e1e] px-2 py-1 rounded-full border border-[#1d274d] text-[10px] font-arcade font-bold">
              <button
                onClick={() => setStage(1)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  stage === 1 ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Score Breakdown
              </button>
              <span className="text-slate-600">➔</span>
              <button
                onClick={() => setStage(2)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  stage === 2 ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Ranking Update 🏆
              </button>
            </div>
          </div>

          {currentRank && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-arcade text-xs uppercase font-bold tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Party Rank #{currentRank}</span>
            </div>
          )}
        </div>

        {/* Singer and Track Name */}
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 text-amber-400 font-arcade font-bold text-sm uppercase tracking-wider mb-0.5">
            <Mic2 className="w-4 h-4" />
            <span>Performer: {song.singerName}</span>
          </div>
          <h2 className="text-lg md:text-2xl font-black font-heading text-white truncate max-w-xl mx-auto">
            {song.title}
          </h2>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: SCORE & DETAILED PERFORMANCE BREAKDOWN (FIRST 5.5s) */}
        {/* ========================================================================= */}
        {stage === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Left Column: Big Neon Score Dial */}
              <div className="md:col-span-5 bg-[#0a0e1e] border border-sky-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#070a14] border-4 border-amber-400/80 flex flex-col items-center justify-center shadow-2xl shrink-0 my-2">
                  <div className="absolute -top-3">
                    <Trophy className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow" />
                  </div>
                  <div className="text-5xl sm:text-6xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-500 tracking-tight">
                    {animatedScore}
                  </div>
                  <div className="text-[10px] font-mono text-amber-300/80 uppercase tracking-widest font-bold mt-1">
                    OUT OF 100
                  </div>
                </div>

                <div className={`mt-2 px-4 py-1.5 rounded-full border-2 text-xs font-black font-arcade uppercase tracking-widest ${gradeInfo.color}`}>
                  {gradeInfo.label}
                </div>
              </div>

              {/* Right Column: 4-Item Breakdown + Critique */}
              <div className="md:col-span-7 bg-[#0a0e1e] border border-sky-500/30 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-arcade font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Performance Breakdown</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Audience Crowd Votes */}
                    <div className="p-2.5 rounded-xl bg-[#111730] border border-sky-500/30">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-sky-400" />
                          <span>Audience Vote</span>
                        </span>
                        {voteCount ? (
                          <span className="text-[9px] text-sky-400 font-bold">{voteCount} votes</span>
                        ) : null}
                      </div>
                      <div className="text-lg font-black font-arcade text-sky-300 mt-1">
                        {crowdScore ? `${crowdScore}%` : '94% (Live)'}
                      </div>
                    </div>

                    {/* Microphone Pitch Detector */}
                    <div className="p-2.5 rounded-xl bg-[#111730] border border-sky-500/30">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-400" />
                          <span>Tune / Pitch</span>
                        </span>
                        {micScore ? (
                          <span className="text-[9px] text-emerald-400 font-bold">Host Mic</span>
                        ) : null}
                      </div>
                      <div className="text-lg font-black font-arcade text-emerald-300 mt-1">
                        {micScore ? `${micScore}%` : `${pitchVal || 89}%`}
                      </div>
                    </div>

                    {/* Stage Energy */}
                    <div className="p-2.5 rounded-xl bg-[#111730] border border-sky-500/30">
                      <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Stage Energy</span>
                      </div>
                      <div className="text-lg font-black font-arcade text-amber-300 mt-1">
                        {energyVal || 96}%
                      </div>
                    </div>

                    {/* Passion */}
                    <div className="p-2.5 rounded-xl bg-[#111730] border border-sky-500/30">
                      <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                        <Star className="w-3 h-3 text-fuchsia-400" />
                        <span>Vocal Passion</span>
                      </div>
                      <div className="text-lg font-black font-arcade text-fuchsia-300 mt-1">
                        100%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Critique */}
                <div className="bg-[#111730] border border-sky-400/30 rounded-xl p-3 mt-3">
                  <div className="text-[10px] font-mono uppercase text-sky-300 font-bold tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>AI Judge Critique</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-sky-100 italic leading-relaxed">
                    &ldquo;{critiqueText}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 1 Progress Banner to Stage 2 */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-950/60 via-[#101735] to-amber-950/60 border border-sky-400/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-arcade text-sky-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Revealing Party Ranking Update & Top 5 in moments...</span>
              </div>
              <button
                onClick={() => setStage(2)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-arcade tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>Show Ranking</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: DRAMATIC RANKING UPDATE & HALL OF FAME LEADERBOARD (NEXT 5.5s) */}
        {/* ========================================================================= */}
        {stage === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            {/* Dramatic Ranking Banner: Level Up / Rank Held / New Entry */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-[#131b38] to-amber-500/25 border-2 border-amber-400/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                  {rankChange?.direction === 'up' ? (
                    <ArrowUp className="w-7 h-7 text-emerald-400 animate-bounce" />
                  ) : rankChange?.direction === 'down' ? (
                    <ArrowDown className="w-7 h-7 text-rose-400" />
                  ) : rankChange?.direction === 'same' ? (
                    <Minus className="w-7 h-7 text-amber-400" />
                  ) : (
                    <Trophy className="w-7 h-7 text-amber-400 animate-pulse" />
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                    OFFICIAL RANKING MOVEMENT
                  </div>
                  <div className="text-base sm:text-lg font-black font-arcade text-white tracking-wide">
                    {rankChange?.message || `🔥 ${song.singerName} secured Rank #${currentRank || 1} on the board!`}
                  </div>
                </div>
              </div>

              {/* Previous vs New Rank Pill */}
              <div className="flex items-center gap-2 bg-[#090d1c] px-3.5 py-2 rounded-xl border border-amber-400/50 shrink-0">
                <div className="text-center">
                  <div className="text-[9px] font-mono text-slate-400 uppercase">Previous</div>
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {rankChange?.fromRank ? `#${rankChange.fromRank}` : 'Unranked'}
                  </div>
                </div>
                <span className="text-amber-400 font-bold text-sm">➔</span>
                <div className="text-center">
                  <div className="text-[9px] font-mono text-amber-300 uppercase">Current</div>
                  <div className="text-sm font-arcade font-black text-amber-400">
                    #{currentRank || 1} 🏆
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Singers Hall of Fame */}
            <div className="bg-[#0a0e1e] border border-amber-500/30 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1b2548]">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-arcade text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Top 5 Singers Hall of Fame
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Synced Live Across Phones</span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  <Flame className="w-6 h-6 text-amber-400/50 mx-auto mb-2 animate-bounce" />
                  {song.singerName} is the first singer to establish the party high score!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, idx) => {
                    const isCurrent =
                      entry.singerName.toLowerCase() === song.singerName.toLowerCase() &&
                      Math.abs(entry.score - scoreResult.score) < 1;

                    const medalIcons = ['🥇', '🥈', '🥉', '4', '5'];
                    const medalColors = [
                      'text-amber-300 bg-amber-500/20 border-amber-400/40',
                      'text-slate-300 bg-slate-500/20 border-slate-400/40',
                      'text-amber-600 bg-amber-700/20 border-amber-600/40',
                      'text-sky-300 bg-sky-950/40 border-sky-800/40',
                      'text-sky-300 bg-sky-950/40 border-sky-800/40',
                    ];

                    return (
                      <div
                        key={`${entry.singerName}-${idx}`}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                          isCurrent
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/50 scale-[1.02]'
                            : 'bg-[#101732] border-[#1d274d] text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black font-arcade shrink-0 ${
                              medalColors[idx] || 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {medalIcons[idx]}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-xs flex items-center gap-1.5">
                              <span>{entry.singerName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded uppercase">
                                  JUST SANG
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
                              {entry.songTitle}
                            </div>
                          </div>
                        </div>

                        <div className="font-arcade font-bold text-amber-300 text-base shrink-0">
                          {entry.score} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transition Countdown Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-4 border-t border-[#1b2548]">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Next song starting in {timeLeft}s...</span>
          </div>

          <div className="flex items-center gap-2">
            {stage === 1 && (
              <button
                onClick={() => setStage(2)}
                className="px-3 py-1.5 rounded-xl bg-[#141c38] hover:bg-[#1a254a] text-amber-300 font-bold font-arcade text-xs uppercase tracking-wider border border-[#232f58] transition-all"
              >
                Ranking Update ➔
              </button>
            )}

            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold font-arcade text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <span>Play Next Song Now</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
