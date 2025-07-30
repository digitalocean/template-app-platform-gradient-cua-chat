import React from "react";
import { ImageRenderer } from "./ImageRenderer";
import { VideoRenderer } from "./VideoRenderer";
import { AudioRenderer } from "./AudioRenderer";
import { DocumentRenderer } from "./DocumentRenderer";
import { PDFRenderer } from "./PDFRenderer";
import { TextRenderer } from "./TextRenderer";
import { ErrorDisplay } from "./ErrorDisplay";

export interface MediaContent {
  type: string;
  data?: string;
  url?: string;
  image?: string; // For image type content
  mimeType?: string;
  text?: string;
  filename?: string;
  error?: string;
  isError?: boolean;
}

interface MediaRendererProps {
  content: MediaContent;
  className?: string;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  content,
  className,
}) => {
  // Handle errors
  if (content.isError || content.error) {
    return (
      <ErrorDisplay
        error={content.error || "Unknown error"}
        className={className}
      />
    );
  }

  // Handle text content
  if (content.type === "text" && content.text) {
    return <TextRenderer text={content.text} className={className} />;
  }

  // Handle image type content (for processed tool outputs)
  if (content.type.toLowerCase() === "image") {
    const src = content.url || content.image || "";
    if (src) {
      return (
        <ImageRenderer
          src={src}
          alt={content.filename || "Image"}
          className={className}
        />
      );
    }
  }

  // Handle media content with mime types
  const mimeType = content.mimeType || "";

  // Image types
  if (mimeType.startsWith("image/")) {
    const src =
      content.url ||
      (content.data ? `data:${mimeType};base64,${content.data}` : "");
    return (
      <ImageRenderer
        src={src}
        alt={content.filename || "Image"}
        className={className}
      />
    );
  }

  // Video types
  if (mimeType.startsWith("video/")) {
    const src =
      content.url ||
      (content.data ? `data:${mimeType};base64,${content.data}` : "");
    return <VideoRenderer src={src} className={className} />;
  }

  // Audio types
  if (mimeType.startsWith("audio/")) {
    const src =
      content.url ||
      (content.data ? `data:${mimeType};base64,${content.data}` : "");
    return <AudioRenderer src={src} className={className} />;
  }

  // PDF files
  if (mimeType === "application/pdf") {
    const src =
      content.url ||
      (content.data ? `data:${mimeType};base64,${content.data}` : "");
    return (
      <PDFRenderer
        src={src}
        filename={content.filename}
        className={className}
      />
    );
  }

  // Other document types
  if (mimeType.startsWith("application/")) {
    const src =
      content.url ||
      (content.data ? `data:${mimeType};base64,${content.data}` : "");
    return (
      <DocumentRenderer
        src={src}
        mimeType={mimeType}
        filename={content.filename}
        className={className}
      />
    );
  }

  // Fallback for unknown types
  return (
    <div className={`p-4 bg-gray-100 rounded ${className}`}>
      <p className="text-sm text-gray-600">
        Unsupported content type: {mimeType || content.type}
      </p>
    </div>
  );
};
