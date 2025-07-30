import React from 'react';

interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  title = 'Error',
  className = '' 
}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <div className={`border border-red-200 bg-red-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">{title}</h4>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
        </div>
      </div>
    </div>
  );
};