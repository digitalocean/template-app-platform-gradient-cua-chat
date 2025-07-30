/**
 * Error display component for chat errors
 */
import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
  onRetry: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  if (!error) return null;

  const renderErrorContent = () => {
    const errorMessage = error.message || "Something went wrong. Please try again.";
    
    // Check if the error message contains JSON
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(errorMessage);
      return (
        <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs">
          <code>{JSON.stringify(parsed, null, 2)}</code>
        </pre>
      );
    } catch {
      // If not JSON, check if it looks like a code/technical error
      if (
        errorMessage.includes("{") ||
        errorMessage.includes("Error:") ||
        errorMessage.length > 100
      ) {
        return (
          <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs">
            <code>{errorMessage}</code>
          </pre>
        );
      }
      // Otherwise, display as regular text
      return (
        <div className="text-sm text-red-800">{errorMessage}</div>
      );
    }
  };

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 font-medium mb-2">
        An error occurred
      </div>
      <div className="mb-3">
        {renderErrorContent()}
      </div>
      <button
        type="button"
        className="mt-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-100"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}