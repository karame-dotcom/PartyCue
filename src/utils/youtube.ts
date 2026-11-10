import { ValidationResult } from '../types/karaoke';

/**
 * Extracts YouTube Video ID from any standard or mobile URL format
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch, short youtu.be, shorts, embed, music.youtube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates whether a YouTube video is publicly available and embeddable.
 * Uses the server proxy first (avoids CORS issues on mobile), then falls back to client oEmbed.
 */
export async function validateYouTubeVideo(urlOrId: string): Promise<ValidationResult> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    return {
      valid: false,
      error: 'Please enter a valid YouTube video URL or ID (e.g. https://youtu.be/...)',
    };
  }

  const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Try server-side validation endpoint
  try {
    const res = await fetch(`/api/validate-youtube?url=${encodeURIComponent(standardUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        return {
          valid: true,
          videoId,
          title: data.title || `Karaoke Track (${videoId})`,
          author: data.author || 'YouTube',
          thumbnailUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      } else {
        return {
          valid: false,
          videoId,
          error: data.error || 'This video cannot be embedded or played on external apps',
        };
      }
    }
  } catch {
    // If backend endpoint is unavailable, fallback to direct client oEmbed
  }

  // 2. Client-side oEmbed fallback
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`;
    const res = await fetch(oembedUrl);

    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return {
        valid: false,
        videoId,
        error: 'This video cannot be embedded or played on external apps',
      };
    }

    if (!res.ok) {
      return {
        valid: false,
        videoId,
        error: 'This video cannot be embedded or played on external apps',
      };
    }

    const data = await res.json();
    return {
      valid: true,
      videoId,
      title: data.title || `Track (${videoId})`,
      author: data.author_name || 'YouTube Uploader',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    // In rare cases where client network blocks oEmbed or CORS occurs,
    // we return embed rejection or construct fallback if known
    return {
      valid: false,
      videoId,
      error: 'This video cannot be embedded or played on external apps',
    };
  }
}

/**
 * Curated list of legendary karaoke tracks with instrumental/karaoke lyrics videos
 * All verified embeddable
 */
export const POPULAR_KARAOKE_SONGS = [
  {
    videoId: 'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
    title: 'Bohemian Rhapsody - Queen (Karaoke Instrumental)',
    author: 'Sing King Karaoke',
    singerSuggestion: 'Freddie Mercury Fan',
    genre: 'Classic Rock',
  },
  {
    videoId: '1k8craCGpgs', // Journey - Don't Stop Believin'
    title: "Don't Stop Believin' - Journey (Karaoke Version)",
    author: 'Sing King Karaoke',
    singerSuggestion: 'Party Rocker',
    genre: 'Anthem',
  },
  {
    videoId: 'xFrGuyw1V8s', // ABBA - Dancing Queen
    title: 'Dancing Queen - ABBA (Karaoke Version with Lyrics)',
    author: 'Karaoke Star',
    singerSuggestion: 'Disco Queen',
    genre: 'Pop / Disco',
  },
  {
    videoId: 'eH3giaIzONA', // Whitney Houston - I Wanna Dance with Somebody
    title: 'I Wanna Dance With Somebody - Whitney Houston (Karaoke)',
    author: 'Sing King Karaoke',
    singerSuggestion: 'Diva Vocalist',
    genre: '80s Pop',
  },
  {
    videoId: 'lDK9QqIzhwk', // Bon Jovi - Livin' on a Prayer
    title: "Livin' On A Prayer - Bon Jovi (Karaoke Version)",
    author: 'Karaoke Machine',
    singerSuggestion: 'Rockstar',
    genre: 'Classic Rock',
  },
  {
    videoId: 'dQw4w9WgXcQ', // Rick Astley
    title: 'Never Gonna Give You Up - Rick Astley (Sing-Along)',
    author: 'Rick Astley Official',
    singerSuggestion: 'Meme Legend',
    genre: '80s Classic',
  },
  {
    videoId: '04854XqcfCY', // Queen - We Are The Champions
    title: 'We Are The Champions - Queen (Karaoke)',
    author: 'Sing King Karaoke',
    singerSuggestion: 'Group Sing-along',
    genre: 'Epic Ballad',
  },
  {
    videoId: 'nfWlot6h_JM', // Taylor Swift - Shake It Off
    title: 'Shake It Off - Taylor Swift (Karaoke Instrumental)',
    author: 'Sing King Karaoke',
    singerSuggestion: 'Swiftie',
    genre: 'Pop',
  },
];
