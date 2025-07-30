/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MediaRenderer } from './MediaRenderer';
import fs from 'fs';
import path from 'path';

// Mock child components
jest.mock('./ImageRenderer', () => ({
  ImageRenderer: ({ src, alt, className }: any) => (
    <div data-testid="image-renderer" data-src={src} data-alt={alt} className={className}>
      ImageRenderer
    </div>
  ),
}));

jest.mock('./VideoRenderer', () => ({
  VideoRenderer: ({ src, className }: any) => (
    <div data-testid="video-renderer" data-src={src} className={className}>
      VideoRenderer
    </div>
  ),
}));

jest.mock('./AudioRenderer', () => ({
  AudioRenderer: ({ src, className }: any) => (
    <div data-testid="audio-renderer" data-src={src} className={className}>
      AudioRenderer
    </div>
  ),
}));

jest.mock('./DocumentRenderer', () => ({
  DocumentRenderer: ({ src, mimeType, filename, className }: any) => (
    <div data-testid="document-renderer" data-src={src} data-mimetype={mimeType} data-filename={filename} className={className}>
      DocumentRenderer
    </div>
  ),
}));

jest.mock('./PDFRenderer', () => ({
  PDFRenderer: ({ src, filename, className }: any) => (
    <div data-testid="pdf-renderer" data-src={src} data-filename={filename} className={className}>
      PDFRenderer
    </div>
  ),
}));

jest.mock('./TextRenderer', () => ({
  TextRenderer: ({ text, className }: any) => (
    <div data-testid="text-renderer" data-text={text} className={className}>
      TextRenderer
    </div>
  ),
}));

jest.mock('./ErrorDisplay', () => ({
  ErrorDisplay: ({ error, className }: any) => (
    <div data-testid="error-display" data-error={error} className={className}>
      ErrorDisplay
    </div>
  ),
}));

