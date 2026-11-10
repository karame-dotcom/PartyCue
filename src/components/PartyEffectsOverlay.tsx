import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface PartyEffectsOverlayProps {
  effect: {
    type: 'airhorn' | 'cheer' | 'applause' | 'confetti' | 'disco';
    singer?: string;
    timestamp: number;
  } | null | undefined;
}

export const PartyEffectsOverlay: React.FC<PartyEffectsOverlayProps> = ({ effect }) => {
  const [activeEffect, setActiveEffect] = useState<typeof effect>(null);
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: number; delay: number; icon: string; size: number }>>([]);

  useEffect(() => {
    if (!effect?.timestamp) return;

    setActiveEffect(effect);

    if (effect.type === 'airhorn') {
      // Golden confetti sparks on airhorn
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#d97706'],
      });
    } else if (effect.type === 'applause') {
      // Generate randomized floating reaction bubbles
      const emojis = ['👏', '👏', '💖', '⭐', '🎤', '✨', '🙌', '🔥'];
      const newBubbles = Array.from({ length: 14 }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 80 + 10, // 10% to 90% width
        delay: Math.random() * 0.6,
        icon: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.floor(Math.random() * 16) + 24, // 24px to 40px
      }));
      setBubbles(newBubbles);
    } else if (effect.type === 'cheer' || effect.type === 'confetti') {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#06b6d4', '#f59e0b', '#10b981'],
      });
    }

    const timer = setTimeout(() => {
      setActiveEffect(null);
      setBubbles([]);
    }, 2500);

    return () => clearTimeout(timer);
  }, [effect?.timestamp, effect?.type]);

  if (!activeEffect) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* 1. AIRHORN SCREEN EFFECT */}
      {activeEffect.type === 'airhorn' && (
        <div className="relative w-full h-full animate-screen-shake flex items-center justify-center">
          {/* Radial Expanding Shockwaves */}
          <div className="absolute w-72 h-72 rounded-full border-4 border-amber-400 bg-amber-500/10 animate-shockwave" />
          <div className="absolute w-96 h-96 rounded-full border-2 border-yellow-300 animate-shockwave" style={{ animationDelay: '0.15s' }} />

          {/* Center Banner */}
          <div className="relative px-6 py-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400 text-amber-300 shadow-2xl neon-glow-amber animate-in zoom-in-75 duration-200 flex items-center gap-3">
            <span className="text-4xl animate-bounce">📢</span>
            <div>
              <div className="text-base md:text-xl font-black font-arcade uppercase tracking-wider text-amber-400 drop-shadow">
                AIRHORN BLAST!
              </div>
              {activeEffect.singer && (
                <div className="text-xs font-mono text-slate-300">
                  Hyped by {activeEffect.singer}
                </div>
              )}
            </div>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>🔊</span>
          </div>

          {/* Floating Horn Mini Icons */}
          <div className="absolute top-1/4 left-1/4 text-3xl animate-bounce">📢</div>
          <div className="absolute bottom-1/4 right-1/4 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎺</div>
          <div className="absolute top-1/3 right-1/5 text-3xl animate-bounce" style={{ animationDelay: '0.15s' }}>💥</div>
        </div>
      )}

      {/* 2. APPLAUSE SCREEN EFFECT */}
      {activeEffect.type === 'applause' && (
        <div className="relative w-full h-full flex flex-col justify-end items-center pb-12">
          {/* Center Banner */}
          <div className="absolute top-16 px-6 py-3 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 shadow-2xl neon-glow-cyan animate-in slide-in-from-top-6 duration-300 flex items-center gap-3">
            <span className="text-3xl animate-pulse">👏</span>
            <div>
              <div className="text-base md:text-xl font-black font-arcade uppercase tracking-wider text-cyan-400 drop-shadow">
                STANDING OVATION!
              </div>
              {activeEffect.singer && (
                <div className="text-xs font-mono text-slate-300">
                  Applause from {activeEffect.singer}
                </div>
              )}
            </div>
            <span className="text-3xl animate-pulse" style={{ animationDelay: '0.15s' }}>👏</span>
          </div>

          {/* Floating Reaction Bubbles Rising from Bottom */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              className="absolute bottom-6 animate-float-up drop-shadow-lg"
              style={{
                left: `${b.left}%`,
                animationDelay: `${b.delay}s`,
                fontSize: `${b.size}px`,
              }}
            >
              {b.icon}
            </div>
          ))}
        </div>
      )}

      {/* 3. CHEER / CONFETTI EFFECT BANNER */}
      {(activeEffect.type === 'cheer' || activeEffect.type === 'confetti') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="px-6 py-3.5 rounded-2xl bg-slate-950/95 border-2 border-fuchsia-400 text-fuchsia-300 shadow-2xl neon-glow-pink animate-in zoom-in-75 duration-200 flex items-center gap-3">
            <span className="text-4xl animate-bounce">🎉</span>
            <div>
              <div className="text-base md:text-xl font-black font-arcade uppercase tracking-wider text-fuchsia-400 drop-shadow">
                PARTY CHEER!
              </div>
              {activeEffect.singer && (
                <div className="text-xs font-mono text-slate-300">
                  Hyped by {activeEffect.singer}
                </div>
              )}
            </div>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.15s' }}>✨</span>
          </div>
        </div>
      )}
    </div>
  );
};
