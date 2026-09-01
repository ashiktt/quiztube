import { NextRequest, NextResponse } from 'next/server';
import {
  extractVideoId,
  fetchTranscript,
  fetchVideoMetadata,
  formatTranscriptWithTimestamps,
} from '@/lib/youtube';
import { generateStudySetWithGemini, formatGeminiErrorMessage } from '@/lib/gemini';
import { LectureStudySet, QuizGenerationRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: QuizGenerationRequest = await req.json();
    const {
      url,
      customTranscript,
      title: customTitle,
      numQuestions = 10,
      difficulty = 'medium',
      questionType = 'mcq',
      topicFocus,
      apiKey,
      preferredModel,
    } = body;

    let videoId = '';
    let videoTitle = customTitle || 'Custom Lecture Notes';
    let channelTitle = 'Educational Material';
    let thumbnailUrl = '';
    let transcriptText = '';

    if (url) {
      const extracted = extractVideoId(url);
      if (!extracted) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
          { status: 400 }
        );
      }
      videoId = extracted;

      // Fetch metadata
      const meta = await fetchVideoMetadata(videoId);
      videoTitle = customTitle || meta.title;
      channelTitle = meta.authorName;
      thumbnailUrl = meta.thumbnailUrl;

      // If user did not provide custom transcript, fetch from YouTube
      if (!customTranscript || customTranscript.trim().length === 0) {
        const segments = await fetchTranscript(videoId);
        if (!segments || segments.length === 0) {
          return NextResponse.json(
            {
              error:
                'Could not automatically retrieve captions for this YouTube video. YouTube may have disabled captions, or this video has no spoken text. You can paste the transcript or lecture notes manually in the "Custom Notes" tab!',
              needsManualTranscript: true,
              videoMetadata: {
                videoId,
                title: videoTitle,
                authorName: channelTitle,
                thumbnailUrl,
              },
            },
            { status: 422 }
          );
        }
        transcriptText = formatTranscriptWithTimestamps(segments);
      } else {
        transcriptText = customTranscript;
      }
    } else if (customTranscript && customTranscript.trim().length > 0) {
      transcriptText = customTranscript;
      videoTitle = customTitle || 'Imported Lecture / Study Material';
    } else {
      return NextResponse.json(
        { error: 'Please provide either a YouTube lecture URL or custom lecture transcript text.' },
        { status: 400 }
      );
    }

    if (!transcriptText || transcriptText.trim().length < 50) {
      return NextResponse.json(
        { error: 'The transcript content is too short to generate a meaningful quiz. Please provide more content.' },
        { status: 400 }
      );
    }

    // Generate study set with Gemini
    const studyData = await generateStudySetWithGemini({
      transcriptWithTimestamps: transcriptText,
      lectureTitle: videoTitle,
      numQuestions: Math.min(Math.max(Number(numQuestions) || 5, 3), 25),
      difficulty,
      questionType,
      topicFocus,
      customApiKey: apiKey,
      preferredModel,
    });

    const studySet: LectureStudySet = {
      id: `study-set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      videoUrl: url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
      videoId,
      videoTitle: studyData.videoTitle || videoTitle,
      channelTitle,
      thumbnailUrl: thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
      durationFormatted: '',
      overallSummary: studyData.overallSummary,
      keyTakeaways: studyData.keyTakeaways,
      chapters: studyData.chapters,
      questions: studyData.questions,
      flashcards: studyData.flashcards,
      difficulty,
      cheatsheet: studyData.cheatsheet
        ? {
            ...studyData.cheatsheet,
            heroImageUrl:
              studyData.cheatsheet.heroImageUrl ||
              (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : thumbnailUrl),
          }
        : undefined,
    };

    return NextResponse.json({ success: true, studySet });
  } catch (error: any) {
    console.error('Quiz generation API error:', error);
    const friendlyError = formatGeminiErrorMessage(error);
    return NextResponse.json(
      {
        error: friendlyError,
      },
      { status: 500 }
    );
  }
}
