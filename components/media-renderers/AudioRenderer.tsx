import React from 'react';

interface AudioRendererProps {
  src: string;
  className?: string;
}

export const AudioRenderer: React.FC<AudioRendererProps> = ({ src, className = '' }) => {
  if (!src) return null;

  return (
    <audio 
      src={src} 
      controls
      className={`w-full max-w-md ${className}`}
    >
      Your browser does not support the audio tag.
    </audio>
  );
};