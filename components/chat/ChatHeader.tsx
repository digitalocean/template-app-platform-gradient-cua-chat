/**
 * Chat header component with model selector and parameter controls
 */
import React from 'react';
import ModelSelector from '@/components/ModelSelector';
import ParameterControls from '@/components/ParameterControls';
import KeyboardShortcut from '@/components/KeyboardShortcut';

interface ChatHeaderProps {
  selectedModel: string;
  showAdvanced: boolean;
  parameters: {
    temperature: number;
    topK: number;
    topP: number;
    presencePenalty: number;
    frequencyPenalty: number;
    maxOutputTokens: number;
    maxSteps: number;
  };
  onModelChange: (model: string, maxTokens?: number) => void;
  onParameterChange: (param: string, value: number) => void;
  onToggleAdvanced: () => void;
  onNewChat: () => void;
  debugMode?: boolean;
  onToggleDebug?: () => void;
}

export default function ChatHeader({
  selectedModel,
  showAdvanced,
  parameters,
  onModelChange,
  onParameterChange,
  onToggleAdvanced,
  onNewChat,
  debugMode = false,
  onToggleDebug,
}: ChatHeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              onClick={onNewChat}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Start new chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap flex items-center gap-2">
              <span>New Chat</span>
              <KeyboardShortcut 
                shortcut={{ key: 'k', ctrlOrCmd: true }} 
                className="!bg-gray-700/50 !text-gray-200 !border-gray-600 !text-[10px] !py-0 !px-1"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onToggleDebug && (
            <button
              onClick={onToggleDebug}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                debugMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={debugMode ? "Disable debug mode" : "Enable debug mode"}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Debug
              </span>
            </button>
          )}
          <button
            onClick={onToggleAdvanced}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Advanced
          </button>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>
      </div>
      {showAdvanced && (
        <div className="mt-3">
          <ParameterControls
            {...parameters}
            onParameterChange={onParameterChange}
          />
        </div>
      )}
    </div>
  );
}