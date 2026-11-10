import { useState, useEffect, useCallback } from 'react';
import {
  TopHitSong,
  loadTopHits,
  toggleStarSong,
  removeTopHit,
  isVideoStarred,
  resetToDefaultTopHits,
} from '../services/topHitsStore';

export function useTopHits() {
  const [topHits, setTopHits] = useState<TopHitSong[]>(() => loadTopHits());

  useEffect(() => {
    const handleUpdate = () => {
      setTopHits(loadTopHits());
    };

    window.addEventListener('karaoke_top_hits_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('karaoke_top_hits_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggleStar = useCallback(
    (song: {
      videoId: string;
      title: string;
      author: string;
      thumbnailUrl?: string;
      singerSuggestion?: string;
      genre?: string;
    }) => {
      const isNowStarred = toggleStarSong(song);
      setTopHits(loadTopHits());
      return isNowStarred;
    },
    []
  );

  const removeHit = useCallback((videoId: string) => {
    removeTopHit(videoId);
    setTopHits(loadTopHits());
  }, []);

  const isStarred = useCallback((videoId: string) => {
    return isVideoStarred(videoId);
  }, []);

  const resetDefaults = useCallback(() => {
    const defaults = resetToDefaultTopHits();
    setTopHits(defaults);
  }, []);

  return {
    topHits,
    toggleStar,
    removeHit,
    isStarred,
    resetDefaults,
  };
}
