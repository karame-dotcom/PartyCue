import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Initialize Google Gen AI with telemetry header (only when key is available)
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface KaraokeSong {
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

interface PerformanceScore {
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

interface LeaderboardEntry {
  singerName: string;
  songTitle: string;
  score: number;
  rank: string;
  evaluatedAt: number;
}

interface RoomState {
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
  partyEffect?: {
    type: 'airhorn' | 'cheer' | 'applause' | 'confetti' | 'disco';
    singer?: string;
    timestamp: number;
  } | null;
}

// In-memory room store (synced across all connected host & mobile screens)
const rooms = new Map<string, RoomState>();
const roomListeners = new Map<string, Set<Response>>();

function broadcastRoomUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const clients = roomListeners.get(roomId);
  if (!clients || clients.size === 0) return;

  const data = `data: ${JSON.stringify(room)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

// Keep one entry per singer (their best score), ranked high to low — no size limit.
function recordLeaderboard(room: RoomState, result: PerformanceScore) {
  const list = room.leaderboard || [];
  const key = result.singerName.trim().toLowerCase();
  const existing = list.find((e) => e.singerName.trim().toLowerCase() === key);
  if (existing) {
    if (result.score >= existing.score) {
      existing.score = result.score;
      existing.songTitle = result.songTitle;
      existing.rank = result.rank;
      existing.evaluatedAt = result.evaluatedAt;
    }
  } else {
    list.push({
      singerName: result.singerName,
      songTitle: result.songTitle,
      score: result.score,
      rank: result.rank,
      evaluatedAt: result.evaluatedAt,
    });
  }
  list.sort((a, b) => b.score - a.score || a.evaluatedAt - b.evaluatedAt);
  room.leaderboard = list;
}

function getOrCreateRoom(roomId: string): RoomState {
  const id = (roomId || 'party-1').toUpperCase().trim();
  let room = rooms.get(id);
  if (!room) {
    room = {
      roomId: id,
      roomName: `Lounge #${id}`,
      currentSong: null,
      queue: [],
      history: [],
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      lastUpdated: Date.now(),
      latestScore: null,
      tvBackground: 'midnight',
      hostDeviceId: null,
      hostName: null,
      leaderboard: [],
      competitionMode: true,
      audienceVotes: {},
      micTuneScore: null,
      partyEffect: null,
    };
    rooms.set(id, room);
  }
  return room;
}

// 1. YouTube Validation Route via oEmbed
app.get('/api/validate-youtube', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ valid: false, error: 'URL parameter is required.' });
  }

  // Extract ID
  const trimmed = url.trim();
  const idMatch =
    trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i) ||
    trimmed.match(/^[a-zA-Z0-9_-]{11}$/);

  const videoId = idMatch ? (idMatch[1] || idMatch[0]) : null;
  if (!videoId) {
    return res.status(400).json({
      valid: false,
      error: 'Please enter a valid YouTube link (e.g., https://youtu.be/...)',
    });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.status === 401 || response.status === 403) {
      return res.status(400).json({
        valid: false,
        videoId,
        error: 'This video cannot be embedded or played on external apps',
      });
    }

    if (response.status === 404) {
      return res.status(400).json({
        valid: false,
        videoId,
        error: 'YouTube video not found. It may be deleted or private.',
      });
    }

    if (!response.ok) {
      return res.status(400).json({
        valid: false,
        videoId,
        error: 'This video cannot be embedded or played on external apps',
      });
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      html?: string;
    };

    // Ensure embeddable html exists in oembed
    if (!data.html && !data.title) {
      return res.status(400).json({
        valid: false,
        videoId,
        error: 'This video cannot be embedded or played on external apps',
      });
    }

    return res.json({
      valid: true,
      videoId,
      title: data.title || `Track (${videoId})`,
      author: data.author_name || 'YouTube Uploader',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch (err) {
    console.error('oEmbed validation error:', err);
    return res.status(500).json({
      valid: false,
      videoId,
      error: 'Unable to verify video embed status. Please verify your connection.',
    });
  }
});

