import React from "react";
import { AlertTriangle } from "lucide-react";

interface ApiErrorDisplayProps {
  error: {
    message?: string;
    statusCode?: number;
    responseBody?: string;
  };
  className?: string;
}

export default function ApiErrorDisplay({
  error,
  className = "",
}: ApiErrorDisplayProps) {
  // Parse the error message if it contains JSON
  let errorMessage = error.message || "An error occurred";
  let details = "";

  if (error.responseBody) {
    try {
      const parsed = JSON.parse(error.responseBody);
      if (parsed.message) {
        errorMessage = parsed.message;
      }
      if (parsed.details) {
        details = parsed.details;
      }
    } catch {
      // If not JSON, use as is
      details = error.responseBody;
    }
  }

  return (
    <div
      className={`rounded-lg border border-red-300 bg-red-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-red-900">
            API Error {error.statusCode ? `(${error.statusCode})` : ""}
          </h3>
          <p className="mt-1 text-sm text-red-800">{errorMessage}</p>
          {details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-700 hover:text-red-900">
                Show details
              </summary>
              <pre className="mt-2 text-xs text-red-700 overflow-x-auto bg-red-100 p-2 rounded">
                {details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
