export interface AIScoreResult {
  score: number;
  grade: string;
  gradeColor: string;
  comment: string;
  energyRating: number;
  pitchRating: number;
  passionRating: number;
}

const WITTY_CRITIQUES = [
  'High energy! Pitch was questionable, but passion was 10/10!',
  'Vocal cords were working overtime! The whole room was vibrating with pure soul!',
  '100% heart, 90% accuracy, 200% entertainment value. You owned that stage!',
  'Freddie Mercury just smiled down from rock-and-roll heaven. Legendary delivery!',
  'That high note almost shattered the beer glasses, and we respect you for it!',
  'Microphone technique was bold, lyrics were 95% improvised, charisma was off the charts!',
  'Simon Cowell would be speechless, but the karaoke bar is screaming for an encore!',
  'Unapologetic enthusiasm! If karaoke were an Olympic event, you are taking home gold!',
  'Pitch-perfect emotion! You sang that like your ex was standing by the jukebox!',
  'Grammy committee has officially been notified. Phenomenal crowd connection!',
  'Slight key modulation in the chorus, but you sold it with pure confidence and a power stance!',
  'Warning: Standing ovation detected! That was an absolute party showstopper!',
  'Incredible breath control! Were you secretly an 80s rock icon in a past life?',
  'Bold song choice executed with undeniable rockstar swagger. That is how it is done!',
  'The vibrato was electric! The audience is still buzzing from that final chorus!',
];

export function generateKaraokeScore(singerName: string, songTitle: string): AIScoreResult {
  // Random score between 80 and 100
  const score = Math.floor(Math.random() * 21) + 80;

  let grade = 'A';
  let gradeColor = 'text-cyan-400 border-cyan-400 bg-cyan-950/80';

  if (score >= 98) {
    grade = 'S+ LEGENDARY';
    gradeColor = 'text-amber-300 border-amber-400 bg-amber-950/80 neon-glow-amber';
  } else if (score >= 94) {
    grade = 'S SUPERSTAR';
    gradeColor = 'text-fuchsia-300 border-fuchsia-400 bg-fuchsia-950/80 neon-glow-pink';
  } else if (score >= 89) {
    grade = 'A+ CROWD PLEASER';
    gradeColor = 'text-cyan-300 border-cyan-400 bg-cyan-950/80 neon-glow-cyan';
  } else if (score >= 84) {
    grade = 'A CERTIFIED BANGER';
    gradeColor = 'text-emerald-300 border-emerald-400 bg-emerald-950/80';
  } else {
    grade = 'B+ PARTY ANIMAL';
    gradeColor = 'text-purple-300 border-purple-400 bg-purple-950/80';
  }

  // Pick a random witty critique
  const comment = WITTY_CRITIQUES[Math.floor(Math.random() * WITTY_CRITIQUES.length)];

  return {
    score,
    grade,
    gradeColor,
    comment,
    energyRating: Math.floor(Math.random() * 6) + 95, // 95-100%
    pitchRating: Math.floor(Math.random() * 20) + 80, // 80-100%
    passionRating: 100, // Always 100% passion!
  };
}
