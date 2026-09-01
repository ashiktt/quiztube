import { YoutubeTranscript } from 'youtube-transcript';
import { TranscriptSegment } from '@/types';

/**
 * Extract YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 */
export function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        return parsed.searchParams.get('v');
      }
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0]) && pathParts[1]) {
        return pathParts[1];
      }
    } else if (parsed.hostname === 'youtu.be') {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0]) {
        return pathParts[0];
      }
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Converts seconds to MM:SS or HH:MM:SS format
 */
export function formatSecondsToTimestamp(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Converts MM:SS or HH:MM:SS string to seconds
 */
export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.trim().split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  durationFormatted?: string;
}

/**
 * Fetches basic video metadata using YouTube's oEmbed endpoint (no API key required)
 */
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const defaultThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const defaultMeta: VideoMetadata = {
    videoId,
    title: `YouTube Lecture (${videoId})`,
    authorName: 'Educational Channel',
    thumbnailUrl: defaultThumb,
  };

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || defaultMeta.title,
        authorName: data.author_name || defaultMeta.authorName,
        thumbnailUrl: data.thumbnail_url || defaultThumb,
      };
    }
  } catch (err) {
    console.warn('Error fetching YouTube oEmbed data:', err);
  }

  return defaultMeta;
}

/**
 * Fetches transcript segments for a given video ID
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    });

    if (transcriptItems && transcriptItems.length > 0) {
      return transcriptItems.map(item => ({
        text: item.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        offset: Math.floor(item.offset / 1000), // convert ms to seconds
        duration: Math.floor(item.duration / 1000),
      }));
    }
  } catch (err: any) {
    console.warn(`Primary transcript fetch failed for ${videoId}:`, err?.message || err);
    // Fallback: try fetching with auto-fallback or any language
    try {
      const fallbackItems = await YoutubeTranscript.fetchTranscript(videoId);
      if (fallbackItems && fallbackItems.length > 0) {
        return fallbackItems.map(item => ({
          text: item.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
          offset: Math.floor(item.offset / 1000),
          duration: Math.floor(item.duration / 1000),
        }));
      }
    } catch (fallbackErr: any) {
      console.warn(`Fallback transcript fetch failed for ${videoId}:`, fallbackErr?.message || fallbackErr);
    }
  }

  return [];
}

/**
 * Combines transcript segments into readable text with timestamp markers
 * e.g. "[00:15] Introduction to algorithms... [01:30] Big O notation..."
 */
export function formatTranscriptWithTimestamps(segments: TranscriptSegment[], intervalSeconds: number = 30): string {
  if (!segments || segments.length === 0) return '';

  const chunks: string[] = [];
  let currentGroupText: string[] = [];
  let currentGroupStartTime = segments[0]?.offset || 0;

  for (const seg of segments) {
    currentGroupText.push(seg.text);
    if (seg.offset - currentGroupStartTime >= intervalSeconds) {
      const timeStr = formatSecondsToTimestamp(currentGroupStartTime);
      chunks.push(`[${timeStr}] ${currentGroupText.join(' ')}`);
      currentGroupText = [];
      currentGroupStartTime = seg.offset;
    }
  }

  if (currentGroupText.length > 0) {
    const timeStr = formatSecondsToTimestamp(currentGroupStartTime);
    chunks.push(`[${timeStr}] ${currentGroupText.join(' ')}`);
  }

  return chunks.join('\n\n');
}
