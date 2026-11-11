import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { YouTubePlayer } from './YouTubePlayer';
import { QRCodeCard } from './QRCodeCard';
import { FirebaseModal } from './FirebaseModal';
import { AIScoreScreen } from './AIScoreScreen';
import { PartyEffectsOverlay } from './PartyEffectsOverlay';
import { ThemeStageVisuals } from './ThemeStageVisuals';
import { SongIntroScreen } from './SongIntroScreen';
import { useKaraokeRoom } from '../hooks/useKaraokeRoom';
import { useTopHits } from '../hooks/useTopHits';
import { playAirhorn, playApplause, playFanfare } from '../utils/audioEffects';
import { generateKaraokeScore, AIScoreResult } from '../utils/aiScoring';
import { KaraokeSong } from '../types/karaoke';
import {
  SkipForward,
  Sparkles,
  Maximize2,
  Minimize2,
  Disc3,
  Flame,
  Clock,
  Mic2,
  Smartphone,
  Eye,
  Bot,
  History,
  Star,
  RotateCcw,
  X,
  Plus,
  ChevronUp,
  ChevronDown,
  FastForward,
} from 'lucide-react';

interface HostScreenProps {
  roomId: string;
}

export const HostScreen: React.FC<HostScreenProps> = ({ roomId }) => {
  const {
    roomState,
    isConnected,
    firebaseActive,
    addSong,
    skipSong,
    replaySong,
    deleteSong,
    reorderQueue,
    updatePlayback,
    triggerPartyEffect,
    clearQueue,
    clearHistory,
  } = useKaraokeRoom(roomId, true);

  const { topHits, toggleStar, isStarred } = useTopHits();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoFullscreen, setAutoFullscreen] = useState<boolean>(() => {
    return localStorage.getItem('karaoke_auto_fullscreen') === 'true';
  });
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [discoMode, setDiscoMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // AI Scoring Overlay State
  const [scoringData, setScoringData] = useState<{
    song: KaraokeSong;
    scoreResult: any;
  } | null>(null);

  // Casual Mode Up Next Screen State (Skips scoring when competitionMode is false)
  const [casualUpNextData, setCasualUpNextData] = useState<{
    justFinishedSong: KaraokeSong;
    nextSong: KaraokeSong | null;
  } | null>(null);

  // Automated 1-Minute Queue Ticker State (auto-fades after 8 seconds)
  const [showNextTicker, setShowNextTicker] = useState(false);
  const tickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Absolute remote link for QR code (points to guest view of this room)
  const remoteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}&role=guest`;

  const currentSong = roomState?.currentSong || null;
  const queue = roomState?.queue || [];
  const nextSong = queue.length > 0 ? queue[0] : null;
  const previousSongs = roomState?.history || [];

  // "Now Singing" intro card with countdown before each new song starts playing.
  // Derived synchronously so the very first render of a new song already holds playback.
  const [introDoneId, setIntroDoneId] = useState<string | null>(null);
  const showIntro = !!currentSong && introDoneId !== currentSong.id;

  // Auto-Fullscreen on song start
  useEffect(() => {
    if (autoFullscreen && currentSong?.id && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  }, [currentSong?.id, autoFullscreen]);

  const toggleAutoFullscreen = () => {
    setAutoFullscreen((prev) => {
      const next = !prev;
      localStorage.setItem('karaoke_auto_fullscreen', String(next));
      if (next && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
      return next;
    });
  };

  // Auto-advance casual Up Next screen after 3.8s
  useEffect(() => {
    if (!casualUpNextData) return;
    const timer = setTimeout(() => {
      setCasualUpNextData(null);
      skipSong();
    }, 3800);
    return () => clearTimeout(timer);
  }, [casualUpNextData, skipSong]);

  // Handle Song Ended -> Trigger AI Scoring Overlay (Competition) OR Up Next Card (Casual)
  const handleSongEnded = async () => {
    if (!currentSong) {
      skipSong();
      return;
    }

    const isCompetition = roomState?.competitionMode !== false;

    if (isCompetition) {
      try {
        const res = await fetch('/api/evaluate-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songTitle: currentSong.title,
            author: currentSong.author,
            singerName: currentSong.singerName,
            roomId,
          }),
        });
        const data = await res.json();
        if (data.score) {
          setScoringData({
            song: currentSong,
            scoreResult: data.score,
          });
          return;
        }
      } catch (err) {
        console.warn('Scoring API error, falling back:', err);
      }

      // Procedural fallback
      const fallbackResult = generateKaraokeScore(currentSong.singerName, currentSong.title);
      setScoringData({
        song: currentSong,
        scoreResult: fallbackResult,
      });
    } else {
      // Casual Party Mode: Announce next singer directly without scoring
      playApplause();
      setCasualUpNextData({
        justFinishedSong: currentSong,
        nextSong: queue.length > 0 ? queue[0] : null,
      });
    }
  };

  // Remote host pressed "AI Score": end the current song and show its score on the TV
  const lastScoreRequestRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    const req = roomState?.scoreRequest ?? null;
    if (lastScoreRequestRef.current === undefined) {
      // ignore whatever value was already there when the TV loaded
      if (roomState) lastScoreRequestRef.current = req;
      return;
    }
    if (req && req !== lastScoreRequestRef.current) {
      lastScoreRequestRef.current = req;
      if (currentSong && !scoringData && !casualUpNextData) handleSongEnded();
    }
  }, [roomState?.scoreRequest, roomState]);

  const handleScoreComplete = () => {
    setScoringData(null);
    skipSong(); // Automatically transitions to next queued song
  };

  // Listen to incoming party effects broadcasted to room
  useEffect(() => {
    if (!roomState?.partyEffect) return;
    const { type } = roomState.partyEffect;

    if (type === 'airhorn') {
      playAirhorn();
    } else if (type === 'applause') {
      playApplause();
    } else if (type === 'cheer' || type === 'confetti') {
      playFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#06b6d4', '#f59e0b', '#a855f7'],
      });
    } else if (type === 'disco') {
      setDiscoMode((prev) => !prev);
    }
  }, [roomState?.partyEffect?.timestamp]);

  const triggerConfetti = () => {
    triggerPartyEffect('confetti');
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRequeueSong = async (song: KaraokeSong) => {
    try {
      await addSong({
        videoId: song.videoId,
        title: song.title,
        author: song.author,
        thumbnailUrl: song.thumbnailUrl,
        singerName: song.singerName,
      });
    } catch (err) {
      console.warn('Failed re-queuing song:', err);
    }
  };

  // Dynamic TV screen background theme
  const getTvThemeStyles = (theme?: string) => {
    switch (theme) {
      case 'neon-tokyo':
        return {
          bg: 'bg-[#0d071a]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(236,72,153,0.35),transparent_70%)]',
        };
      case 'disco-club':
        return {
          bg: 'bg-[#180a22]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.3),transparent_70%)]',
        };
      case 'starlight':
        return {
          bg: 'bg-[#060a1e]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.35),transparent_70%)]',
        };
      case 'cyber-matrix':
        return {
          bg: 'bg-[#041210]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.3),transparent_70%)]',
        };
      case 'sunset-lounge':
        return {
          bg: 'bg-[#160a14]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.3),transparent_70%)]',
        };
      case 'midnight':
      default:
        return {
          bg: 'bg-[#0b0f1d]',
          glow: 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,38,78,0.35),transparent_70%)]',
        };
    }
  };

  const themeStyle = getTvThemeStyles(roomState?.tvBackground);

  return (
    <div
      className={`h-full flex-1 overflow-hidden ${themeStyle.bg} text-slate-100 flex flex-col relative transition-colors duration-700 selection:bg-sky-500 selection:text-white ${
        discoMode ? 'animate-pulse-glow' : ''
      }`}
    >
      {/* Visual Party Effects Overlay (Airhorn screen-shake, Applause bubbles, Cheer fanfare) */}
      <PartyEffectsOverlay effect={roomState?.partyEffect} />

      {/* Disco Strobe Overlay */}
      {discoMode && (
        <div className="fixed inset-0 pointer-events-none z-40 bg-gradient-to-r from-sky-600/10 via-indigo-500/10 to-blue-500/10 mix-blend-overlay animate-pulse" />
      )}

      {/* Subtle background stage spotlight radial glow */}
      <div className={`fixed inset-0 pointer-events-none z-0 ${themeStyle.glow} transition-all duration-700`} />

      {/* Dynamic Animated Theme Visuals (Lasers, Shooting Stars, Disco Beams, Bubbles, Matrix) */}
      <ThemeStageVisuals theme={roomState?.tvBackground} />

      {/* Main Content Layout (Viewport consumed without scrolling) */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 p-2 lg:px-4 lg:py-2 w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* Stage Section: Occupies ~78-80% of screen width */}
        <section className="w-full lg:w-[77%] xl:w-[79%] 2xl:w-[81%] flex flex-col justify-center gap-2 min-w-0 min-h-0 relative overflow-hidden">
          {/* Subtle Non-Intrusive 1-Minute Queue Ticker */}
          {showNextTicker && nextSong && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 pointer-events-auto">
              <div className="px-4 py-1.5 rounded-full bg-[#0f162e]/95 border border-sky-400/60 text-slate-200 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span className="font-arcade uppercase font-black tracking-widest text-sky-400 text-[11px]">
                  UP NEXT:
                </span>
                <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
                  {nextSong.title}
                </span>
                <span className="font-mono text-sky-300 font-bold shrink-0">
                  (🎤 {nextSong.singerName})
                </span>
              </div>
            </div>
          )}

          {/* 1. YouTube Player with Integrated Compact Now Singing & Controls Bar */}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-center">
            <YouTubePlayer
              currentSong={currentSong}
              holdPlayback={showIntro}
              onEnded={handleSongEnded}
              onSkip={skipSong}
              onReplay={replaySong}
              onTimeUpdate={(cur, dur) => {
                setCurrentTime(cur);
                setDuration(dur);
              }}
              isHostAdmin={true}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              isStarred={currentSong ? isStarred(currentSong.videoId) : false}
              onToggleStar={() => {
                if (currentSong) {
                  toggleStar({
                    videoId: currentSong.videoId,
                    title: currentSong.title,
                    author: currentSong.author,
                    thumbnailUrl: currentSong.thumbnailUrl,
                    singerSuggestion: currentSong.singerName,
                  });
                }
              }}
            />
          </div>
        </section>

        {/* Right Sidebar: QR Code Card & Up Next Queue List */}
        <aside className="w-full lg:w-[23%] xl:w-[21%] 2xl:w-[19%] flex flex-col gap-2 shrink-0 min-h-0 h-full overflow-hidden">
          {/* Scannable QR Code Card for Guests */}
          <div className="shrink-0">
            <QRCodeCard roomId={roomId} remoteUrl={remoteUrl} />
          </div>

          {/* UP NEXT QUEUE LIST (Replaces Host Deck, Fits Viewport, Independently Scrollable) */}
          <div className="bg-[#0e142a] border border-[#1b2548] rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Queue Header & Live Counter */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1c264a] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-sm">🎵</span>
                <div>
                  <h3 className="font-heading font-black text-xs text-white tracking-wider uppercase">
                    UP NEXT QUEUE
                  </h3>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="text-sky-400 font-bold">{queue.length} in line</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                      <span>{isConnected ? 'Live' : 'Connecting'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Soundboard Reaction Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    playAirhorn();
                    triggerPartyEffect('airhorn', 'DJ');
                  }}
                  className="p-1 rounded-md bg-[#141c38] hover:bg-[#1a254a] border border-[#232f58] text-xs transition-transform active:scale-95"
                  title="Airhorn sound & screen shake"
                >
                  📢
                </button>
                <button
                  onClick={() => {
                    playApplause();
                    triggerPartyEffect('applause', 'Crowd');
                  }}
                  className="p-1 rounded-md bg-[#141c38] hover:bg-[#1a254a] border border-[#232f58] text-xs transition-transform active:scale-95"
                  title="Crowd applause"
                >
                  👏
                </button>
                <button
                  onClick={triggerConfetti}
                  className="p-1 rounded-md bg-[#141c38] hover:bg-[#1a254a] border border-[#232f58] text-xs transition-transform active:scale-95"
                  title="Confetti fanfare burst"
                >
                  🎉
                </button>
              </div>
            </div>

            {/* Next Songs Queue List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-2">
              {queue.length === 0 ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[#0a0d1a]/60 border border-dashed border-[#1c264a]">
                  <span className="text-xl mb-1.5">🎤</span>
                  <div className="text-xs font-semibold text-slate-300 mb-0.5">Queue is empty</div>
                  <div className="text-[10px] text-slate-500 leading-snug">
                    Scan the QR code above to queue any YouTube song!
                  </div>
                </div>
              ) : (
                queue.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      idx === 0
                        ? 'bg-[#131c3b] border-sky-500/80 shadow-md'
                        : 'bg-[#10162f] border-[#1c264a] hover:border-[#283868]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Position Badge */}
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                          idx === 0
                            ? 'bg-sky-500 text-white font-black'
                            : 'bg-[#1a2344] text-slate-400 border border-[#26325a]'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Thumbnail */}
                      <img
                        src={song.thumbnailUrl}
                        alt=""
                        className="w-9 h-7 rounded object-cover border border-[#232f58] shrink-0"
                      />

                      {/* Song Details */}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[160px]">
                          {song.title}
                        </div>
                        <div className={`text-[10px] font-mono truncate ${idx === 0 ? 'text-sky-300' : 'text-slate-400'}`}>
                          🎤 {song.singerName}
                        </div>
                      </div>
                    </div>

                    {/* Move & Delete Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {idx > 0 && (
                        <button
                          onClick={() => reorderQueue(idx, idx - 1)}
                          className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-[#1a254d] transition-colors"
                          title="Move song up in queue"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < queue.length - 1 && (
                        <button
                          onClick={() => reorderQueue(idx, idx + 1)}
                          className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-[#1a254d] transition-colors"
                          title="Move song down in queue"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSong(song.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Remove song from queue"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </aside>
      </main>

      {/* Now Singing intro: singer + song over the TV theme, 5s countdown, then playback starts */}
      {showIntro && currentSong && !scoringData && (
        <SongIntroScreen
          song={currentSong}
          theme={roomState?.tvBackground}
          themeBg={themeStyle.bg}
          themeGlow={themeStyle.glow}
          seconds={5}
          onDone={() => setIntroDoneId(currentSong.id)}
        />
      )}

      {/* Score screen: big score + spoken compliment, then full ranking + spoken rank */}
      {scoringData && (
        <AIScoreScreen
          song={scoringData.song}
          scoreResult={scoringData.scoreResult}
          leaderboard={roomState?.leaderboard || []}
          onComplete={handleScoreComplete}
          durationSeconds={5}
        />
      )}

      {/* Casual Party Mode (Non-Competition) Up Next Announcement Card (3.5s auto-transition) */}
      {casualUpNextData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070a14]/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0e142a] border-2 border-sky-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-arcade text-xs font-bold uppercase tracking-wider">
              <span>👏 GREAT PERFORMANCE!</span>
            </div>

            <div>
              <div className="text-sm font-arcade text-slate-300">
                You rocked that song, <span className="text-white font-bold">{casualUpNextData.justFinishedSong.singerName}</span>!
              </div>
              <div className="text-xs text-slate-400 italic mt-0.5">
                &ldquo;{casualUpNextData.justFinishedSong.title}&rdquo;
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#131b38] border border-sky-500/40 space-y-1.5">
              <div className="text-[10px] font-arcade uppercase tracking-widest text-sky-400 font-bold">
                UP NEXT ON STAGE:
              </div>
              {casualUpNextData.nextSong ? (
                <>
                  <div className="text-lg font-black font-heading text-white truncate">
                    {casualUpNextData.nextSong.title}
                  </div>
                  <div className="text-sm font-arcade text-amber-300 font-bold">
                    🎤 {casualUpNextData.nextSong.singerName}
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold text-slate-300 py-1">
                  Stage is open! Queue a song from your phone to jump up next!
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1b2548]">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>Starting in 3s...</span>
              </span>

              <button
                onClick={() => {
                  setCasualUpNextData(null);
                  skipSong();
                }}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold font-arcade text-xs uppercase tracking-wider flex items-center gap-1 transition-transform active:scale-95"
              >
                <span>Play Now</span>
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Songs History Modal for Host */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0e142a] border border-[#1b2548] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1c264a] flex items-center justify-between bg-[#0a0e1e]/80">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-heading font-bold text-base text-white">
                    Previous Songs Played
                  </h3>
                  <p className="text-xs text-slate-400">
                    Star ⭐ any song to save it to Top Hits, or re-queue in 1 click
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previousSongs.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all previous songs history?')) {
                        clearHistory();
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold font-arcade tracking-wider transition-all"
                    title="Clear previous songs history"
                  >
                    Clear History
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141c38]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {previousSongs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No previous songs recorded yet.
                </div>
              ) : (
                previousSongs.map((song, idx) => {
                  const starred = isStarred(song.videoId);
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className="p-2.5 rounded-xl bg-[#131b38] border border-[#202d58] hover:border-sky-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          className="w-12 h-9 rounded object-cover border border-[#28386b] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                            {song.title}
                          </div>
                          <div className="text-[11px] font-mono text-sky-400 truncate">
                            🎤 Sung by {song.singerName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Star to Top Hits */}
                        <button
                          onClick={() =>
                            toggleStar({
                              videoId: song.videoId,
                              title: song.title,
                              author: song.author,
                              thumbnailUrl: song.thumbnailUrl,
                              singerSuggestion: song.singerName,
                            })
                          }
                          className={`p-2 rounded-xl transition-all ${
                            starred
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-400/60'
                              : 'bg-[#182348] text-slate-400 hover:text-amber-300'
                          }`}
                          title={starred ? 'Starred in Top Hits' : 'Star song to add to Top Hits'}
                        >
                          <Star className={`w-4 h-4 ${starred ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Re-queue Button */}
                        <button
                          onClick={() => handleRequeueSong(song)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-arcade tracking-wider uppercase flex items-center gap-1"
                          title="Re-queue this song"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-queue</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-[#0a0e1e] border-t border-[#1c264a] text-xs text-slate-400 flex items-center justify-between">
              <span>Top Hits Catalog currently has {topHits.length} tracks</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1 rounded-lg bg-[#141c38] text-slate-300 hover:text-white border border-[#232f58]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Modal */}
      <FirebaseModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onConfigSaved={() => {
          // Re-trigger connection check
        }}
      />
    </div>
  );
};
