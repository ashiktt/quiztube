import { NextRequest, NextResponse } from 'next/server';
import {
  extractVideoId,
  fetchTranscript,
  fetchVideoMetadata,
  formatTranscriptWithTimestamps,
} from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const [metadata, segments] = await Promise.all([
      fetchVideoMetadata(videoId),
      fetchTranscript(videoId),
    ]);

    const formattedTranscript = formatTranscriptWithTimestamps(segments);

    return NextResponse.json({
      success: true,
      videoId,
      metadata,
      segmentCount: segments.length,
      hasTranscript: segments.length > 0,
      formattedTranscript,
      segments: segments.slice(0, 100), // Preview sample
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch video transcript' },
      { status: 500 }
    );
  }
}
