import React from 'react';

interface ImageRendererProps {
  src: string;
  alt?: string;
  className?: string;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({ src, alt = 'Image', className = '' }) => {
  if (!src) return null;

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`max-w-full h-auto rounded-lg shadow-md ${className}`}
      loading="lazy"
    />
  );
};