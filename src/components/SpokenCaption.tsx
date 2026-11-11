import React from 'react';

/** Caption that lights up each word as the announcer says it. */
export const SpokenCaption: React.FC<{ text: string; spokenTo: number; className?: string }> = ({
  text,
  spokenTo,
  className = 'text-2xl sm:text-4xl',
}) => {
  const parts = text.split(/(\s+)/);
  let pos = 0;
  return (
    <p className={`max-w-4xl text-center font-bold leading-snug px-4 ${className}`}>
      {parts.map((part, i) => {
        const start = pos;
        pos += part.length;
        if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
        const said = start <= spokenTo;
        return (
          <span
            key={i}
            className={`transition-colors duration-200 ${
              said ? 'text-white drop-shadow-[0_0_18px_rgba(56,189,248,0.6)]' : 'text-slate-600'
            }`}
          >
            {part}
          </span>
        );
      })}
    </p>
  );
};
