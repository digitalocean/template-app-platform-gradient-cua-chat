/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentRenderer } from './DocumentRenderer';

describe('DocumentRenderer', () => {
  describe('PDF rendering', () => {
    it('should render embedded PDF viewer for PDF files', () => {
      render(
        <DocumentRenderer
          src="https://arxiv.org/pdf/1706.03762"
          mimeType="application/pdf"
          filename="attention-is-all-you-need.pdf"
        />
      );

      // Check for embedded PDF
      const embed = document.querySelector('embed');
      expect(embed).toBeInTheDocument();
      expect(embed).toHaveAttribute('src', 'https://arxiv.org/pdf/1706.03762');
      expect(embed).toHaveAttribute('type', 'application/pdf');
      expect(embed).toHaveClass('w-full', 'h-96', 'rounded-lg', 'shadow-md');

      // Check for download link
      const downloadLink = screen.getByRole('link', { name: 'Download attention-is-all-you-need.pdf' });
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', 'https://arxiv.org/pdf/1706.03762');
      expect(downloadLink).toHaveAttribute('download', 'attention-is-all-you-need.pdf');
    });

    it('should render embedded PDF with data URI', () => {
      const pdfDataUri = 'data:application/pdf;base64,JVBERi0xLjMKJeLjz9M=';
      
      render(
        <DocumentRenderer
          src={pdfDataUri}
          mimeType="application/pdf"
          filename="test.pdf"
        />
      );

      const embed = document.querySelector('embed');
      expect(embed).toHaveAttribute('src', pdfDataUri);
      expect(embed).toHaveAttribute('type', 'application/pdf');
    });

    it('should handle PDF without custom filename', () => {
      render(
        <DocumentRenderer
          src="https://example.com/document.pdf"
          mimeType="application/pdf"
        />
      );

      const downloadLink = screen.getByRole('link', { name: 'Download Document' });
      expect(downloadLink).toBeInTheDocument();
    });
  });

  describe('Non-PDF document rendering', () => {
    it('should render download link for Word documents', () => {
      render(
        <DocumentRenderer
          src="https://example.com/document.docx"
          mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          filename="report.docx"
        />
      );

      // Should not have embedded viewer
      expect(document.querySelector('embed')).not.toBeInTheDocument();

      // Should have document info
      expect(screen.getByText('report.docx')).toBeInTheDocument();
      expect(screen.getByText('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBeInTheDocument();

      // Should have download button
      const downloadButton = screen.getByRole('link', { name: 'Download' });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveAttribute('href', 'https://example.com/document.docx');
      expect(downloadButton).toHaveAttribute('download', 'report.docx');
      expect(downloadButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should render download link for Excel files', () => {
      render(
        <DocumentRenderer
          src="https://example.com/spreadsheet.xlsx"
          mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          filename="data.xlsx"
        />
      );

      expect(screen.getByText('data.xlsx')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
    });

    it('should render download link for PowerPoint files', () => {
      render(
        <DocumentRenderer
          src="https://example.com/presentation.pptx"
          mimeType="application/vnd.openxmlformats-officedocument.presentationml.presentation"
          filename="slides.pptx"
        />
      );

      expect(screen.getByText('slides.pptx')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
    });

    it('should handle generic application types', () => {
      render(
        <DocumentRenderer
          src="https://example.com/data.json"
          mimeType="application/json"
          filename="config.json"
        />
      );

      expect(screen.getByText('config.json')).toBeInTheDocument();
      expect(screen.getByText('application/json')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should return null when src is not provided', () => {
      const { container } = render(
        <DocumentRenderer
          src=""
          mimeType="application/pdf"
          filename="test.pdf"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should use default filename when not provided', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file"
          mimeType="application/octet-stream"
        />
      );

      expect(screen.getByText('Document')).toBeInTheDocument();
    });

    it('should apply custom className to container', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file.pdf"
          mimeType="application/pdf"
          filename="test.pdf"
          className="custom-class"
        />
      );

      const container = document.querySelector('embed')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should apply custom className to non-PDF container', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file.docx"
          mimeType="application/msword"
          filename="test.docx"
          className="custom-doc-class"
        />
      );

      const container = screen.getByText('test.docx').closest('.p-4');
      expect(container).toHaveClass('custom-doc-class');
    });
  });

  describe('Icon rendering', () => {
    it('should render document icon for non-PDF files', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file.txt"
          mimeType="text/plain"
          filename="readme.txt"
        />
      );

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon.tagName).toBe('svg');
      expect(icon).toHaveClass('w-6', 'h-6', 'text-gray-600');
    });
  });

  describe('S3 URLs', () => {
    it('should handle S3 URLs for PDFs', () => {
      render(
        <DocumentRenderer
          src="s3://bucket/uploads/uuid/attention-is-all-you-need.pdf"
          mimeType="application/pdf"
          filename="attention-is-all-you-need.pdf"
        />
      );

      const embed = document.querySelector('embed');
      expect(embed).toHaveAttribute('src', 's3://bucket/uploads/uuid/attention-is-all-you-need.pdf');
    });

    it('should handle presigned S3 URLs', () => {
      const presignedUrl = 'https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...';
      
      render(
        <DocumentRenderer
          src={presignedUrl}
          mimeType="application/pdf"
          filename="document.pdf"
        />
      );

      const embed = document.querySelector('embed');
      expect(embed).toHaveAttribute('src', presignedUrl);
    });
  });

  describe('Layout and styling', () => {
    it('should have correct styling for PDF container', () => {
      const { container } = render(
        <DocumentRenderer
          src="https://example.com/file.pdf"
          mimeType="application/pdf"
          filename="test.pdf"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('w-full');
    });

    it('should have correct styling for non-PDF container', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file.zip"
          mimeType="application/zip"
          filename="archive.zip"
        />
      );

      const container = screen.getByText('archive.zip').closest('.flex');
      expect(container?.parentElement).toHaveClass('p-4', 'bg-gray-100', 'rounded-lg');
    });

    it('should style download link appropriately', () => {
      render(
        <DocumentRenderer
          src="https://example.com/file.pdf"
          mimeType="application/pdf"
          filename="test.pdf"
        />
      );

      const downloadLink = screen.getByRole('link', { name: 'Download test.pdf' });
      expect(downloadLink).toHaveClass('text-blue-600', 'hover:underline');
    });
  });
});