describe('MediaRenderer', () => {
  // Load the PDF file as base64 for data URI tests
  const pdfPath = path.join(__dirname, '__tests__', 'attention-is-all-you-need.pdf');
  let pdfBase64: string;
  
  beforeAll(() => {
    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      pdfBase64 = pdfBuffer.toString('base64');
    } else {
      // Fallback for CI environments - use a minimal PDF base64
      pdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vVHlwZS9QYWdlL0NvbnRlbnRzIDMgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDcwPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAxIDAgUj4+CmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuCjAwMDAwMDAwNzQgMDAwMDAgbgowMDAwMDAwMjExIDAwMDAwIG4KMDAwMDAwMDMzMCAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCA0IDAgUi9TaXplIDU+PgpzdGFydHhyZWYKMzgwCiUlRU9G';
    }
  });

  describe('Error handling', () => {
    it('should render ErrorDisplay when isError is true', () => {
      render(<MediaRenderer content={{ type: 'text', isError: true, error: 'Test error' }} />);
      
      const errorDisplay = screen.getByTestId('error-display');
      expect(errorDisplay).toBeInTheDocument();
      expect(errorDisplay).toHaveAttribute('data-error', 'Test error');
    });

    it('should render ErrorDisplay with default message when error is not provided', () => {
      render(<MediaRenderer content={{ type: 'text', isError: true }} />);
      
      const errorDisplay = screen.getByTestId('error-display');
      expect(errorDisplay).toHaveAttribute('data-error', 'Unknown error');
    });
  });

  describe('Text content', () => {
    it('should render TextRenderer for text type', () => {
      render(<MediaRenderer content={{ type: 'text', text: 'Hello world' }} />);
      
      const textRenderer = screen.getByTestId('text-renderer');
      expect(textRenderer).toBeInTheDocument();
      expect(textRenderer).toHaveAttribute('data-text', 'Hello world');
    });
  });

  describe('Image content', () => {
    it('should render ImageRenderer for image type with URL', () => {
      render(<MediaRenderer content={{ type: 'image', url: 'https://example.com/image.jpg' }} />);
      
      const imageRenderer = screen.getByTestId('image-renderer');
      expect(imageRenderer).toBeInTheDocument();
      expect(imageRenderer).toHaveAttribute('data-src', 'https://example.com/image.jpg');
    });

    it('should render ImageRenderer for image type with image property', () => {
      render(<MediaRenderer content={{ type: 'image', image: 'https://example.com/image2.jpg' }} />);
      
      const imageRenderer = screen.getByTestId('image-renderer');
      expect(imageRenderer).toHaveAttribute('data-src', 'https://example.com/image2.jpg');
    });

    it('should render ImageRenderer for image mime type with data URI', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
      render(<MediaRenderer content={{ type: 'file', mimeType: 'image/png', data: 'iVBORw0KGgo=' }} />);
      
      const imageRenderer = screen.getByTestId('image-renderer');
      expect(imageRenderer).toHaveAttribute('data-src', dataUri);
    });
  });

  describe('Video content', () => {
    it('should render VideoRenderer for video mime type', () => {
      render(<MediaRenderer content={{ type: 'file', mimeType: 'video/mp4', url: 'https://example.com/video.mp4' }} />);
      
      const videoRenderer = screen.getByTestId('video-renderer');
      expect(videoRenderer).toBeInTheDocument();
      expect(videoRenderer).toHaveAttribute('data-src', 'https://example.com/video.mp4');
    });

    it('should render VideoRenderer with data URI', () => {
      render(<MediaRenderer content={{ type: 'file', mimeType: 'video/mp4', data: 'videodata' }} />);
      
      const videoRenderer = screen.getByTestId('video-renderer');
      expect(videoRenderer).toHaveAttribute('data-src', 'data:video/mp4;base64,videodata');
    });
  });

  describe('Audio content', () => {
    it('should render AudioRenderer for audio mime type', () => {
      render(<MediaRenderer content={{ type: 'file', mimeType: 'audio/mp3', url: 'https://example.com/audio.mp3' }} />);
      
      const audioRenderer = screen.getByTestId('audio-renderer');
      expect(audioRenderer).toBeInTheDocument();
      expect(audioRenderer).toHaveAttribute('data-src', 'https://example.com/audio.mp3');
    });
  });

  describe('PDF content', () => {
    it('should render PDFRenderer for PDF mime type with URL', () => {
      render(<MediaRenderer content={{ 
        type: 'file', 
        mimeType: 'application/pdf', 
        url: 'https://arxiv.org/pdf/1706.03762',
        filename: 'attention-is-all-you-need.pdf'
      }} />);
      
      const pdfRenderer = screen.getByTestId('pdf-renderer');
      expect(pdfRenderer).toBeInTheDocument();
      expect(pdfRenderer).toHaveAttribute('data-src', 'https://arxiv.org/pdf/1706.03762');
      expect(pdfRenderer).toHaveAttribute('data-filename', 'attention-is-all-you-need.pdf');
    });

    it('should render PDFRenderer for PDF mime type with data URI', () => {
      const dataUri = `data:application/pdf;base64,${pdfBase64}`;
      render(<MediaRenderer content={{ 
        type: 'file', 
        mimeType: 'application/pdf', 
        data: pdfBase64,
        filename: 'test.pdf'
      }} />);
      
      const pdfRenderer = screen.getByTestId('pdf-renderer');
      expect(pdfRenderer).toBeInTheDocument();
      expect(pdfRenderer).toHaveAttribute('data-src', dataUri);
      expect(pdfRenderer).toHaveAttribute('data-filename', 'test.pdf');
    });

    it('should handle PDF without filename', () => {
      render(<MediaRenderer content={{ 
        type: 'file', 
        mimeType: 'application/pdf', 
        url: 'https://example.com/document.pdf'
      }} />);
      
      const pdfRenderer = screen.getByTestId('pdf-renderer');
      expect(pdfRenderer).toBeInTheDocument();
      // When filename is not provided, it's passed as undefined to PDFRenderer
      expect(pdfRenderer.getAttribute('data-filename')).toBe(null);
    });
  });

  describe('Document content', () => {
    it('should render DocumentRenderer for non-PDF application mime types', () => {
      render(<MediaRenderer content={{ 
        type: 'file', 
        mimeType: 'application/msword', 
        url: 'https://example.com/document.doc',
        filename: 'document.doc'
      }} />);
      
      const docRenderer = screen.getByTestId('document-renderer');
      expect(docRenderer).toBeInTheDocument();
      expect(docRenderer).toHaveAttribute('data-src', 'https://example.com/document.doc');
      expect(docRenderer).toHaveAttribute('data-mimetype', 'application/msword');
      expect(docRenderer).toHaveAttribute('data-filename', 'document.doc');
    });

    it('should render DocumentRenderer for Excel files', () => {
      render(<MediaRenderer content={{ 
        type: 'file', 
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        data: 'exceldata',
        filename: 'spreadsheet.xlsx'
      }} />);
      
      const docRenderer = screen.getByTestId('document-renderer');
      expect(docRenderer).toHaveAttribute('data-mimetype', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe('Unsupported content', () => {
    it('should render fallback for unsupported mime type', () => {
      render(<MediaRenderer content={{ type: 'file', mimeType: 'text/plain' }} />);
      
      expect(screen.getByText('Unsupported content type: text/plain')).toBeInTheDocument();
    });

    it('should render fallback for unknown type without mime type', () => {
      render(<MediaRenderer content={{ type: 'unknown' }} />);
      
      expect(screen.getByText('Unsupported content type: unknown')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should pass className to child renderers', () => {
      const customClass = 'custom-class';
      
      render(<MediaRenderer content={{ type: 'text', text: 'Test' }} className={customClass} />);
      expect(screen.getByTestId('text-renderer')).toHaveClass(customClass);
      
      render(<MediaRenderer content={{ type: 'image', url: 'test.jpg' }} className={customClass} />);
      expect(screen.getByTestId('image-renderer')).toHaveClass(customClass);
      
      render(<MediaRenderer content={{ type: 'file', mimeType: 'application/pdf', url: 'test.pdf' }} className={customClass} />);
      expect(screen.getByTestId('pdf-renderer')).toHaveClass(customClass);
    });

    it('should apply className to fallback element', () => {
      render(<MediaRenderer content={{ type: 'unknown' }} className="custom-fallback" />);
      
      const fallback = screen.getByText('Unsupported content type: unknown').parentElement;
      expect(fallback).toHaveClass('custom-fallback');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content gracefully', () => {
      render(<MediaRenderer content={{ type: '' }} />);
      
      expect(screen.getByText('Unsupported content type:')).toBeInTheDocument();
    });

    it('should not render image without src', () => {
      render(<MediaRenderer content={{ type: 'image' }} />);
      
      expect(screen.queryByTestId('image-renderer')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive image type', () => {
      render(<MediaRenderer content={{ type: 'IMAGE', url: 'test.jpg' }} />);
      
      expect(screen.getByTestId('image-renderer')).toBeInTheDocument();
    });
  });

  describe('S3 upload component PDF detection simulation', () => {
    it('should correctly identify PDF mime type from file data', () => {
      // Simulate what an S3 upload component might send
      const s3UploadContent = {
        type: 'file',
        mimeType: 'application/pdf',
        data: pdfBase64,
        filename: 'uploaded-document.pdf'
      };
      
      render(<MediaRenderer content={s3UploadContent} />);
      
      const pdfRenderer = screen.getByTestId('pdf-renderer');
      expect(pdfRenderer).toBeInTheDocument();
      expect(pdfRenderer).toHaveAttribute('data-filename', 'uploaded-document.pdf');
      expect(pdfRenderer.getAttribute('data-src')).toMatch(/^data:application\/pdf;base64,/);
    });

    it('should handle PDF file object metadata', () => {
      // Simulate file metadata from an upload
      const fileMetadata = {
        type: 'file',
        mimeType: 'application/pdf',
        url: 's3://bucket/path/to/attention-is-all-you-need.pdf',
        filename: 'attention-is-all-you-need.pdf'
      };
      
      render(<MediaRenderer content={fileMetadata} />);
      
      const pdfRenderer = screen.getByTestId('pdf-renderer');
      expect(pdfRenderer).toBeInTheDocument();
      expect(pdfRenderer).toHaveAttribute('data-src', 's3://bucket/path/to/attention-is-all-you-need.pdf');
    });
  });
});