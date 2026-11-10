/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HostScreen } from './components/HostScreen';
import { GuestRemote } from './components/GuestRemote';
import { Tv, Smartphone, KeyRound } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('KaraokeBox ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-3xl mb-4">
            🎤
          </div>
          <h2 className="text-xl font-bold font-heading mb-2">Stage Reset Needed</h2>
          <p className="text-slate-400 text-xs max-w-md mb-6">
            {this.state.error?.message || 'A minor display error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Refresh Stage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [role, setRole] = useState<'host' | 'guest'>('host');
  const [roomId, setRoomId] = useState<string>('PARTY-1');
  const [roomInput, setRoomInput] = useState<string>('PARTY-1');
  const [showRoomChanger, setShowRoomChanger] = useState<boolean>(false);

  // Initialize role and roomId from URL params or device heuristic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    const urlRoom = params.get('room');

    if (urlRoom) {
      const cleanRoom = urlRoom.toUpperCase().trim();
      setRoomId(cleanRoom);
      setRoomInput(cleanRoom);
    }

    if (urlRole === 'guest') {
      setRole('guest');
    } else if (urlRole === 'host') {
      setRole('host');
    } else {
      // If user opened on a small mobile device by default, show guest remote
      const isMobile = window.innerWidth <= 768;
      setRole(isMobile ? 'guest' : 'host');
    }
  }, []);

  const switchRole = (newRole: 'host' | 'guest') => {
    setRole(newRole);
    const url = new URL(window.location.href);
    url.searchParams.set('role', newRole);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url.toString());
  };

  const applyRoomChange = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomInput.toUpperCase().trim() || 'PARTY-1';
    setRoomId(clean);
    setShowRoomChanger(false);

    const url = new URL(window.location.href);
    url.searchParams.set('room', clean);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      <div className={`w-full max-w-full bg-[#0b0f1d] text-slate-100 flex flex-col font-sans overflow-hidden ${role === 'host' ? 'h-screen max-h-screen' : 'h-[100dvh] max-h-[100dvh]'}`}>
        {/* Top Universal Header Bar matching image_732af3cb.png */}
        <nav className="bg-[#0e1326] border-b border-[#1b2548] px-2.5 sm:px-4 lg:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs z-50 shrink-0 w-full max-w-full">
          {/* Left: Logo, Room Tag, Live status */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Logo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-200 text-base sm:text-lg">🎤</span>
              <span className="font-heading font-black tracking-wider text-sm sm:text-base text-white">
                KARAOKEBOX
              </span>
              <span className="font-heading font-black text-indigo-400 text-[10px] sm:text-xs tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30">
                LIVE
              </span>
            </div>

            {/* Room Tag Pill */}
            <button
              onClick={() => setShowRoomChanger((prev) => !prev)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-[#131b38] hover:bg-[#182348] border border-[#202d58] text-[11px] sm:text-xs font-mono transition-colors shrink-0"
              title="Click to Change Room Code"
            >
              <span className="text-slate-400 hidden xs:inline">Room</span>
              <span className="font-bold text-sky-400">{roomId}</span>
            </button>

            {/* Live Status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* View Switcher Toggle */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-[#101732] p-0.5 sm:p-1 rounded-xl border border-[#1d2952] shrink-0">
            <button
              onClick={() => switchRole('host')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                role === 'host'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">TV Stage</span>
              <span className="xs:hidden">TV</span>
            </button>

            <button
              onClick={() => switchRole('guest')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                role === 'guest'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Phone Remote</span>
              <span className="xs:hidden">Remote</span>
            </button>
          </div>
        </nav>

        {/* Change Room Code Drawer / Dropdown */}
        {showRoomChanger && (
          <div className="bg-slate-900 border-b border-amber-500/40 p-3 sm:p-4 animate-in slide-in-from-top shrink-0">
            <form
              onSubmit={applyRoomChange}
              className="max-w-md mx-auto flex items-center gap-2"
            >
              <div className="flex-1">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Enter Room Code / Pin
                </label>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="e.g. PARTY-1, LOUNGE-9"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-400 uppercase"
                />
              </div>
              <button
                type="submit"
                className="mt-5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Switch Room
              </button>
            </form>
          </div>
        )}

        {/* Active View: Host Screen vs Guest Remote */}
        <div className="flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col">
          {role === 'host' ? <HostScreen roomId={roomId} /> : <GuestRemote roomId={roomId} />}
        </div>
      </div>
    </ErrorBoundary>
  );
}
