import React, { useState, useEffect, useRef } from 'react';
import { useKaraokeRoom, getDeviceId, getSavedSingerName, saveSingerName } from '../hooks/useKaraokeRoom';
import { useTopHits } from '../hooks/useTopHits';
import { PartyEffectsOverlay } from './PartyEffectsOverlay';
import { KaraokeSong, YouTubeSearchResult } from '../types/karaoke';
import {
  Music,
  User,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Radio,
  Mic2,
  Loader2,
  ListMusic,
  History,
  Star,
  Trash2,
  RotateCcw,
  Check,
  Search,
  SearchX,
  X,
  Crown,
  SkipForward,
  Bot,
  ChevronUp,
  ChevronDown,
  Palette,
  Lock,
  Unlock,
  Users,
  Trophy,
} from 'lucide-react';

interface GuestRemoteProps {
  roomId: string;
}

interface PopularCategory {
  id: string;
  label: string;
  icon: string;
  songs: { title: string; query: string }[];
}

const POPULAR_CATEGORIES: PopularCategory[] = [
  {
    id: 'opm',
    label: 'OPM Hits',
    icon: '🇵🇭',
    songs: [
      { title: 'Ang Huling El Bimbo', query: 'Ang Huling El Bimbo Eraserheads Karaoke' },
      { title: 'Torete', query: 'Torete Moonstar88 Karaoke' },
      { title: 'Harana', query: 'Harana Parokya ni Edgar Karaoke' },
      { title: 'Beer', query: 'Beer Itchyworms Karaoke' },
      { title: 'Pantropiko', query: 'Pantropiko BINI Karaoke' },
      { title: 'Salamin, Salamin', query: 'Salamin Salamin BINI Karaoke' },
      { title: 'Nobela', query: 'Nobela Join The Club Karaoke' },
      { title: "Kung 'Di Rin Lang Ikaw", query: 'Kung Di Rin Lang Ikaw December Avenue Karaoke' },
    ],
  },
  {
    id: '90s',
    label: "1990's Hits",
    icon: '📼',
    songs: [
      { title: 'I Want It That Way', query: 'I Want It That Way Backstreet Boys Karaoke' },
      { title: 'Zombie', query: 'Zombie The Cranberries Karaoke' },
      { title: 'Total Eclipse of the Heart', query: 'Total Eclipse of the Heart Karaoke' },
      { title: 'Wannabe', query: 'Wannabe Spice Girls Karaoke' },
      { title: 'Torn', query: 'Torn Natalie Imbruglia Karaoke' },
      { title: 'Wonderwall', query: 'Wonderwall Oasis Karaoke' },
      { title: 'My Way', query: 'My Way Frank Sinatra Karaoke' },
    ],
  },
  {
    id: '2000s',
    label: "2000's Anthems",
    icon: '💿',
    songs: [
      { title: 'Mr. Brightside', query: 'Mr. Brightside The Killers Karaoke' },
      { title: 'Since U Been Gone', query: 'Since U Been Gone Kelly Clarkson Karaoke' },
      { title: 'Complicated', query: 'Complicated Avril Lavigne Karaoke' },
      { title: 'Bring Me To Life', query: 'Bring Me To Life Evanescence Karaoke' },
      { title: 'Because of You', query: 'Because of You Kelly Clarkson Karaoke' },
      { title: 'Yellow', query: 'Yellow Coldplay Karaoke' },
      { title: 'In The End', query: 'In The End Linkin Park Karaoke' },
    ],
  },
  {
    id: '2010s',
    label: "2010's Hits",
    icon: '🎧',
    songs: [
      { title: 'Versace on the Floor', query: 'Versace on the Floor Bruno Mars Karaoke' },
      { title: 'Rolling in the Deep', query: 'Rolling in the Deep Adele Karaoke' },
      { title: 'Counting Stars', query: 'Counting Stars OneRepublic Karaoke' },
      { title: 'Love Story', query: 'Love Story Taylor Swift Karaoke' },
      { title: 'Just the Way You Are', query: 'Just the Way You Are Bruno Mars Karaoke' },
      { title: 'Die With A Smile', query: 'Die With A Smile Lady Gaga Bruno Mars Karaoke' },
      { title: 'Shape of You', query: 'Shape of You Ed Sheeran Karaoke' },
    ],
  },
  {
    id: 'golden',
    label: 'All-Time Golden',
    icon: '🌟',
    songs: [
      { title: 'Bohemian Rhapsody', query: 'Bohemian Rhapsody Queen Karaoke' },
      { title: 'Dancing Queen', query: 'Dancing Queen ABBA Karaoke' },
      { title: "Don't Stop Believin'", query: "Don't Stop Believin' Journey Karaoke" },
      { title: 'Sweet Caroline', query: 'Sweet Caroline Neil Diamond Karaoke' },
      { title: 'I Will Survive', query: 'I Will Survive Gloria Gaynor Karaoke' },
      { title: "Can't Take My Eyes Off You", query: 'Cant Take My Eyes Off You Frankie Valli Karaoke' },
    ],
  },
];

