import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomState, KaraokeSong, FirebaseConnectionConfig } from '../types/karaoke';
import {
  getStoredFirebaseConfig,
  initializeFirebaseRealtime,
  subscribeToFirebaseRoom,
  syncHostStateToFirebase,
  addSongToFirebaseQueue,
} from '../services/firebaseRealtime';

const DEVICE_ID_KEY = 'karaoke_device_id';
const SINGER_NAME_KEY = 'karaoke_singer_name';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getSavedSingerName(): string {
  return localStorage.getItem(SINGER_NAME_KEY) || '';
}

export function saveSingerName(name: string) {
  localStorage.setItem(SINGER_NAME_KEY, name.trim());
}

export function useKaraokeRoom(roomId: string, isHost: boolean = false) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [firebaseActive, setFirebaseActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  // 1. Setup SSE Connection (Zero-config instant real-time sync)
  useEffect(() => {
    const cleanId = (roomId || 'party-1').toUpperCase().trim();
    const streamUrl = `/api/rooms/${encodeURIComponent(cleanId)}/stream`;

    let active = true;

    function connectSSE() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!active) return;
        setIsConnected(true);
        setError(null);
      };

      es.onmessage = (event) => {
        if (!active) return;
        try {
          const data: RoomState = JSON.parse(event.data);
          setRoomState(data);
        } catch (err) {
          console.error('Failed to parse SSE room message:', err);
        }
      };

      es.onerror = () => {
        if (!active) return;
        setIsConnected(false);
        // Will auto reconnect by browser, but fallback fetch after delay
        setTimeout(() => {
          if (active && (!es || es.readyState === EventSource.CLOSED)) {
            connectSSE();
          }
        }, 3000);
      };
    }

    connectSSE();

    // Initial fetch to get immediate data without waiting for first event
    fetch(`/api/rooms/${encodeURIComponent(cleanId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setRoomState(data);
      })
      .catch((err) => console.warn('Initial room fetch failed:', err));

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [roomId]);

  // 2. Setup Firebase Realtime Database Sync (Optional / Configurable)
  useEffect(() => {
    const fbConfig = getStoredFirebaseConfig();
    if (!fbConfig.enabled || !fbConfig.databaseURL) {
      setFirebaseActive(false);
      return;
    }

    const cleanId = (roomId || 'party-1').toUpperCase().trim();
    const db = initializeFirebaseRealtime(fbConfig);
    if (!db) {
      setFirebaseActive(false);
      return;
    }

    setFirebaseActive(true);

    // Subscribe to Firebase RTDB updates
    const unsub = subscribeToFirebaseRoom(db, cleanId, (fbState) => {
      // If we are guest or host, sync with Firebase state
      setRoomState((prev) => {
        if (!prev) return fbState;
        // Merge newest timestamp
        if ((fbState.lastUpdated || 0) >= (prev.lastUpdated || 0)) {
          return fbState;
        }
        return prev;
      });
    });

    return () => {
      unsub();
    };
  }, [roomId]);

  // When Host updates state locally and Firebase is enabled, sync to Firebase RTDB
  const syncToFirebaseIfActive = useCallback(
    async (newState: RoomState) => {
      const fbConfig = getStoredFirebaseConfig();
      if (fbConfig.enabled && fbConfig.databaseURL) {
        const db = initializeFirebaseRealtime(fbConfig);
        if (db) {
          try {
            await syncHostStateToFirebase(db, newState);
          } catch (err) {
            console.warn('Firebase RTDB sync error:', err);
          }
        }
      }
    },
    []
  );

  // 3. Actions: Add Song to Queue (Available to both Guest and Host)
  const addSong = useCallback(
    async (song: Omit<KaraokeSong, 'id' | 'queuedAt'>) => {
      const cleanId = (roomId || 'party-1').toUpperCase().trim();
      const payload = {
        ...song,
        queuedByDeviceId: getDeviceId(),
      };

      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(cleanId)}/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data: { error?: string; room?: RoomState; song?: KaraokeSong } = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(res.ok ? 'Unexpected response format' : `Server error (${res.status})`);
        }

        if (!res.ok) {
          throw new Error(data.error || 'Failed to add song to queue');
        }

        if (data.room) {
          setRoomState(data.room);
          syncToFirebaseIfActive(data.room);
        }

        // Also push directly to Firebase RTDB if enabled
        const fbConfig = getStoredFirebaseConfig();
        if (fbConfig.enabled && fbConfig.databaseURL && data.song) {
          const db = initializeFirebaseRealtime(fbConfig);
          if (db) {
            addSongToFirebaseQueue(db, cleanId, data.song).catch(console.warn);
          }
        }

        return data.song;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error adding song';
        setError(message);
        throw err;
      }
    },
    [roomId, syncToFirebaseIfActive]
  );

  // 4. Host Admin Master Controls
  const sendHostAction = useCallback(
    async (action: string, payload?: Record<string, unknown>) => {
      const cleanId = (roomId || 'party-1').toUpperCase().trim();
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(cleanId)}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });

        const text = await res.text();
        let data: { error?: string; room?: RoomState } = {};
        try {
          data = JSON.parse(text);
        } catch {
          // If server returned non-JSON (like HTML during route changes or reload), ignore gracefully
          return;
        }

        if (!res.ok) {
          console.warn(`Host action ${action} failed:`, data.error);
          return { success: false, error: data.error || 'Action failed' };
        }

        if (data.room) {
          setRoomState(data.room);
          syncToFirebaseIfActive(data.room);
        }
        return { success: true };
      } catch (err) {
        console.warn(`Host action error (${action}):`, err);
        return { success: false, error: 'Network error performing action' };
      }
    },
    [roomId, syncToFirebaseIfActive]
  );

  const skipSong = useCallback(() => {
    return sendHostAction('skip');
  }, [sendHostAction]);

  const replaySong = useCallback(() => {
    return sendHostAction('replay');
  }, [sendHostAction]);

  const deleteSong = useCallback(
    (songId: string) => {
      return sendHostAction('delete', { songId });
    },
    [sendHostAction]
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      return sendHostAction('reorder', { fromIndex, toIndex });
    },
    [sendHostAction]
  );

  const updatePlayback = useCallback(
    (isPlaying: boolean, currentTime?: number, duration?: number) => {
      return sendHostAction('playback', { isPlaying, currentTime, duration });
    },
    [sendHostAction]
  );

  const triggerPartyEffect = useCallback(
    (type: 'airhorn' | 'cheer' | 'applause' | 'confetti' | 'disco', singer?: string) => {
      return sendHostAction('partyEffect', { type, singer });
    },
    [sendHostAction]
  );

  const requestScore = useCallback(() => {
    return sendHostAction('requestScore');
  }, [sendHostAction]);

  const clearQueue = useCallback(() => {
    return sendHostAction('clearQueue');
  }, [sendHostAction]);

  const clearHistory = useCallback(() => {
    return sendHostAction('clearHistory');
  }, [sendHostAction]);

  const setTvBackground = useCallback(
    (background: string) => {
      return sendHostAction('setTvBackground', { background });
    },
    [sendHostAction]
  );

  const claimHostDj = useCallback(
    (deviceId: string, hostName: string, pin?: string) => {
      return sendHostAction('claimHostDj', { deviceId, hostName, pin });
    },
    [sendHostAction]
  );

  const releaseHostDj = useCallback(
    (deviceId: string) => {
      return sendHostAction('releaseHostDj', { deviceId });
    },
    [sendHostAction]
  );

  const toggleCompetitionMode = useCallback(
    (enabled?: boolean) => {
      return sendHostAction('toggleCompetitionMode', { enabled });
    },
    [sendHostAction]
  );

  const voteSong = useCallback(
    (score: number, voterName?: string) => {
      return sendHostAction('voteSong', {
        deviceId: getDeviceId(),
        score,
        voterName: voterName || getSavedSingerName() || 'Guest',
      });
    },
    [sendHostAction]
  );

  const submitMicTune = useCallback(
    (pitch: number, energy: number) => {
      return sendHostAction('submitMicTune', { pitch, energy });
    },
    [sendHostAction]
  );

  return {
    roomState,
    isConnected,
    firebaseActive,
    error,
    addSong,
    requestScore,
    skipSong,
    replaySong,
    deleteSong,
    reorderQueue,
    updatePlayback,
    triggerPartyEffect,
    clearQueue,
    clearHistory,
    setTvBackground,
    claimHostDj,
    releaseHostDj,
    toggleCompetitionMode,
    voteSong,
    submitMicTune,
  };
}