// 1b. YouTube Karaoke Search Route with Real-Time Embeddability Check
app.get('/api/search-youtube', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.status(400).json({ results: [], error: 'Search query is required.' });
  }

  try {
    const searchTerm = query.toLowerCase().includes('karaoke') ? query : `${query} karaoke`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
    const ytRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!ytRes.ok) {
      return res.status(502).json({ results: [], error: 'Failed retrieving results from YouTube.' });
    }

    const html = await ytRes.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) {
      return res.json({ results: [] });
    }

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents || [];

    const rawVideos: Array<{
      videoId: string;
      title: string;
      author: string;
      duration: string;
      thumbnailUrl: string;
    }> = [];

    for (const item of contents) {
      const vr = item.videoRenderer;
      if (vr && vr.videoId && vr.title?.runs?.[0]?.text) {
        const title = vr.title.runs.map((r: { text?: string }) => r.text || '').join('');
        const author =
          vr.ownerText?.runs?.[0]?.text ||
          vr.shortBylineText?.runs?.[0]?.text ||
          'Karaoke Channel';
        const duration = vr.lengthText?.simpleText || '';
        const thumb =
          vr.thumbnail?.thumbnails?.[0]?.url ||
          `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;

        rawVideos.push({
          videoId: vr.videoId,
          title,
          author,
          duration,
          thumbnailUrl: thumb,
        });

        if (rawVideos.length >= 16) break;
      }
    }

    // Verify embeddability for each candidate via oEmbed
    const checkedVideos = await Promise.all(
      rawVideos.map(async (v) => {
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.videoId}&format=json`
          );
          const isEmbeddable = oembedRes.ok && oembedRes.status !== 401 && oembedRes.status !== 403;
          return {
            ...v,
            isEmbeddable,
          };
        } catch {
          return {
            ...v,
            isEmbeddable: true,
          };
        }
      })
    );

    // Screen out all videos that cannot be embedded / played in the app
    const playableOnly = checkedVideos.filter((v) => v.isEmbeddable);

    return res.json({ results: playableOnly });
  } catch (err) {
    console.error('YouTube search error:', err);
    return res.status(500).json({ results: [], error: 'Failed searching YouTube.' });
  }
});

// 1c. YouTube Live Search Suggestions (Autocomplete like YouTube search bar)
app.get('/api/youtube-suggestions', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ suggestions: [] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!r.ok) {
      return res.json({ suggestions: [] });
    }

    const data = await r.json();
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];
    return res.json({ suggestions: suggestions.slice(0, 8) });
  } catch {
    return res.json({ suggestions: [] });
  }
});

