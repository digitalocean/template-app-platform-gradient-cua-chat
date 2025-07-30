import React from 'react';

interface DocumentRendererProps {
  src: string;
  mimeType: string;
  filename?: string;
  className?: string;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({ 
  src, 
  mimeType, 
  filename = 'Document',
  className = '' 
}) => {
  if (!src) return null;

  // For PDFs, we can embed them directly
  if (mimeType === 'application/pdf') {
    return (
      <div className={`w-full ${className}`}>
        <embed 
          src={src} 
          type="application/pdf"
          className="w-full h-96 rounded-lg shadow-md"
        />
        <p className="text-sm text-gray-600 mt-2">
          <a href={src} download={filename} className="text-blue-600 hover:underline">
            Download {filename}
          </a>
        </p>
      </div>
    );
  }

  // For other document types, show a download link
  return (
    <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{filename}</p>
          <p className="text-xs text-gray-600">{mimeType}</p>
        </div>
        <a 
          href={src} 
          download={filename}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download
        </a>
      </div>
    </div>
  );
};