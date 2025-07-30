/**
 * Individual message component
 */
import React, { useState } from 'react';
import { UIMessage } from 'ai';
import { renderMessagePart } from '@/lib/tool-handlers';

interface MessageProps {
  message: UIMessage;
  isNewRole: boolean;
  addToolResult: (result: { tool: string; toolCallId: string; output: string }) => void;
  debug?: boolean;
}

export default function Message({ message, isNewRole, addToolResult, debug = false }: MessageProps) {
  const [showDebug, setShowDebug] = useState(false);

  // Count different part types for debug summary
  const partTypeCounts = debug ? message.parts.reduce((acc, part) => {
    const type = part.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  return (
    <div className="mb-6 relative">
      {isNewRole && (
        <div
          className={`font-medium mb-2 ${
            message.role === "user" ? "text-blue-600" : "text-green-600"
          }`}
        >
          {message.role === "user" ? "You" : "Assistant"}
        </div>
      )}
      
      <div
        className={`rounded-lg p-4 ${
          message.role === "user" ? "bg-blue-50" : "bg-green-50"
        }`}
      >
        {debug && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="absolute top-2 right-2 p-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-mono"
            title="Toggle debug view"
          >
            {showDebug ? '✕' : `{${message.parts.length}}`}
          </button>
        )}
        
        {debug && showDebug && (
          <div className="mb-4 p-3 bg-gray-800 text-gray-100 rounded-md text-xs font-mono overflow-x-auto">
            <div className="mb-2 text-gray-400">
              Message ID: {message.id} | Parts: {message.parts.length}
              {Object.entries(partTypeCounts).map(([type, count]) => (
                <span key={type} className="ml-3">
                  {type}: {count}
                </span>
              ))}
            </div>
            <details className="cursor-pointer">
              <summary className="text-gray-300 hover:text-white">View raw JSON</summary>
              <pre className="mt-2 p-2 bg-gray-900 rounded overflow-x-auto">
                {JSON.stringify(message, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        {message.parts.map((part, index) =>
          renderMessagePart(message.id, index, part, addToolResult)
        )}
      </div>
    </div>
  );
}