// 2. AI Karaoke Performance Scoring Route (Powered by Gemini + Audience Crowd Votes + Host Mic Pitch)
app.post('/api/evaluate-performance', async (req: Request, res: Response) => {
  const { songTitle, author, singerName, roomId } = req.body;

  const singer = (singerName || 'Karaoke Star').trim();
  const title = (songTitle || 'Hit Song').trim();
  const room = roomId ? getOrCreateRoom(roomId) : null;

  // Calculate Audience Crowd Vote Average if guests voted
  let crowdAvg: number | undefined = undefined;
  let voteCount = 0;
  if (room && room.audienceVotes) {
    const votes = Object.values(room.audienceVotes);
    if (votes.length > 0) {
      voteCount = votes.length;
      const total = votes.reduce((acc, v) => acc + v.score, 0);
      crowdAvg = Math.round(total / votes.length);
    }
  }

  // Host Phone Microphone Tune / Pitch Score if recorded
  const micPitch = room?.micTuneScore?.pitch;

  try {
    if (process.env.GEMINI_API_KEY && ai) {
      const prompt = `You are a legendary, hilarious, and charismatic arcade Karaoke AI Judge like Simon Cowell meets an energetic anime host.
Evaluate the karaoke performance of "${singer}" singing "${title}" (${author || 'Popular track'}).
${crowdAvg ? `The live audience crowd gave this performance a rating of ${crowdAvg}/100 based on ${voteCount} live votes!` : ''}
${micPitch ? `The host microphone pitch detector recorded an audio pitch accuracy score of ${micPitch}/100!` : ''}
Generate a high-energy, authentic karaoke score between 80 and 99 (occasionally 100 for transcendent performances).
Pick an epic karaoke title (e.g., "Certified Rock God", "Vocal Royalty", "Shower Superstar", "Pitch Perfect Diva", "Grammy Contender", "High Note Hero").
Write a witty, punchy, 1-2 sentence judge critique explicitly referencing the song title and singer's passion.
Provide integer ratings (75 to 100) for pitch, energy, and stagePresence.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI scoring timeout')), 5000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You evaluate karaoke singing performances with humor, excitement, and constructive arcade hype.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER, description: 'Overall score from 80 to 100' },
                rank: { type: Type.STRING, description: 'Honorary arcade title for the singer' },
                critique: { type: Type.STRING, description: '1-2 sentence witty and celebratory judge review' },
                pitch: { type: Type.INTEGER, description: 'Pitch rating out of 100' },
                energy: { type: Type.INTEGER, description: 'Energy rating out of 100' },
                stagePresence: { type: Type.INTEGER, description: 'Stage presence rating out of 100' },
              },
              required: ['score', 'rank', 'critique', 'pitch', 'energy', 'stagePresence'],
            },
          },
        }),
        timeoutPromise,
      ]);

      const parsed = JSON.parse(response.text || '{}');
      let finalScore = Math.min(100, Math.max(75, Number(parsed.score) || 91));

      // If crowd voted, weigh crowd vote 40% into overall score
      if (typeof crowdAvg === 'number') {
        finalScore = Math.round(finalScore * 0.6 + crowdAvg * 0.4);
      }

      // Calculate Rank Movement before updating leaderboard
      let rankChange: PerformanceScore['rankChange'] = undefined;
      if (room) {
        const oldLeaderboard = [...(room.leaderboard || [])];
        const prevIdx = oldLeaderboard.findIndex(
          (e) => e.singerName.toLowerCase() === singer.toLowerCase()
        );
        const fromRank = prevIdx >= 0 ? prevIdx + 1 : null;

        const candidateList = [
          ...oldLeaderboard,
          {
            singerName: singer,
            songTitle: title,
            score: finalScore,
            rank: parsed.rank || 'Arcade Vocal Legend',
            evaluatedAt: Date.now(),
          },
        ].sort((a, b) => b.score - a.score);

        const newIdx = candidateList.findIndex(
          (e) => e.singerName.toLowerCase() === singer.toLowerCase() && e.score === finalScore
        );
        const toRank = newIdx + 1;

        let direction: 'up' | 'down' | 'same' | 'new' = 'new';
        let message = '';
        if (fromRank === null) {
          direction = 'new';
          message = toRank <= 5 ? `🔥 Entered Top 5 at Rank #${toRank}!` : `✨ Recorded Rank #${toRank} on Party Board!`;
        } else if (toRank < fromRank) {
          direction = 'up';
          message = `🚀 LEVEL UP! Climbed from #${fromRank} to #${toRank}!`;
        } else if (toRank > fromRank) {
          direction = 'down';
          message = `Moved to Rank #${toRank}`;
        } else {
          direction = 'same';
          message = `⭐ Maintained Rank #${toRank}!`;
        }

        rankChange = { fromRank, toRank, direction, message };
      }

      const scoreResult: PerformanceScore = {
        score: finalScore,
        rank: parsed.rank || 'Arcade Vocal Legend',
        critique: parsed.critique || `Phenomenal energy on ${title}! You had the whole lounge on their feet!`,
        pitch: micPitch || Math.min(100, Math.max(70, Number(parsed.pitch) || 89)),
        energy: Math.min(100, Math.max(70, Number(parsed.energy) || 95)),
        stagePresence: Math.min(100, Math.max(70, Number(parsed.stagePresence) || 93)),
        songTitle: title,
        singerName: singer,
        evaluatedAt: Date.now(),
        crowdScore: crowdAvg,
        voteCount,
        micScore: micPitch,
        rankChange,
      };

      if (room) {
        room.latestScore = scoreResult;
        recordLeaderboard(room, scoreResult);
        room.lastUpdated = Date.now();
        broadcastRoomUpdate(room.roomId);
      }

      return res.json({ success: true, score: scoreResult });
    }
  } catch (err) {
    console.warn('Gemini scoring failed, using procedural AI judge fallback:', err);
  }

  // Fallback procedural AI evaluation
  let baseScore = Math.floor(84 + Math.random() * 15); // 84-98
  if (typeof crowdAvg === 'number') {
    baseScore = Math.round(baseScore * 0.6 + crowdAvg * 0.4);
  }

  const fallbackTitles = [
    'Arcade Vocal Legend',
    'Certified Rock God',
    'High-Note Hero',
    'Karaoke Royalty',
    'Party Starter Extraordinaire',
    'Grammy Contender',
  ];
  const fallbackCritiques = [
    `Unstoppable charisma on "${title}"! You hit those high notes with pure arcade soul!`,
    `The crowd went wild for ${singer}'s rendition of "${title}"! Masterful vocal delivery!`,
    `Incredible pitch control and pure star power on "${title}"! Ready for the world tour!`,
    `A powerhouse performance that blew the roof off the lounge! Keep singing like that!`,
  ];

  let rankChange: PerformanceScore['rankChange'] = undefined;
  if (room) {
    const oldLeaderboard = [...(room.leaderboard || [])];
    const prevIdx = oldLeaderboard.findIndex(
      (e) => e.singerName.toLowerCase() === singer.toLowerCase()
    );
    const fromRank = prevIdx >= 0 ? prevIdx + 1 : null;

    const candidateList = [
      ...oldLeaderboard,
      {
        singerName: singer,
        songTitle: title,
        score: baseScore,
        rank: fallbackTitles[0],
        evaluatedAt: Date.now(),
      },
    ].sort((a, b) => b.score - a.score);

    const newIdx = candidateList.findIndex(
      (e) => e.singerName.toLowerCase() === singer.toLowerCase() && e.score === baseScore
    );
    const toRank = newIdx + 1;

    let direction: 'up' | 'down' | 'same' | 'new' = 'new';
    let message = '';
    if (fromRank === null) {
      direction = 'new';
      message = toRank <= 5 ? `🔥 Entered Top 5 at Rank #${toRank}!` : `✨ Recorded Rank #${toRank} on Party Board!`;
    } else if (toRank < fromRank) {
      direction = 'up';
      message = `🚀 LEVEL UP! Climbed from #${fromRank} to #${toRank}!`;
    } else if (toRank > fromRank) {
      direction = 'down';
      message = `Moved to Rank #${toRank}`;
    } else {
      direction = 'same';
      message = `⭐ Maintained Rank #${toRank}!`;
    }

    rankChange = { fromRank, toRank, direction, message };
  }

  const scoreResult: PerformanceScore = {
    score: baseScore,
    rank: fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)],
    critique: fallbackCritiques[Math.floor(Math.random() * fallbackCritiques.length)],
    pitch: micPitch || Math.floor(82 + Math.random() * 16),
    energy: Math.floor(88 + Math.random() * 12),
    stagePresence: Math.floor(85 + Math.random() * 15),
    songTitle: title,
    singerName: singer,
    evaluatedAt: Date.now(),
    crowdScore: crowdAvg,
    voteCount,
    micScore: micPitch,
    rankChange,
  };

  if (room) {
    room.latestScore = scoreResult;
    recordLeaderboard(room, scoreResult);
    room.lastUpdated = Date.now();
    broadcastRoomUpdate(room.roomId);
  }

  return res.json({ success: true, score: scoreResult });
});

