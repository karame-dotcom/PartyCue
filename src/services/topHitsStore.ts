export interface TopHitSong {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl?: string;
  singerSuggestion?: string;
  genre?: string;
  isStarred?: boolean;
  addedAt?: number;
}

const STORAGE_KEY = 'karaoke_top_hits_clean';
const TOP_HITS_CHANGE_EVENT = 'karaoke_top_hits_changed';

function getDefaultTopHits(): TopHitSong[] {
  return [];
}

export function loadTopHits(): TopHitSong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed loading top hits from localStorage:', err);
  }

  return [];
}

export function saveTopHits(hits: TopHitSong[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hits));
    window.dispatchEvent(new CustomEvent(TOP_HITS_CHANGE_EVENT, { detail: hits }));
  } catch (err) {
    console.warn('Failed saving top hits to localStorage:', err);
  }
}

export function isVideoStarred(videoId: string): boolean {
  if (!videoId) return false;
  const hits = loadTopHits();
  return hits.some((h) => h.videoId === videoId && h.isStarred);
}

export function toggleStarSong(song: {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl?: string;
  singerSuggestion?: string;
  genre?: string;
}): boolean {
  const hits = loadTopHits();
  const existingIdx = hits.findIndex((h) => h.videoId === song.videoId);

  let nowStarred = false;

  if (existingIdx >= 0) {
    if (hits[existingIdx].isStarred) {
      // If was custom added and now unstarred, remove it
      if (hits[existingIdx].addedAt && hits[existingIdx].addedAt! > 0) {
        hits.splice(existingIdx, 1);
        nowStarred = false;
      } else {
        hits[existingIdx].isStarred = false;
        nowStarred = false;
      }
    } else {
      hits[existingIdx].isStarred = true;
      nowStarred = true;
    }
  } else {
    // Add as newly starred song at the top!
    const newHit: TopHitSong = {
      videoId: song.videoId,
      title: song.title,
      author: song.author,
      thumbnailUrl: song.thumbnailUrl || `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`,
      singerSuggestion: song.singerSuggestion || 'Karaoke Fan',
      genre: song.genre || 'Party Pick',
      isStarred: true,
      addedAt: Date.now(),
    };
    hits.unshift(newHit);
    nowStarred = true;
  }

  saveTopHits(hits);
  return nowStarred;
}

export function removeTopHit(videoId: string) {
  const hits = loadTopHits();
  const filtered = hits.filter((h) => h.videoId !== videoId);
  saveTopHits(filtered);
}

export function resetToDefaultTopHits() {
  const defaults = getDefaultTopHits();
  saveTopHits(defaults);
  return defaults;
}
