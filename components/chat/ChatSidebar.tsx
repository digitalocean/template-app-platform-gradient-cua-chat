/**
 * Chat sidebar component with collapsible sections
 */
import React, { useState } from 'react';
import ModelSelector from '@/components/ModelSelector';
import ParameterControls from '@/components/ParameterControls';
import KeyboardShortcut from '@/components/KeyboardShortcut';

interface ChatSidebarProps {
  selectedModel: string;
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
  onNewChat: () => void;
  debugMode: boolean;
  onToggleDebug: () => void;
  width: number;
  onResize: (width: number) => void;
}

export default function ChatSidebar({
  selectedModel,
  parameters,
  onModelChange,
  onParameterChange,
  onNewChat,
  debugMode,
  onToggleDebug,
  width,
  onResize,
}: ChatSidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 280;
  const maxWidth = 600;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  return (
    <div 
      className="flex-shrink-0 bg-gray-50 border-l border-gray-200 relative select-none"
      style={{ width: `${width}px` }}
    >
      {/* Resize grabber */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${
          isResizing ? 'bg-blue-500' : 'bg-transparent'
        }`}
        onMouseDown={handleMouseDown}
      />
      
      <div className="h-full overflow-y-auto p-4 space-y-4">
        {/* Actions */}
        <div className="space-y-2">
          {/* Debug Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${debugMode ? 'text-red-600' : 'text-gray-600'}`}
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
              <span className={`text-sm font-medium ${debugMode ? 'text-red-600' : 'text-gray-700'}`}>
                Debug Mode
              </span>
            </div>
            <button
              onClick={onToggleDebug}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                debugMode ? 'bg-red-600' : 'bg-gray-300'
              }`}
              title={debugMode ? "Disable debug mode" : "Enable debug mode to see raw message data"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  debugMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between gap-2 text-sm"
            title="Start a new conversation (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Chat
            </div>
            <div className="hidden sm:block">
              <KeyboardShortcut 
                shortcut={{ key: 'k', ctrlOrCmd: true }} 
                className="!bg-blue-700 text-blue-100 border-blue-600 shadow-none"
              />
            </div>
          </button>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
        </div>

        {/* Advanced Parameters */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="text-left">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Advanced Settings</span>
              <p className="text-xs text-gray-500 mt-0.5">Fine-tune model behavior</p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
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
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-600 px-2">
                Adjust these parameters to control the model&apos;s creativity, randomness, and output style.
              </p>
              <ParameterControls
                {...parameters}
                onParameterChange={onParameterChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}