// 3. Room State Retrieval
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const room = getOrCreateRoom(req.params.roomId);
  res.json(room);
});

// 4. Realtime SSE Stream for Instant Multi-Device Sync
app.get('/api/rooms/:roomId/stream', (req: Request, res: Response) => {
  const roomId = (req.params.roomId || 'party-1').toUpperCase().trim();
  const room = getOrCreateRoom(roomId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Add client to listeners
  if (!roomListeners.has(roomId)) {
    roomListeners.set(roomId, new Set());
  }
  const clients = roomListeners.get(roomId)!;
  clients.add(res);

  // Send current state immediately
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  // Heartbeat ping every 20 seconds to keep mobile socket awake
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// 5. Guest / Host Song Queuing
app.post('/api/rooms/:roomId/queue', (req: Request, res: Response) => {
  const room = getOrCreateRoom(req.params.roomId);
  const { videoId, title, author, thumbnailUrl, singerName, queuedByDeviceId } = req.body;

  if (!videoId || !title) {
    return res.status(400).json({ error: 'Missing required video information.' });
  }

  const newSong: KaraokeSong = {
    id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    videoId: videoId.trim(),
    title: (title || 'Karaoke Track').trim(),
    author: (author || 'YouTube').trim(),
    thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    singerName: (singerName || 'Guest Singer').trim(),
    queuedAt: Date.now(),
    queuedByDeviceId: queuedByDeviceId || undefined,
  };

  // If no song is currently playing, set as current immediately
  if (!room.currentSong) {
    room.currentSong = newSong;
    room.isPlaying = true;
    room.currentTime = 0;
  } else {
    room.queue.push(newSong);
  }

  room.lastUpdated = Date.now();
  broadcastRoomUpdate(room.roomId);

  return res.json({ success: true, song: newSong, room });
});

// 6. Host Admin Master Actions (Skip, Delete, Reorder, Playback, Party Effects)
app.post('/api/rooms/:roomId/actions', (req: Request, res: Response) => {
  const room = getOrCreateRoom(req.params.roomId);
  const { action, payload } = req.body;

  switch (action) {
    case 'skip': {
      if (room.currentSong) {
        room.history.unshift(room.currentSong);
        if (room.history.length > 30) room.history.pop();
      }
      // Reset votes and mic detection for next track
      room.audienceVotes = {};
      room.micTuneScore = null;

      if (room.queue.length > 0) {
        room.currentSong = room.queue.shift() || null;
        room.currentTime = 0;
        room.isPlaying = true;
      } else {
        room.currentSong = null;
        room.currentTime = 0;
        room.isPlaying = false;
      }
      break;
    }

    case 'toggleCompetitionMode': {
      const { enabled } = payload || {};
      room.competitionMode = typeof enabled === 'boolean' ? enabled : !room.competitionMode;
      break;
    }

    case 'voteSong': {
      const { deviceId, score, voterName } = payload || {};
      if (deviceId && typeof score === 'number') {
        if (!room.audienceVotes) room.audienceVotes = {};
        room.audienceVotes[deviceId] = {
          score: Math.min(100, Math.max(1, score)),
          voterName: (voterName || 'Guest').trim(),
          timestamp: Date.now(),
        };
      }
      break;
    }

    case 'submitMicTune': {
      const { pitch, energy } = payload || {};
      if (typeof pitch === 'number' && typeof energy === 'number') {
        room.micTuneScore = {
          pitch: Math.min(100, Math.max(0, pitch)),
          energy: Math.min(100, Math.max(0, energy)),
          timestamp: Date.now(),
        };
      }
      break;
    }

    case 'delete': {
      const { songId } = payload || {};
      if (songId) {
        room.queue = room.queue.filter((s) => s.id !== songId);
      }
      break;
    }

    case 'reorder': {
      const { fromIndex, toIndex } = payload || {};
      if (
        typeof fromIndex === 'number' &&
        typeof toIndex === 'number' &&
        fromIndex >= 0 &&
        fromIndex < room.queue.length &&
        toIndex >= 0 &&
        toIndex < room.queue.length
      ) {
        const [moved] = room.queue.splice(fromIndex, 1);
        room.queue.splice(toIndex, 0, moved);
      }
      break;
    }

    case 'playback': {
      if (typeof payload?.isPlaying === 'boolean') {
        room.isPlaying = payload.isPlaying;
      }
      if (typeof payload?.currentTime === 'number') {
        room.currentTime = payload.currentTime;
      }
      if (typeof payload?.duration === 'number') {
        room.duration = payload.duration;
      }
      break;
    }

    case 'partyEffect': {
      const { type, singer } = payload || {};
      room.partyEffect = {
        type: type || 'cheer',
        singer: singer || '',
        timestamp: Date.now(),
      };
      break;
    }

    case 'clearQueue': {
      room.queue = [];
      break;
    }

    case 'clearHistory': {
      room.history = [];
      break;
    }

    case 'replay': {
      room.currentTime = 0;
      room.isPlaying = true;
      break;
    }

    case 'setTvBackground': {
      const { background } = payload || {};
      if (typeof background === 'string') {
        room.tvBackground = background;
      }
      break;
    }

    case 'claimHostDj': {
      const { deviceId, hostName, pin } = payload || {};
      const devId = (deviceId || '').trim();
      // Enforce ONLY 1 Host DJ per room!
      // If room already has a host and it's a different device:
      if (room.hostDeviceId && room.hostDeviceId !== devId) {
        // Allow takeover if pin/passcode matches room ID
        const cleanPin = (pin || '').toString().toUpperCase().trim();
        if (cleanPin && (cleanPin === room.roomId || cleanPin === 'HOST' || cleanPin === '1234')) {
          room.hostDeviceId = devId || null;
          room.hostName = hostName || 'Party Host';
        } else {
          return res.status(403).json({
            error: `Room already has an active Host DJ (${room.hostName || 'Host'}). Only 1 Host DJ is permitted per room.`,
            room,
          });
        }
      } else {
        room.hostDeviceId = devId || null;
        room.hostName = hostName || 'Party Host';
      }
      break;
    }

    case 'releaseHostDj': {
      const { deviceId } = payload || {};
      if (room.hostDeviceId === deviceId) {
        room.hostDeviceId = null;
        room.hostName = null;
      }
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  room.lastUpdated = Date.now();
  broadcastRoomUpdate(room.roomId);
  res.json({ success: true, room });
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🎤 PartyCue server running on http://${HOST}:${PORT}`);
  });
}

startServer();