const TV_BACKGROUND_THEMES = [
  { id: 'midnight', name: 'Midnight Navy', icon: '🌌', preview: 'bg-[#0b0f1d] border-sky-500/50' },
  { id: 'neon-tokyo', name: 'Neon Tokyo', icon: '🌸', preview: 'bg-[#0d071a] border-pink-500/50' },
  { id: 'disco-club', name: 'Disco Club', icon: '🪩', preview: 'bg-[#180a22] border-amber-500/50' },
  { id: 'starlight', name: 'Starlight Cosmic', icon: '⭐', preview: 'bg-[#060a1e] border-indigo-500/50' },
  { id: 'cyber-matrix', name: 'Cyber Matrix', icon: '🟩', preview: 'bg-[#041210] border-emerald-500/50' },
  { id: 'sunset-lounge', name: 'Sunset Lounge', icon: '🌅', preview: 'bg-[#160a14] border-rose-500/50' },
];

export const GuestRemote: React.FC<GuestRemoteProps> = ({ roomId }) => {
  const {
    roomState,
    isConnected,
    addSong,
    skipSong,
    replaySong,
    deleteSong,
    reorderQueue,
    clearHistory,
    triggerPartyEffect,
    setTvBackground,
    claimHostDj,
    releaseHostDj,
    toggleCompetitionMode,
    voteSong,
    submitMicTune,
  } = useKaraokeRoom(roomId, false);
  const { topHits, toggleStar, removeHit, isStarred, resetDefaults } = useTopHits();
  const deviceId = getDeviceId();

  // Host DJ Status (Only 1 Host DJ per room enforced)
  const isHostDj = Boolean(roomState?.hostDeviceId && roomState.hostDeviceId === deviceId);
  const otherHostName =
    !isHostDj && roomState?.hostDeviceId ? roomState.hostName || 'Host' : null;

  const [showHostPinModal, setShowHostPinModal] = useState(false);
  const [hostPinInput, setHostPinInput] = useState('');
  const [hostPinError, setHostPinError] = useState<string | null>(null);

  // TV Background Theme Modal
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Singer name state (persisted)
  const [singerName, setSingerName] = useState(() => getSavedSingerName() || '');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Live YouTube-style search autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSuggestionsRef = useRef<boolean>(false);

  // General UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('opm');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'status' | 'hits' | 'history'>('queue');
  const [cheerSent, setCheerSent] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const handleClaimHost = async (overridePin?: string) => {
    const res = await claimHostDj(deviceId, singerName || 'Party Host', overridePin);
    if (res?.success) {
      showToast('👑 You are now the Host DJ for this room!');
      setShowHostPinModal(false);
      setHostPinInput('');
      setHostPinError(null);
    } else {
      setHostPinError(res?.error || 'Failed to claim Host DJ.');
      showToast(res?.error || 'Could not claim Host DJ');
    }
  };

  const handleReleaseHost = async () => {
    await releaseHostDj(deviceId);
    showToast('Host DJ spot released! Anyone can now take over.');
  };

  // Audience Performance Voting State
  const [myVote, setMyVote] = useState<number | null>(null);
  const currentSongId = roomState?.currentSong?.id;

  // Reset personal vote when current song changes
  useEffect(() => {
    setMyVote(null);
  }, [currentSongId]);

  const handleVote = async (score: number) => {
    setMyVote(score);
    await voteSong(score, singerName || 'Guest');
    showToast(`⭐ You gave ${score}/100 to ${roomState?.currentSong?.singerName || 'Singer'}!`);
  };

  // Host Microphone Pitch & Audio Tune Detector State (Web Audio API)
  const [isMicActive, setIsMicActive] = useState(false);
  const [micPitchVal, setMicPitchVal] = useState(88);
  const [micEnergyVal, setMicEnergyVal] = useState(0);
  const [micFeedbackMsg, setMicFeedbackMsg] = useState('Listening for singer...');
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleHostMic = async () => {
    if (isMicActive) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }
      if (micIntervalRef.current) {
        clearInterval(micIntervalRef.current);
        micIntervalRef.current = null;
      }
      setIsMicActive(false);
      showToast('Mic Tune Detector turned off');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);

      setIsMicActive(true);
      showToast('🎙️ Host Mic Tune Detector ACTIVE! Keep near the singer.');

      micIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(timeData);

        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const val = (timeData[i] - 128) / 128;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);
        const energyScore = Math.min(100, Math.round(rms * 280));

        let zeroCrossings = 0;
        for (let i = 1; i < timeData.length; i++) {
          if ((timeData[i] >= 128 && timeData[i - 1] < 128) || (timeData[i] < 128 && timeData[i - 1] >= 128)) {
            zeroCrossings++;
          }
        }

        let pitchScore = 80;
        if (energyScore > 12) {
          const stability = Math.min(1, Math.max(0.4, 1 - Math.abs(zeroCrossings - 110) / 240));
          pitchScore = Math.round(82 + stability * 16);
          setMicFeedbackMsg(pitchScore >= 92 ? 'In Tune 🟢 (Great Pitch!)' : 'Detecting Vocals 🟡');
        } else {
          setMicFeedbackMsg('Listening for singer voice...');
          pitchScore = 86;
        }

        setMicPitchVal(pitchScore);
        setMicEnergyVal(energyScore);

        if (energyScore > 10) {
          submitMicTune(pitchScore, energyScore);
        }
      }, 1500);
    } catch (err) {
      console.warn('Microphone permission error:', err);
      showToast('⚠️ Microphone access denied. Check browser permission.');
    }
  };

  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      if (micIntervalRef.current) {
        clearInterval(micIntervalRef.current);
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real-time YouTube suggestions on input change
  useEffect(() => {
    if (suppressSuggestionsRef.current) {
      suppressSuggestionsRef.current = false;
      return;
    }

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (suppressSuggestionsRef.current) return;
      try {
        const res = await fetch(`/api/youtube-suggestions?q=${encodeURIComponent(q)}`);
        if (res.ok && !suppressSuggestionsRef.current) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch {
        // Silently ignore suggestion errors
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  // Perform YouTube Search (Returns only playable/screened songs)
  const handleSearch = async (queryText?: string) => {
    suppressSuggestionsRef.current = true;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setShowSuggestions(false);
    setSuggestions([]);

    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) return;

    if (queryText !== undefined) {
      setSearchQuery(queryText);
    }
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search-youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Failed searching YouTube');
        setSearchResults([]);
      } else {
        setSearchResults(data.results || []);
      }
    } catch {
      setSearchError('Connection issue searching YouTube. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 1-Tap Queue from Search Results or Saved Hits
  const handleQueueSong = async (song: {
    videoId: string;
    title: string;
    author: string;
    thumbnailUrl?: string;
  }) => {
    const currentSinger = singerName.trim();
    if (!currentSinger) {
      showToast('⚠️ Please enter who is singing first at the top!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    saveSingerName(currentSinger);
    setIsSubmitting(true);

    try {
      await addSong({
        videoId: song.videoId,
        title: song.title,
        author: song.author,
        thumbnailUrl: song.thumbnailUrl || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`,
        singerName: currentSinger,
      });

      setSubmitSuccess(`🎉 "${song.title}" queued for ${currentSinger}!`);
      showToast(`🎉 Added "${song.title.substring(0, 20)}..." to Queue!`);
      setTimeout(() => setSubmitSuccess(null), 4000);
      // Stay on Queue tab so same person can queue multiple songs seamlessly!
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed queuing song';
      showToast(`Error queuing song: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStar = (song: {
    videoId: string;
    title: string;
    author: string;
    thumbnailUrl?: string;
    singerSuggestion?: string;
    genre?: string;
  }) => {
    const starred = toggleStar(song);
    if (starred) {
      showToast(`⭐ Added "${song.title.substring(0, 24)}..." to Top Hits!`);
    } else {
      showToast(`Removed from Top Hits`);
    }
  };

  const handleRemoveTopHit = (e: React.MouseEvent, videoId: string, title: string) => {
    e.stopPropagation();
    removeHit(videoId);
    showToast(`Removed "${title.substring(0, 20)}..." from Top Hits`);
  };

  const handleSendReaction = (type: 'airhorn' | 'cheer' | 'applause') => {
    triggerPartyEffect(type, singerName || 'Guest');
    setCheerSent(true);
    setTimeout(() => setCheerSent(false), 2000);
  };

  // Find guest's songs in queue
  const myQueueItems = (roomState?.queue || []).filter((s) => s.queuedByDeviceId === deviceId);
  const myCurrentSong = roomState?.currentSong?.queuedByDeviceId === deviceId;
  const previousSongs = roomState?.history || [];

  return (
    <div className="w-full max-w-md mx-auto h-full max-h-full bg-[#0b0f1d] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white border-x border-[#1a2346] shadow-2xl relative overflow-hidden">
      {/* Party Visual Reactions Overlay (Airhorn, Applause, Cheer) */}
      <PartyEffectsOverlay effect={roomState?.partyEffect} />

      {/* Retro CRT overlay */}
      <div className="fixed inset-0 crt-overlay pointer-events-none opacity-20" />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[#0e142a] border-2 border-sky-400 text-sky-200 px-4 py-2 rounded-xl text-xs font-bold font-arcade shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* FROZEN TOP SECTION (TV mini card, Host DJ status, TV Theme, 4-Tab Bar) */}
      <header className="shrink-0 flex flex-col z-20 bg-[#0b0f1d]">
        {/* TV "Now Playing" Card with 1-Host DJ Status & TV Theme Button */}
        <div className="p-3 pb-1">
          <div className="bg-[#0e142a] border border-[#1b2548] rounded-2xl p-2.5 sm:p-3 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#141c38] border border-[#232f58] flex items-center justify-center shrink-0">
                  <span className="text-base">📺</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-arcade uppercase tracking-wider text-sky-400 font-bold">
                      ON TV RIGHT NOW
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white truncate">
                    {roomState?.currentSong ? roomState.currentSong.title : 'Waiting for singer...'}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {roomState?.currentSong ? `🎤 ${roomState.currentSong.singerName}` : 'Stage is free!'}
                  </div>
                </div>
              </div>

              {/* Top Most Right: Host DJ / Claim Host Button (Replaces Cheer button) */}
              <div className="shrink-0">
                {isHostDj ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-arcade font-bold shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Host DJ</span>
                    <button
                      onClick={handleReleaseHost}
                      className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 hover:text-white uppercase font-bold"
                      title="Release host DJ spot"
                    >
                      Release
                    </button>
                  </div>
                ) : otherHostName ? (
                  <button
                    onClick={() => setShowHostPinModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141c38] hover:bg-[#1a254d] border border-[#202d58] text-slate-300 hover:text-amber-300 text-xs font-arcade font-bold transition-all shadow-sm active:scale-95"
                    title={`Host is currently ${otherHostName}. Tap to enter room PIN and take over`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[90px]">DJ: {otherHostName}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaimHost()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-arcade font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                    title="Claim Host DJ spot"
                  >
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span>Claim Host</span>
                  </button>
                )}
              </div>
            </div>

            {/* Host DJ Controls (Only visible to the single active Host DJ) */}
            {isHostDj && (
              <div className="mt-2 pt-2 border-t border-[#1b2548] space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={skipSong}
                    disabled={!roomState?.currentSong}
                    className="flex-1 py-1 px-2 rounded-lg bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/50 text-sky-300 font-bold font-arcade text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                    title="Skip to next queued singer"
                  >
                    <SkipForward className="w-3 h-3" />
                    <span>DJ Next</span>
                  </button>

                  <button
                    onClick={replaySong}
                    disabled={!roomState?.currentSong}
                    className="py-1 px-2.5 rounded-lg bg-[#141c38] hover:bg-[#1a254a] border border-[#232f58] text-slate-300 hover:text-white font-bold font-arcade text-[10px] tracking-wider flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                    title="Restart current track"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Replay</span>
                  </button>

                  <button
                    onClick={() => toggleCompetitionMode()}
                    className={`py-1 px-2 rounded-lg border font-bold font-arcade text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      roomState?.competitionMode !== false
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                        : 'bg-[#141c38] border-[#232f58] text-slate-300 hover:text-white'
                    }`}
                    title={roomState?.competitionMode !== false ? 'Competition Mode (Scoring & Rank ON)' : 'Casual Party Mode (No Scoring)'}
                  >
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>{roomState?.competitionMode !== false ? 'Comp: ON' : 'Party: Casual'}</span>
                  </button>

                  <button
                    onClick={toggleHostMic}
                    className={`py-1 px-2 rounded-lg border font-bold font-arcade text-[10px] tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      isMicActive
                        ? 'bg-emerald-600/40 border-emerald-400 text-emerald-300 animate-pulse'
                        : 'bg-[#141c38] border-[#232f58] text-slate-300 hover:text-white'
                    }`}
                    title="Host Phone Microphone Vocal Pitch Detector"
                  >
                    <Mic2 className="w-3 h-3 text-emerald-400" />
                    <span>{isMicActive ? 'Mic: ON' : 'Mic Tune'}</span>
                  </button>

                </div>

                {/* Host Live Mic Monitor */}
                {isMicActive && (
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-[10px] font-arcade text-emerald-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                      <span className="truncate">{micFeedbackMsg} (Pitch: {micPitchVal}%)</span>
                    </div>
                    <button
                      onClick={toggleHostMic}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900 text-white font-bold uppercase shrink-0"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Performance Audience Voting Card */}
          {roomState?.currentSong && roomState?.competitionMode !== false && (
            <div className="mt-1.5 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#101735] to-sky-500/10 border border-amber-400/50 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-arcade font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Rate Singer: {roomState.currentSong.singerName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {Object.keys(roomState.audienceVotes || {}).length} crowd votes
                </span>
              </div>

              {myVote ? (
                <div className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-arcade font-bold text-center flex items-center justify-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your Vote: {myVote}/100 recorded! 🌟</span>
                  <button
                    onClick={() => setMyVote(null)}
                    className="text-[10px] text-slate-400 underline hover:text-white ml-2"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '80 Good', score: 80, emoji: '👏' },
                    { label: '90 Great', score: 90, emoji: '🔥' },
                    { label: '95 Epic', score: 95, emoji: '⚡' },
                    { label: '100 God', score: 100, emoji: '👑' },
                  ].map((btn) => (
                    <button
                      key={btn.score}
                      onClick={() => handleVote(btn.score)}
                      className="py-1.5 px-1 rounded-xl bg-[#141d3b] hover:bg-amber-500/20 border border-[#232f58] hover:border-amber-400 text-slate-200 hover:text-amber-300 text-[10px] font-arcade font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 shadow-sm"
                    >
                      <span>{btn.emoji}</span>
                      <span>{btn.score}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Latest AI Score Alert on Mobile */}
          {roomState?.latestScore && (
            <div className="mt-1.5 p-2 rounded-xl bg-[#0e142a] border border-[#1b2548] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0 font-arcade font-bold text-xs">
                  {roomState.latestScore.score}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-arcade tracking-wider text-sky-400 font-bold">
                    AI Judge: {roomState.latestScore.rank}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {roomState.latestScore.singerName} on &ldquo;{roomState.latestScore.songTitle}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guest Navigation 4-Tab Bar (Frozen at top) */}
        <div className="px-3 py-1.5 grid grid-cols-4 gap-1.5 text-xs font-arcade font-bold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'queue'
                ? 'bg-[#141f3e] border border-sky-500/80 text-sky-300 shadow-md'
                : 'bg-[#0e142a] border border-[#1c2548] text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="text-[10px]">Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeTab === 'status'
                ? 'bg-[#141f3e] border border-sky-500/80 text-sky-300 shadow-md'
                : 'bg-[#0e142a] border border-[#1c2548] text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="text-[10px]">Live Lineup</span>
            {myQueueItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                {myQueueItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hits')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeTab === 'hits'
                ? 'bg-[#141f3e] border border-amber-500/70 text-amber-300 shadow-md'
                : 'bg-[#0e142a] border border-[#1c2548] text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px]">Top Hits ({topHits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeTab === 'history'
                ? 'bg-[#141f3e] border border-sky-500/70 text-sky-200 shadow-md'
                : 'bg-[#0e142a] border border-[#1c2548] text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[10px]">Previous ({previousSongs.length})</span>
          </button>
        </div>
      </header>

      {/* SCROLLABLE MIDDLE CONTENT */}
      <main className="flex-1 min-h-0 p-3 pt-1 overflow-y-auto overscroll-contain space-y-3">
        {/* TAB 1: ADD SONG (YOUTUBE SEARCH + AUTOCOMPLETE SUGGESTIONS) */}
        {activeTab === 'queue' && (
          <div className="space-y-3 animate-in fade-in">
            {submitSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Singer Name Input (Always at top) */}
            <div className="p-2.5 rounded-xl bg-[#0e142a] border border-[#1b2548] space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Who is singing? (Singer Name)</span>
                </span>
                {singerName && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah, Dion, Alex, Karaoke Duet"
                value={singerName}
                onChange={(e) => setSingerName(e.target.value)}
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl bg-[#131b38] border border-[#202d58] focus:border-sky-500 focus:outline-none text-white text-xs placeholder-slate-500 transition-colors"
              />
            </div>

            {/* YouTube Search Bar with Live Autocomplete Suggestions (SIDE-BY-SIDE FLEX: ZERO OVERLAP) */}
            <div className="space-y-2.5" ref={searchContainerRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="relative"
              >
                <div className="flex items-center gap-2 w-full">
                  {/* Left: Input container with icon and clear X button */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search song or artist..."
                      value={searchQuery}
                      onChange={(e) => {
                        suppressSuggestionsRef.current = false;
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim().length >= 2) {
                          setShowSuggestions(true);
                        } else {
                          setShowSuggestions(false);
                          setSuggestions([]);
                        }
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0 && !suppressSuggestionsRef.current) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0e142a] border border-[#1c2548] focus:border-sky-500 focus:outline-none text-white text-xs placeholder-slate-500 transition-colors shadow-inner"
                    />

                    {/* Clear Button */}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          suppressSuggestionsRef.current = true;
                          setSearchQuery('');
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                        title="Clear search input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Sibling Search Button - physically separated, impossible to overlap */}
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold font-arcade flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Search</span>
                  </button>
                </div>

                {/* Live YouTube-style Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0e142a] border border-[#232f58] rounded-xl shadow-2xl overflow-hidden divide-y divide-[#172040] animate-in fade-in slide-in-from-top-1 duration-150">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion}-${idx}`}
                        type="button"
                        onClick={() => {
                          suppressSuggestionsRef.current = true;
                          setShowSuggestions(false);
                          setSuggestions([]);
                          handleSearch(suggestion);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-[#151f42] hover:text-sky-300 transition-colors flex items-center gap-2.5"
                      >
                        <Search className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {/* Popular Song Categories & Quick-Search Chips */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[10px] text-slate-300 font-bold font-arcade uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Popular Picks:</span>
                  </div>

                  {/* Category Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-[#0b0f1d] p-0.5 rounded-lg border border-[#1c2548]">
                    {POPULAR_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-arcade transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="mr-1">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Song Chips for Selected Category */}
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CATEGORIES.find((c) => c.id === selectedCategory)?.songs.map((song) => (
                    <button
                      key={song.query}
                      type="button"
                      onClick={() => {
                        suppressSuggestionsRef.current = true;
                        setShowSuggestions(false);
                        setSuggestions([]);
                        handleSearch(song.query);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#131b38] hover:bg-[#1a254d] border border-[#202d58] hover:border-sky-500/60 text-[11px] text-slate-200 hover:text-sky-300 transition-all flex items-center gap-1.5 active:scale-95 group shadow-sm"
                    >
                      <span className="text-sky-400 group-hover:scale-110 transition-transform">🎵</span>
                      <span className="font-medium">{song.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Error State */}
            {searchError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Searching Indicator */}
            {isSearching && (
              <div className="p-6 rounded-2xl bg-[#0e142a] border border-[#1b2548] text-center space-y-2">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                <div className="text-xs font-bold text-white">Searching YouTube...</div>
                <div className="text-[10px] text-slate-400">
                  Filtering and verifying 100% playable tracks...
                </div>
              </div>
            )}

            {/* Search Results List (Only 100% playable songs shown, no warning badges needed!) */}
            {!isSearching && hasSearched && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>YouTube Karaoke Results ({searchResults.length})</span>
                  <span className="text-[10px] text-sky-400">Ready to play</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-[#0e142a] rounded-xl border border-dashed border-[#1c2548]">
                    <SearchX className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                    <div>No playable YouTube karaoke results found for &ldquo;{searchQuery}&rdquo;.</div>
                    <div className="text-[10px] text-slate-500 mt-1">Try another title or artist name.</div>
                  </div>
                ) : (
                  searchResults.map((song) => (
                    <div
                      key={song.videoId}
                      className="p-2.5 rounded-xl border bg-[#0e142a] border-[#1c2548] hover:border-sky-500/60 transition-all flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Thumbnail with duration */}
                        <div className="relative shrink-0">
                          <img
                            src={song.thumbnailUrl}
                            alt=""
                            className="w-14 h-10 rounded-lg object-cover border border-[#202d58]"
                          />
                          {song.duration && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                              {song.duration}
                            </span>
                          )}
                        </div>

                        {/* Info (Clean, no warning badges!) */}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[200px]">
                            {song.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {song.author}
                          </div>
                        </div>
                      </div>

                      {/* Action Button: 1-Tap Queue */}
                      <div className="shrink-0">
                        <button
                          onClick={() => handleQueueSong(song)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-arcade font-bold text-xs uppercase tracking-wide flex items-center gap-1 transition-all shadow-sm active:scale-95"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Queue</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Quick Starred / Top Hits shortcut */}
            <div className="p-2.5 rounded-xl bg-[#0e142a] border border-[#1b2548] text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Tip: Pick from saved party favorites</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('hits')}
                className="text-sky-400 font-bold hover:underline"
              >
                Top Hits ({topHits.length})
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE LINEUP */}
        {activeTab === 'status' && (
          <div className="space-y-3 animate-in fade-in">
            {myCurrentSong && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xl animate-pulse text-center">
                <div className="text-xs font-extrabold uppercase font-arcade tracking-widest">
                  🎤 YOU ARE SINGING RIGHT NOW!
                </div>
                <div className="text-sm font-bold mt-0.5">Grab the microphone!</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-arcade">
                Party Lineup ({roomState?.queue.length || 0} in queue)
              </h3>
            </div>

            {(!roomState?.queue || roomState.queue.length === 0) ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#0e142a] rounded-xl border border-dashed border-[#1c2548]">
                The queue is empty! Be the first to search and queue a song.
              </div>
            ) : (
              <div className="space-y-2">
                {roomState.queue.map((song, index) => {
                  const isMine = song.queuedByDeviceId === deviceId;
                  const starred = isStarred(song.videoId);
                  return (
                    <div
                      key={song.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isMine
                          ? 'bg-[#131c3b] border-sky-500/80 shadow-md'
                          : 'bg-[#0e142a] border-[#1c2548]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                            isMine
                              ? 'bg-sky-500 text-white'
                              : 'bg-[#1a2344] text-slate-400 border border-[#26325a]'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <img
                          src={song.thumbnailUrl}
                          alt={song.title}
                          className="w-12 h-9 rounded object-cover border border-[#202d58] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate max-w-[150px]">
                            {song.title}
                          </div>
                          <div className="text-[11px] font-mono text-sky-400 truncate">
                            🎤 {song.singerName} {isMine && <span className="text-sky-300 font-bold">(You)</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            handleToggleStar({
                              videoId: song.videoId,
                              title: song.title,
                              author: song.author,
                              thumbnailUrl: song.thumbnailUrl,
                              singerSuggestion: song.singerName,
                            })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            starred
                              ? 'text-amber-400'
                              : 'text-slate-500 hover:text-amber-300'
                          }`}
                          title="Star to Top Hits"
                        >
                          <Star className={`w-3.5 h-3.5 ${starred ? 'fill-amber-400' : ''}`} />
                        </button>

                        <span className="text-[10px] font-mono text-slate-400">
                          {index === 0 ? 'Up Next' : `In ${index + 1}`}
                        </span>

                        {/* Host Reorder Controls */}
                        {isHostDj && (
                          <div className="flex items-center gap-0.5">
                            {index > 0 && (
                              <button
                                onClick={() => reorderQueue(index, index - 1)}
                                className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-[#1a254d] transition-colors"
                                title="Move song up in queue"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {index < (roomState?.queue?.length || 0) - 1 && (
                              <button
                                onClick={() => reorderQueue(index, index + 1)}
                                className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-[#1a254d] transition-colors"
                                title="Move song down in queue"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {(isHostDj || isMine) && (
                          <button
                            onClick={() => deleteSong(song.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Remove song from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EDITABLE TOP HITS */}
        {activeTab === 'hits' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-arcade flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Top Hits Catalog ({topHits.length})</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Tap Queue to add instantly. Tap 🗑️ to remove.
                </p>
              </div>

              {topHits.length > 0 && (
                <button
                  onClick={resetDefaults}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline font-mono shrink-0"
                  title="Clear all saved top hits"
                >
                  Clear All
                </button>
              )}
            </div>

            {topHits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#0e142a] rounded-xl border border-dashed border-[#1c2548]">
                <Star className="w-8 h-8 mb-2 mx-auto text-amber-400/40" />
                <p className="font-bold text-slate-300">No Top Hits Saved Yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Tap the ⭐ star on any song from the Queue or Previous Songs to add it here for quick 1-tap selection!
                </p>
              </div>
            ) : (
              topHits.map((song) => {
                const starred = song.isStarred || isStarred(song.videoId);
                return (
                  <div
                    key={song.videoId}
                    className="p-2.5 rounded-xl bg-[#0e142a] border border-[#1c2548] hover:border-sky-500/60 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#141c38] border border-[#232f58] flex items-center justify-center shrink-0 overflow-hidden">
                        {song.thumbnailUrl ? (
                          <img
                            src={song.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-4 h-4 text-sky-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {starred && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          <span className="truncate">{song.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="text-amber-400 font-mono">
                            {song.genre || 'Party Track'}
                          </span>
                          <span>•</span>
                          <span className="truncate">{song.author}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleQueueSong(song)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold font-arcade tracking-wider uppercase shrink-0 shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Queue</span>
                      </button>

                      <button
                        onClick={(e) => handleRemoveTopHit(e, song.videoId, song.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Remove from Top Hits"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: PREVIOUS SONGS (HISTORY WITH STAR ⭐) */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-arcade flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>Previous Songs Played ({previousSongs.length})</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Star ⭐ any song to save it, or tap &ldquo;Sing&rdquo; to queue with 1 click.
                </p>
              </div>

              {previousSongs.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all previous songs history?')) {
                      clearHistory();
                      showToast('Previous songs history reset');
                    }
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-400 underline font-mono shrink-0"
                  title="Clear all previous songs"
                >
                  Clear All
                </button>
              )}
            </div>

            {previousSongs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#0e142a] rounded-xl border border-dashed border-[#1c2548]">
                <Music className="w-8 h-8 mb-2 mx-auto opacity-30 text-sky-400" />
                <p className="font-bold text-slate-300">No previous songs recorded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Once songs finish on the TV, they will appear here so you can star and re-sing them!
                </p>
              </div>
            ) : (
              previousSongs.map((song, index) => {
                const starred = isStarred(song.videoId);
                return (
                  <div
                    key={`${song.id}-${index}`}
                    className="p-2.5 rounded-xl bg-[#0e142a] border border-[#1c2548] hover:border-sky-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          className="w-12 h-9 rounded object-cover border border-[#202d58]"
                        />
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded bg-[#131b38] border border-sky-500/50 text-sky-300 text-[9px] font-mono font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[170px]">
                          {song.title}
                        </div>
                        <div className="text-[10px] font-mono text-sky-400 truncate">
                          🎤 {song.singerName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleToggleStar({
                            videoId: song.videoId,
                            title: song.title,
                            author: song.author,
                            thumbnailUrl: song.thumbnailUrl,
                            singerSuggestion: song.singerName,
                          })
                        }
                        className={`p-1.5 rounded-xl transition-transform active:scale-90 flex items-center justify-center ${
                          starred
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-400/60'
                            : 'bg-[#141c38] text-slate-400 hover:text-amber-300'
                        }`}
                        title={starred ? 'Starred in Top Hits' : 'Star song to add to Top Hits'}
                      >
                        <Star className={`w-3.5 h-3.5 ${starred ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleQueueSong(song)}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold font-arcade tracking-wider uppercase flex items-center gap-1 shadow-sm active:scale-95"
                        title="Re-queue this song"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Sing</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Guest Mobile Soundboard Footer (Pinned at bottom, ALWAYS visible without scrolling) */}
      <footer className="shrink-0 z-30 bg-[#0e1326] border-t border-[#1b2548] p-2 sm:p-2.5 flex items-center justify-around">
        <button
          onClick={() => handleSendReaction('airhorn')}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-amber-400 active:scale-95 transition-transform"
          title="Airhorn sound & screen shake effect"
        >
          <span className="text-base sm:text-lg">📢</span>
          <span className="text-[10px] font-mono">Airhorn</span>
        </button>

        <button
          onClick={() => handleSendReaction('applause')}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-sky-400 active:scale-95 transition-transform"
          title="Crowd applause & reaction bubbles"
        >
          <span className="text-base sm:text-lg">👏</span>
          <span className="text-[10px] font-mono">Applause</span>
        </button>

        <button
          onClick={() => handleSendReaction('cheer')}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-sky-300 active:scale-95 transition-transform"
          title="Party cheer & confetti burst"
        >
          <span className="text-base sm:text-lg">🎉</span>
          <span className="text-[10px] font-mono">Cheer TV</span>
        </button>

        <button
          onClick={() => setShowThemeModal(true)}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-purple-300 active:scale-95 transition-transform"
          title="Change TV Stage Background Theme"
        >
          <span className="text-base sm:text-lg">🎨</span>
          <span className="text-[10px] font-mono">TV Theme</span>
        </button>
      </footer>

      {/* TV Screen Background Theme Picker Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e142a] border border-sky-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c264a] pb-2.5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                <h3 className="font-arcade text-xs uppercase font-bold text-sky-300 tracking-wider">
                  TV Stage Background
                </h3>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Pick a theme to change the TV screen background in real time for everyone in the room:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {TV_BACKGROUND_THEMES.map((theme) => {
                const isActive = (roomState?.tvBackground || 'midnight') === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTvBackground(theme.id);
                      showToast(`🎨 TV Background set to ${theme.name}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      theme.preview
                    } ${
                      isActive
                        ? 'ring-2 ring-sky-400 border-sky-400 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{theme.icon}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-sky-400 font-bold" />}
                    </div>
                    <span className="text-xs font-bold font-heading truncate">{theme.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#141c38] hover:bg-[#1c274d] text-slate-300 text-xs font-arcade font-bold border border-[#232f58]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host DJ Takeover PIN Modal */}
      {showHostPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e142a] border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c264a] pb-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-arcade text-xs uppercase font-bold text-amber-300 tracking-wider">
                  Host DJ Takeover
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowHostPinModal(false);
                  setHostPinError(null);
                  setHostPinInput('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Only 1 Host DJ is permitted per room. The active host is currently{' '}
              <span className="font-bold text-amber-400">&ldquo;{otherHostName}&rdquo;</span>.
            </p>
            <p className="text-[11px] text-slate-400">
              To take over as Host DJ, enter the Room Code (<span className="text-sky-400 font-mono font-bold">{roomId}</span>) or host PIN:
            </p>

            {hostPinError && (
              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-[11px]">
                {hostPinError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleClaimHost(hostPinInput);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={hostPinInput}
                onChange={(e) => {
                  setHostPinInput(e.target.value);
                  setHostPinError(null);
                }}
                placeholder={`Enter ${roomId} or PIN`}
                className="w-full px-3 py-2 rounded-xl bg-[#131b38] border border-[#202d58] text-amber-400 font-mono font-bold text-sm focus:border-amber-400 focus:outline-none uppercase"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHostPinModal(false);
                    setHostPinError(null);
                    setHostPinInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#141c38] text-slate-400 text-xs font-arcade font-bold border border-[#232f58]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-arcade font-bold transition-all shadow-md active:scale-95"
                >
                  Take Over DJ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
