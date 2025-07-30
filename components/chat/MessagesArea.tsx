/**
 * Messages area component - contains all chat messages
 */
import React from 'react';
import { UIMessage } from 'ai';
import Message from './Message';
import StreamingIndicator from './StreamingIndicator';
import ErrorDisplay from './ErrorDisplay';

interface MessagesAreaProps {
  messages: UIMessage[];
  status: string;
  error: Error | null;
  addToolResult: (result: { tool: string; toolCallId: string; output: string }) => void;
  stop: () => void;
  regenerate: () => void;
  debug?: boolean;
}

export default function MessagesArea({
  messages,
  status,
  error,
  addToolResult,
  stop,
  regenerate,
  debug = false,
}: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-full">
        {messages.map((message, index) => {
          const previousRole = index > 0 ? messages[index - 1].role : null;
          const isNewRole = message.role !== previousRole;

          return (
            <Message
              key={message.id}
              message={message}
              isNewRole={isNewRole}
              addToolResult={addToolResult}
              debug={debug}
            />
          );
        })}

        <StreamingIndicator
          isStreaming={status === "submitted" || status === "streaming"}
          onStop={stop}
        />

        <ErrorDisplay error={error} onRetry={regenerate} />
      </div>
    </div>
  );
}