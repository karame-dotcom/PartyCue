import React from 'react';

interface ThemeStageVisualsProps {
  theme?: string;
}

export const ThemeStageVisuals: React.FC<ThemeStageVisualsProps> = ({ theme = 'midnight' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* 1. NEON TOKYO: Sweeping Laser Beams & Perspective Grid Lines */}
      {theme === 'neon-tokyo' && (
        <div className="absolute inset-0">
          {/* Sweeping Pink Laser */}
          <div
            className="absolute top-0 left-1/4 w-[2px] h-[150vh] bg-gradient-to-b from-pink-400 via-fuchsia-500 to-transparent shadow-[0_0_15px_#ec4899] animate-laser-1 origin-top"
            style={{ filter: 'drop-shadow(0 0 10px #f43f5e)' }}
          />

          {/* Sweeping Cyan Laser */}
          <div
            className="absolute top-0 right-1/4 w-[2px] h-[150vh] bg-gradient-to-b from-cyan-300 via-sky-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-laser-2 origin-top"
            style={{ filter: 'drop-shadow(0 0 10px #38bdf8)' }}
          />

          {/* Horizontal Scanning Laser Bar */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_0_20px_#d946ef] animate-laser-scan opacity-60" />

          {/* Perspective Synthwave Floor Grid on Stage Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-[linear-gradient(to_bottom,transparent,rgba(236,72,153,0.1))] overflow-hidden">
            <div
              className="w-full h-full opacity-35"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(236, 72, 153, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
                backgroundSize: '40px 24px',
                transform: 'perspective(280px) rotateX(60deg)',
                transformOrigin: 'bottom center',
              }}
            />
          </div>
        </div>
      )}

      {/* 2. STARLIGHT COSMIC: Full-Screen Dense Starfield, Rotating Galaxy & Shooting Stars */}
      {theme === 'starlight' && (
        <div className="absolute inset-0">
          {/* Rotating Galactic Core Spiral */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18)_0%,rgba(147,51,234,0.12)_40%,transparent_70%)] animate-galaxy-spin blur-2xl" />

          {/* 3 Staggered Diagonal Shooting Stars across the screen */}
          <div className="absolute top-8 right-24 w-48 h-[2px] bg-gradient-to-r from-transparent via-cyan-200 to-white shadow-[0_0_12px_#fff] animate-shooting-star-1" />
          <div className="absolute top-1/3 right-1/4 w-60 h-[2px] bg-gradient-to-r from-transparent via-indigo-200 to-white shadow-[0_0_15px_#a5b4fc] animate-shooting-star-2" />
          <div className="absolute top-2/3 right-16 w-40 h-[2px] bg-gradient-to-r from-transparent via-sky-300 to-white shadow-[0_0_10px_#38bdf8] animate-shooting-star-3" />

          {/* Dense Full-Screen Twinkling Stars across all regions */}
          <div className="absolute top-8 left-12 text-sky-200 animate-twinkle-fast text-xs">✦</div>
          <div className="absolute top-16 left-1/4 text-indigo-300 animate-twinkle-slow text-base">★</div>
          <div className="absolute top-24 left-1/2 text-white animate-twinkle-mid text-xs">✦</div>
          <div className="absolute top-12 right-1/3 text-amber-200 animate-twinkle-mid text-sm">✦</div>
          <div className="absolute top-20 right-16 text-cyan-200 animate-twinkle-fast text-xs">★</div>

          <div className="absolute top-1/3 left-8 text-white animate-twinkle-slow text-[10px]">✦</div>
          <div className="absolute top-1/3 left-1/3 text-sky-300 animate-twinkle-fast text-sm">★</div>
          <div className="absolute top-1/2 left-1/6 text-indigo-200 animate-twinkle-mid text-xs">✦</div>
          <div className="absolute top-1/2 right-1/4 text-cyan-300 animate-twinkle-slow text-sm">✦</div>
          <div className="absolute top-1/3 right-12 text-sky-200 animate-twinkle-mid text-xs">★</div>

          <div className="absolute bottom-1/3 left-16 text-indigo-300 animate-twinkle-mid text-base">★</div>
          <div className="absolute bottom-1/3 left-2/5 text-sky-200 animate-twinkle-slow text-xs">✦</div>
          <div className="absolute bottom-1/2 right-1/3 text-white animate-twinkle-fast text-xs">★</div>
          <div className="absolute bottom-1/3 right-20 text-cyan-200 animate-twinkle-mid text-sm">✦</div>

          <div className="absolute bottom-16 left-28 text-sky-300 animate-twinkle-fast text-xs">★</div>
          <div className="absolute bottom-24 left-1/2 text-indigo-200 animate-twinkle-slow text-sm">✦</div>
          <div className="absolute bottom-12 right-1/4 text-white animate-twinkle-mid text-xs">✦</div>
          <div className="absolute bottom-20 right-32 text-cyan-300 animate-twinkle-fast text-base">★</div>

          {/* Deep Nebula Cosmic Glows */}
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/5 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
        </div>
      )}

      {/* 3. DISCO CLUB: Authentic 70s Saturday Night Fever - Hanging Mirror Ball & Flashing Dance Floor */}
      {theme === 'disco-club' && (
        <div className="absolute inset-0">
          {/* Hanging Disco Mirror Ball at Top Center */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            {/* Hanging Cord / Chain */}
            <div className="w-[2px] h-14 bg-gradient-to-b from-slate-500 via-amber-200 to-slate-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />

            {/* Rotating Mirrored Sphere */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.6),inset_0_0_20px_rgba(255,255,255,0.8)] border border-slate-300/60 overflow-hidden bg-[radial-gradient(circle_at_35%_35%,#ffffff_0%,#cbd5e1_30%,#64748b_70%,#1e293b_100%)]">
              {/* Checkerboard Mirror Facet Grid */}
              <div
                className="absolute inset-0 opacity-75 animate-disco-spin"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, transparent 2px, transparent 8px), repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0px, transparent 2px, transparent 8px)',
                  backgroundSize: '8px 8px',
                }}
              />
              {/* High-glare specular hot spot */}
              <div className="absolute top-3 left-4 w-6 h-6 rounded-full bg-white/90 blur-xs" />
            </div>

            {/* Radiant Rotating 360-Degree Disco Prism Beams */}
            <div className="absolute -top-10 w-[900px] h-[900px] animate-disco-spin opacity-35 pointer-events-none -z-10">
              <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(245,158,11,0.6)_15deg,transparent_30deg,rgba(236,72,153,0.6)_45deg,transparent_60deg,rgba(6,182,212,0.6)_75deg,transparent_90deg,rgba(168,85,247,0.6)_105deg,transparent_120deg,rgba(251,191,36,0.6)_135deg,transparent_150deg,rgba(16,185,129,0.6)_165deg,transparent_180deg)] blur-xl" />
            </div>
          </div>

          {/* Sweeping Warm Disco Spotlights */}
          <div
            className="absolute top-0 left-0 w-[500px] h-[120vh] origin-top-left animate-disco-spotlight-l opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.5) 0%, rgba(251, 191, 36, 0.1) 50%, transparent 80%)',
              clipPath: 'polygon(0 0, 45% 100%, 90% 100%)',
              filter: 'blur(12px)',
            }}
          />
          <div
            className="absolute top-0 right-0 w-[500px] h-[120vh] origin-top-right animate-disco-spotlight-r opacity-30"
            style={{
              background: 'linear-gradient(225deg, rgba(236, 72, 153, 0.5) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 80%)',
              clipPath: 'polygon(100% 0, 10% 100%, 55% 100%)',
              filter: 'blur(12px)',
            }}
          />

          {/* Saturday Night Fever Multi-Colored Illuminated Dance Floor Tiles */}
          <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-52 overflow-hidden pointer-events-none">
            <div
              className="w-full h-full flex flex-col justify-end p-2 gap-1.5 opacity-90"
              style={{
                transform: 'perspective(400px) rotateX(55deg)',
                transformOrigin: 'bottom center',
              }}
            >
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex gap-2 justify-center w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                    const animClass =
                      (row + col) % 3 === 0
                        ? 'animate-disco-tile-1'
                        : (row + col) % 3 === 1
                        ? 'animate-disco-tile-2'
                        : 'animate-disco-tile-3';
                    return (
                      <div
                        key={col}
                        className={`flex-1 h-9 sm:h-12 rounded-sm border ${animClass} transition-colors duration-200`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Golden & Silver Sparkle Glints */}
          <div className="absolute top-20 left-1/4 text-amber-300 animate-twinkle-fast text-2xl drop-shadow-[0_0_10px_#f59e0b]">✨</div>
          <div className="absolute top-32 right-1/4 text-fuchsia-300 animate-twinkle-mid text-xl drop-shadow-[0_0_10px_#ec4899]">🪩</div>
          <div className="absolute top-48 left-1/3 text-cyan-300 animate-twinkle-slow text-lg drop-shadow-[0_0_10px_#06b6d4]">✨</div>
          <div className="absolute top-28 right-1/6 text-yellow-200 animate-twinkle-fast text-xl drop-shadow-[0_0_10px_#fde047]">✦</div>
        </div>
      )}

      {/* 4. SUNSET LOUNGE: Floating Translucent Bubbles & Sunset Orbs */}
      {theme === 'sunset-lounge' && (
        <div className="absolute inset-0">
          {/* Smooth Floating Translucent Bubbles with Color Gradients */}
          <div className="absolute left-[10%] w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500/30 to-amber-300/40 border border-rose-300/40 backdrop-blur-xs shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-bubble-1" />
          <div className="absolute left-[30%] w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500/30 to-pink-300/40 border border-pink-300/40 backdrop-blur-xs shadow-[0_0_20px_rgba(236,72,153,0.3)] animate-bubble-2" />
          <div className="absolute left-[55%] w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/30 to-rose-300/40 border border-amber-300/40 backdrop-blur-xs shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-bubble-3" />
          <div className="absolute left-[75%] w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600/25 to-violet-400/35 border border-purple-300/35 backdrop-blur-xs shadow-[0_0_18px_rgba(168,85,247,0.3)] animate-bubble-4" />
          <div className="absolute left-[90%] w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400/30 to-yellow-300/35 border border-amber-200/40 backdrop-blur-xs shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-bubble-2" style={{ animationDelay: '4s' }} />

          {/* Warm Sunset Glow Orbs */}
          <div className="absolute -bottom-20 left-1/3 w-[600px] h-72 bg-gradient-to-t from-rose-600/25 via-amber-500/20 to-transparent blur-3xl" />
        </div>
      )}

      {/* 5. CYBER MATRIX: Full-Screen Dense Digital Rain & Laser Grid */}
      {theme === 'cyber-matrix' && (
        <div className="absolute inset-0 font-mono text-[11px] text-emerald-400/80 select-none overflow-hidden">
          {/* Dense 16-Column Digital Rain across entire screen width */}
          {[
            { left: '3%', anim: 'animate-matrix-fast', text: '0 1 K A R A O K E 1 0 1 1 0 9' },
            { left: '9%', anim: 'animate-matrix-mid', delay: '0.8s', text: '1 0 V O C A L 1 0 0 1 M U' },
            { left: '16%', anim: 'animate-matrix-slow', delay: '1.5s', text: 'B E A T 1 0 1 S T A G E 1' },
            { left: '22%', anim: 'animate-matrix-fast', delay: '2.1s', text: '1 1 0 P A R T Y 0 1 0 1 0' },
            { left: '29%', anim: 'animate-matrix-mid', delay: '0.4s', text: 'K B O X 9 9 1 0 0 1 B I T' },
            { left: '36%', anim: 'animate-matrix-slow', delay: '2.8s', text: '0 1 1 0 1 0 1 0 M I C 1' },
            { left: '43%', anim: 'animate-matrix-fast', delay: '1.2s', text: 'S O U N D 1 0 1 0 T U N E' },
            { left: '50%', anim: 'animate-matrix-mid', delay: '1.9s', text: '1 0 0 1 D J 1 0 1 L I V E' },
            { left: '57%', anim: 'animate-matrix-slow', delay: '0.6s', text: 'A U D I O 1 1 0 0 P O W' },
            { left: '64%', anim: 'animate-matrix-fast', delay: '2.4s', text: 'K A R A 1 0 1 0 F L O W' },
            { left: '71%', anim: 'animate-matrix-mid', delay: '1.0s', text: '1 0 1 H Y P E 1 0 0 1 1' },
            { left: '78%', anim: 'animate-matrix-slow', delay: '1.7s', text: 'S T A G E 1 0 1 R E A L' },
            { left: '85%', anim: 'animate-matrix-fast', delay: '0.3s', text: '0 1 1 0 V O X 1 0 1 0 1' },
            { left: '92%', anim: 'animate-matrix-mid', delay: '2.2s', text: '1 0 0 1 M A T R I X 0 1' },
            { left: '97%', anim: 'animate-matrix-slow', delay: '1.4s', text: '9 9 1 0 K B O X 1 0 1 1' },
          ].map((col, idx) => (
            <div
              key={idx}
              className={`absolute top-0 w-4 space-y-1 ${col.anim}`}
              style={{ left: col.left, animationDelay: col.delay || '0s' }}
            >
              {col.text.split(' ').map((char, i) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? 'text-emerald-200 font-bold drop-shadow-[0_0_8px_#10b981]'
                      : i % 2 === 0
                      ? 'text-emerald-400/90'
                      : 'text-teal-400/70'
                  }
                >
                  {char}
                </div>
              ))}
            </div>
          ))}

          {/* Perspective Cyber Floor Grid on Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-[linear-gradient(to_bottom,transparent,rgba(16,185,129,0.15))] overflow-hidden">
            <div
              className="w-full h-full opacity-40"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(16, 185, 129, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(20, 184, 166, 0.4) 1px, transparent 1px)',
                backgroundSize: '40px 24px',
                transform: 'perspective(280px) rotateX(60deg)',
                transformOrigin: 'bottom center',
              }}
            />
          </div>

          {/* Dual Emerald Scanning Lasers */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-laser-scan opacity-80" />
        </div>
      )}

      {/* 6. MIDNIGHT NAVY: Full-Screen Aurora Curtains, Sonar Waves & Soundwave Equalizer */}
      {theme === 'midnight' && (
        <div className="absolute inset-0">
          {/* Dynamic Aurora Borealis Wave Curtains rippling across the upper half */}
          <div className="absolute -top-24 left-0 right-0 h-[50vh] bg-gradient-to-b from-sky-500/20 via-blue-600/15 to-transparent blur-3xl animate-aurora-1" />
          <div className="absolute -top-12 left-1/4 right-0 h-[45vh] bg-gradient-to-b from-teal-400/15 via-sky-600/15 to-transparent blur-3xl animate-aurora-2" />

          {/* Central Acoustic Sonar Pulse Waves radiating across the whole stage */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-400/25 animate-sonar" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-teal-400/20 animate-sonar"
            style={{ animationDelay: '3s' }}
          />

          {/* Full-Width Audio Frequency Equalizer Visualizer across stage bottom */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-1 h-32 opacity-35">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-sky-400 via-blue-500 to-teal-300 rounded-full animate-waveform"
                style={{
                  height: `${20 + Math.sin(i * 0.35) * 45 + Math.cos(i * 0.2) * 30}%`,
                  animationDelay: `${(i % 12) * 0.22}s`,
                }}
              />
            ))}
          </div>

          {/* Floating Stardust & Music Notes across the backdrop */}
          <div className="absolute top-16 left-12 text-sky-300/60 animate-twinkle-fast text-sm">✦</div>
          <div className="absolute top-28 left-1/3 text-blue-300/50 animate-twinkle-slow text-base">♪</div>
          <div className="absolute top-20 right-1/4 text-teal-300/60 animate-twinkle-mid text-xs">✦</div>
          <div className="absolute top-36 right-16 text-sky-400/50 animate-twinkle-fast text-base">♫</div>
          <div className="absolute bottom-36 left-20 text-sky-300/50 animate-twinkle-mid text-xs">✦</div>
          <div className="absolute bottom-44 right-1/3 text-blue-300/60 animate-twinkle-slow text-sm">♪</div>
        </div>
      )}
    </div>
  );
};
