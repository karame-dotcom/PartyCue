import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  Unsubscribe,
  Database,
  push,
} from 'firebase/database';
import { FirebaseConnectionConfig, RoomState, KaraokeSong } from '../types/karaoke';

const STORAGE_KEY = 'karaoke_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed reading firebase config from storage', err);
  }
  return {
    databaseURL: '',
    apiKey: '',
    projectId: '',
    authDomain: '',
    appId: '',
    enabled: false,
  };
}

export function saveStoredFirebaseConfig(config: FirebaseConnectionConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed saving firebase config', err);
  }
}

let firebaseApp: FirebaseApp | null = null;
let realtimeDb: Database | null = null;

export function initializeFirebaseRealtime(config: FirebaseConnectionConfig): Database | null {
  if (!config.enabled || !config.databaseURL) {
    return null;
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey || 'AIzaSyDemo-Key-Not-Strictly-Needed-For-Public-RTDB',
        databaseURL: config.databaseURL.trim(),
        projectId: config.projectId || 'karaoke-session',
        authDomain: config.authDomain,
        appId: config.appId,
      });
    } else {
      firebaseApp = getApp();
    }

    realtimeDb = getDatabase(firebaseApp, config.databaseURL.trim());
    return realtimeDb;
  } catch (err) {
    console.error('Error initializing Firebase Realtime Database:', err);
    return null;
  }
}

/**
 * Subscribes to real-time room changes in Firebase Realtime Database
 */
export function subscribeToFirebaseRoom(
  db: Database,
  roomId: string,
  onUpdate: (state: RoomState) => void
): Unsubscribe {
  const roomRef = ref(db, `karaoke_rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      // Normalize queue object to array if Firebase stored as key-value
      const queueList: KaraokeSong[] = Array.isArray(val.queue)
        ? val.queue
        : val.queue
        ? Object.values(val.queue)
        : [];

      const historyList: KaraokeSong[] = Array.isArray(val.history)
        ? val.history
        : val.history
        ? Object.values(val.history)
        : [];

      onUpdate({
        roomId: val.roomId || roomId,
        roomName: val.roomName || `Karaoke Lounge #${roomId}`,
        currentSong: val.currentSong || null,
        queue: queueList,
        history: historyList,
        isPlaying: Boolean(val.isPlaying),
        currentTime: val.currentTime || 0,
        duration: val.duration || 0,
        lastUpdated: val.lastUpdated || Date.now(),
        partyEffect: val.partyEffect || null,
      });
    }
  });
}

/**
 * Sync entire room state from Host to Firebase Realtime Database
 */
export async function syncHostStateToFirebase(db: Database, state: RoomState): Promise<void> {
  const roomRef = ref(db, `karaoke_rooms/${state.roomId}`);
  await set(roomRef, {
    roomId: state.roomId,
    roomName: state.roomName,
    currentSong: state.currentSong,
    queue: state.queue,
    history: state.history,
    isPlaying: state.isPlaying,
    currentTime: Math.floor(state.currentTime),
    duration: Math.floor(state.duration),
    lastUpdated: Date.now(),
    partyEffect: state.partyEffect || null,
  });
}

/**
 * Guest adds song to Firebase Realtime Database queue
 */
export async function addSongToFirebaseQueue(
  db: Database,
  roomId: string,
  song: KaraokeSong
): Promise<void> {
  const queueRef = ref(db, `karaoke_rooms/${roomId}/queue`);
  await push(queueRef, song);
}

/**
 * Security rules template for Firebase Realtime Database
 */
export const FIREBASE_RTDB_RULES = `{
  "rules": {
    "karaoke_rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "queue": {
          ".indexOn": ["queuedAt"]
        }
      }
    }
  }
}`;
