'use client';

import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, FastForward, Clock } from 'lucide-react';
import { formatSecondsToTimestamp } from '@/lib/youtube';

interface VideoPlayerProps {
  videoId: string;
  currentTimestamp?: number;
  onTimeChange?: (seconds: number) => void;
  className?: string;
}

export function VideoPlayer({
  videoId,
  currentTimestamp,
  className = '',
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When currentTimestamp changes externally (e.g. user clicks a timestamp link on a question), send postMessage to YouTube IFrame API
  useEffect(() => {
    if (typeof currentTimestamp === 'number' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [currentTimestamp, true],
          }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: [],
          }),
          '*'
        );
      } catch (err) {
        console.warn('Error sending seek command to YouTube iframe:', err);
      }
    }
  }, [currentTimestamp]);

  if (!videoId) {
    return (
      <div className={`aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 border border-slate-800 ${className}`}>
        <Play className="w-12 h-12 text-slate-600 mb-2" />
        <p className="text-sm font-medium">No YouTube video connected</p>
        <p className="text-xs text-slate-500">Video player will appear when a YouTube URL is provided</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&rel=0`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black shadow-lg ${className}`}>
      <div className="relative aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="YouTube Lecture Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      {typeof currentTimestamp === 'number' && currentTimestamp > 0 && (
        <div className="px-4 py-2 bg-slate-900/90 text-white flex items-center justify-between text-xs border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-indigo-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Target Concept: {formatSecondsToTimestamp(currentTimestamp)}</span>
          </div>
          <span className="text-slate-400 text-[11px]">Synced with Quiz</span>
        </div>
      )}
    </div>
  );
}
