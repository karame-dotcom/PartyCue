export interface KaraokeSong {
  id: string;
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  duration?: number;
  singerName: string;
  queuedAt: number;
  queuedByDeviceId?: string;
}

export interface PerformanceScore {
  score: number;
  rank: string;
  critique: string;
  pitch: number;
  energy: number;
  stagePresence: number;
  songTitle: string;
  singerName: string;
  evaluatedAt: number;
  crowdScore?: number;
  voteCount?: number;
  micScore?: number;
  rankChange?: {
    fromRank: number | null;
    toRank: number;
    direction: 'up' | 'down' | 'same' | 'new';
    message: string;
  };
}

export interface LeaderboardEntry {
  singerName: string;
  songTitle: string;
  score: number;
  rank: string;
  evaluatedAt: number;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  currentSong: KaraokeSong | null;
  queue: KaraokeSong[];
  history: KaraokeSong[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  lastUpdated: number;
  latestScore?: PerformanceScore | null;
  tvBackground?: string;
  hostDeviceId?: string | null;
  hostName?: string | null;
  leaderboard?: LeaderboardEntry[];
  competitionMode?: boolean;
  audienceVotes?: {
    [deviceId: string]: {
      score: number;
      voterName: string;
      timestamp: number;
    };
  };
  micTuneScore?: {
    pitch: number;
    energy: number;
    timestamp: number;
  } | null;
  scoreRequest?: number | null;
  partyEffect?: {
    type: 'airhorn' | 'cheer' | 'applause' | 'confetti' | 'disco';
    singer?: string;
    timestamp: number;
  } | null;
}

export interface ValidationResult {
  valid: boolean;
  videoId?: string;
  title?: string;
  author?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface FirebaseConnectionConfig {
  databaseURL: string;
  apiKey?: string;
  projectId?: string;
  authDomain?: string;
  appId?: string;
  enabled: boolean;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
  duration: string;
  thumbnailUrl: string;
  isEmbeddable: boolean;
  embedNote?: string;
}
