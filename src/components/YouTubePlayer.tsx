import React, { useEffect, useRef, useState } from 'react';
import { KaraokeSong } from '../types/karaoke';
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, AlertCircle, Disc3, Star } from 'lucide-react';

interface YouTubePlayerProps {
  currentSong: KaraokeSong | null;
  onEnded: () => void;
  onSkip: () => void;
  onReplay: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  isHostAdmin?: boolean;
  isStarred?: boolean;
  onToggleStar?: () => void;
  /** While true, the current song is loaded but kept paused (e.g. during the intro countdown). */
  holdPlayback?: boolean;
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: unknown }) => void;
            onStateChange?: (event: { data: number; target: unknown }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentSong,
  onEnded,
  onSkip,
  onReplay,
  onTimeUpdate,
  isHostAdmin = true,
  isStarred = false,
  onToggleStar,
  holdPlayback = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const hasTriggeredEndRef = useRef<boolean>(false);
  const holdRef = useRef<boolean>(holdPlayback);
  holdRef.current = holdPlayback;

  // Load YouTube iFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  // Initialize or re-cue player when isReady changes or song changes
  useEffect(() => {
    if (!isReady || !currentSong) return;

    setPlayerError(null);
    hasTriggeredEndRef.current = false;

    // If player instance doesn't exist yet, create it
    if (!playerRef.current) {
      playerRef.current = new window.YT.Player('karaoke-yt-player', {
        videoId: currentSong.videoId,
        playerVars: {
          autoplay: holdRef.current ? 0 : 1,
          controls: 0, // Custom arcade controls
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: { target: unknown }) => {
            const player = event.target as YTPlayerInstance;
            player?.setVolume(volume);
            if (holdRef.current) return;
            player?.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event: { data: number }) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              if (!hasTriggeredEndRef.current) {
                hasTriggeredEndRef.current = true;
                setIsPlaying(false);
                onEnded();
              }
            } else if (event.data === 1) {
              setIsPlaying(true);
              setPlayerError(null);
            } else if (event.data === 2) {
              setIsPlaying(false);
            }
          },
          onError: (event: { data: number }) => {
            console.warn('YouTube Player error code:', event.data);
            let message = 'Playback error occurred.';
            if (event.data === 101 || event.data === 150) {
              message = 'Embedding restricted by owner. Auto-skipping in 3 seconds...';
            } else if (event.data === 100) {
              message = 'Video not found or removed. Auto-skipping...';
            }
            setPlayerError(message);

            // Auto advance on unplayable track
            setTimeout(() => {
              if (!hasTriggeredEndRef.current) {
                hasTriggeredEndRef.current = true;
                onEnded();
              }
            }, 3500);
          },
        },
      });
    } else {
      // Player already exists, load new video
      if (holdRef.current) {
        playerRef.current.cueVideoById(currentSong.videoId);
        setIsPlaying(false);
      } else {
        playerRef.current.loadVideoById(currentSong.videoId);
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }

    return () => {
      // Do not destroy continuously between tracks for smoother transition
    };
  }, [currentSong?.id, currentSong?.videoId, isReady]);

  // Start playback as soon as the hold (intro countdown) is released
  useEffect(() => {
    if (holdPlayback || !currentSong || !playerRef.current) return;
    try {
      playerRef.current.playVideo();
      setIsPlaying(true);
    } catch {}
  }, [holdPlayback, currentSong?.id]);

  // Clean destroy on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, []);

  // Time progress ticker & Smart Outro Auto-Cut (Skips YouTube's creator end screen recommendations)
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          setDuration(dur);
          onTimeUpdate?.(cur, dur);

          // Prevent YouTube from showing creator end-screen suggestions cards.
          // YouTube displays end-screen cards during the final 5-15s outro (after lyrics end).
          // Transitioning right as the song finishes cuts cleanly to the AI score / next track
          // without the intrusive YouTube recommendation cards popping up!
          if (dur > 20 && cur >= dur - 4.5 && !hasTriggeredEndRef.current) {
            hasTriggeredEndRef.current = true;
            setIsPlaying(false);
            try {
              playerRef.current.pauseVideo();
            } catch {}
            onEnded();
          }
        } catch {}
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying, onTimeUpdate, onEnded]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const seekTime = parseFloat(e.target.value);
    playerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 100% Clean Video Area (Unobstructed for Lyrics, Constrained to Viewport) */}
      <div className="relative w-full aspect-video max-h-[calc(100vh-140px)] bg-black rounded-2xl overflow-hidden border border-[#1b2548] shadow-2xl">
        {/* YouTube iFrame Target - ALWAYS mounted so player is immediately available */}
        <div ref={containerRef} className="w-full h-full">
          <div id="karaoke-yt-player" className="w-full h-full" />
        </div>

        {/* Stage Idle Screen (Rendered as overlay when stage is free, seamlessly auto-clears when 1st song is queued) */}
        {!currentSong && (
          <div className="absolute inset-0 bg-[#0c1020] z-20 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#131b38]/40 via-transparent to-[#0a0e1e]/60 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center max-w-xl px-4 animate-in fade-in duration-300">
              <div className="w-12 h-9 md:w-14 md:h-10 rounded-2xl bg-[#ff0033] flex items-center justify-center shadow-lg mb-4 transition-transform hover:scale-105">
                <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">
                THE STAGE IS OPEN
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-md font-normal leading-relaxed">
                Scan the QR code on the right with your phone to search and queue any YouTube karaoke song! It will play instantly on screen.
              </p>
            </div>
          </div>
        )}

        {/* Temporary Restricted Alert Toast only if owner blocks embedding */}
        {playerError && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-rose-950/95 border border-rose-500 text-rose-200 px-4 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="text-xs font-semibold">{playerError}</div>
          </div>
        )}
      </div>

      {/* Unified Compact Host Controls & Now Singing Bar */}
      {/* Compact Host Playback Bar */}
      {isHostAdmin && (
        <div className="bg-[#10162e] border border-[#1d274c] rounded-xl px-3.5 py-2 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {/* Left: Now Singing Title, Singer & Star Button */}
          <div className="flex items-center gap-2.5 min-w-0 max-w-full sm:max-w-[340px] md:max-w-[420px] w-full sm:w-auto">
            <div className="w-7 h-7 rounded-full bg-[#0a0e1e] border border-[#212d56] flex items-center justify-center shrink-0">
              <Disc3 className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold text-[9px] uppercase font-arcade tracking-wider">
                  NOW SINGING
                </span>
                <span className="text-xs font-bold text-slate-400 font-arcade truncate">
                  🎤 {currentSong?.singerName}
                </span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {currentSong?.title}
              </div>
            </div>
            {onToggleStar && (
              <button
                onClick={onToggleStar}
                className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                  isStarred
                    ? 'bg-amber-500/20 text-amber-400 border-amber-400/60'
                    : 'bg-[#141c38] text-slate-400 hover:text-amber-300 border-[#232f58]'
                }`}
                title={isStarred ? 'In Top Hits' : 'Star song to Top Hits'}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>

          {/* Center: Progress Slider */}
          <div className="flex-1 flex items-center gap-2 w-full max-w-md">
            <span className="text-[11px] font-mono text-sky-400/90 w-10 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#1c2548] rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 transition-colors"
            />
            <span className="text-[11px] font-mono text-slate-400 w-10 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Right: Playback Buttons & Volume */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-7 h-7 rounded-lg bg-[#141c38] hover:bg-[#1a254a] text-slate-300 hover:text-white border border-[#232f58] flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onReplay}
              title="Restart Song"
              className="w-7 h-7 rounded-lg bg-[#141c38] hover:bg-[#1a254a] text-slate-300 hover:text-white border border-[#232f58] flex items-center justify-center transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onSkip}
              title="Skip to Next Singer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sky-500/50 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <SkipForward className="w-3 h-3" />
              <span>DJ Next</span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 bg-[#0e142a] px-2 py-1 rounded-lg border border-[#1b2548]">
              <button
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-16 h-1 bg-[#1c2548] rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
