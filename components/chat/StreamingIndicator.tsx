/**
 * Streaming indicator component showing when AI is responding
 */
import React from 'react';

interface StreamingIndicatorProps {
  isStreaming: boolean;
  onStop: () => void;
}

export default function StreamingIndicator({ isStreaming, onStop }: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <div className="flex items-center gap-3 text-gray-500">
      <div className="animate-pulse">Assistant is typing...</div>
      <button
        type="button"
        onClick={onStop}
        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
      >
        Stop
      </button>
    </div>
  );
}