import React from 'react';

interface VideoRendererProps {
  src: string;
  className?: string;
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({ src, className = '' }) => {
  if (!src) return null;

  return (
    <video 
      src={src} 
      controls
      className={`max-w-full h-auto rounded-lg shadow-md ${className}`}
    >
      Your browser does not support the video tag.
    </video>
  );
};