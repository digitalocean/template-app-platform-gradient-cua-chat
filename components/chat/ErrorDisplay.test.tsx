/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

describe('ErrorDisplay Component', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should not render when error is null', () => {
      const { container } = render(<ErrorDisplay error={null} onRetry={mockOnRetry} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when error is provided', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  describe('Error message rendering', () => {
    it('should render simple error message', () => {
      const error = new Error('Simple error message');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.getByText('Simple error message')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should render simple error message with correct styles', () => {
      const error = new Error('Simple error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const errorText = screen.getByText('Simple error');
      expect(errorText).toHaveClass('text-sm', 'text-red-800');
    });

    it('should render API error with token limit message', () => {
      const error = new Error('{"status_code":400,"message":"prompt exceeds maximum token limit of 96000 tokens"}');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      // Should render as formatted JSON
      const codeElement = screen.getByRole('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.textContent).toContain('prompt exceeds maximum token limit');
      expect(codeElement.textContent).toContain('96000 tokens');
    });

    it('should format JSON with proper indentation', () => {
      const jsonError = { error: 'test', code: 123 };
      const error = new Error(JSON.stringify(jsonError));
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      const formattedJson = JSON.stringify(jsonError, null, 2);
      expect(codeElement.textContent).toBe(formattedJson);
    });

    it('should handle long technical errors', () => {
      const longError = new Error('Error: AI_APICallError: Bad Request - This is a very long error message that exceeds 100 characters and should be displayed in a code block for better readability');
      render(<ErrorDisplay error={longError} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.parentElement).toHaveClass('bg-gray-900', 'text-gray-100');
    });

    it('should handle errors with curly braces', () => {
      const error = new Error('Function {getData} failed');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.textContent).toBe('Function {getData} failed');
    });

    it('should handle errors starting with "Error:"', () => {
      const error = new Error('Error: Connection failed');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.textContent).toBe('Error: Connection failed');
    });

    it('should handle error with no message', () => {
      const error = new Error();
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    it('should handle malformed JSON in error message', () => {
      const error = new Error('{invalid json}');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      // Should fall back to code display because it contains braces
      const codeElement = screen.getByRole('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent('{invalid json}');
    });
  });

  describe('Retry functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should have correct button type', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Styling', () => {
    it('should have correct container styles', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const container = screen.getByText('An error occurred').parentElement;
      expect(container).toHaveClass('mt-4', 'p-4', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg');
    });

    it('should have correct title styles', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const title = screen.getByText('An error occurred');
      expect(title).toHaveClass('text-red-600', 'font-medium', 'mb-2');
    });

    it('should have correct retry button styles', () => {
      const error = new Error('Test error');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Retry' });
      expect(retryButton).toHaveClass('mt-2', 'px-4', 'py-2', 'text-sm', 'text-red-600', 'border', 'border-red-300', 'rounded-md', 'hover:bg-red-100');
    });

    it('should have scrollable code blocks', () => {
      const error = new Error('{"error": "test"}');
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const preElement = screen.getByRole('code').parentElement;
      expect(preElement).toHaveClass('overflow-x-auto');
    });
  });

  describe('Component updates', () => {
    it('should update when error changes', () => {
      const { rerender } = render(<ErrorDisplay error={new Error('First error')} onRetry={mockOnRetry} />);

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<ErrorDisplay error={new Error('Second error')} onRetry={mockOnRetry} />);

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('should hide when error becomes null', () => {
      const { rerender } = render(<ErrorDisplay error={new Error('Test error')} onRetry={mockOnRetry} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();

      rerender(<ErrorDisplay error={null} onRetry={mockOnRetry} />);

      expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
    });
  });

  describe('Complex error scenarios', () => {
    it('should handle nested JSON errors', () => {
      const nestedError = {
        error: {
          type: 'ValidationError',
          details: {
            field: 'prompt',
            issue: 'Too long'
          }
        }
      };
      const error = new Error(JSON.stringify(nestedError));
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      expect(codeElement.textContent).toContain('"type": "ValidationError"');
      expect(codeElement.textContent).toContain('"field": "prompt"');
      expect(codeElement.textContent).toContain('"issue": "Too long"');
    });

    it('should handle array JSON errors', () => {
      const arrayError = [
        { error: 'First error' },
        { error: 'Second error' }
      ];
      const error = new Error(JSON.stringify(arrayError));
      render(<ErrorDisplay error={error} onRetry={mockOnRetry} />);

      const codeElement = screen.getByRole('code');
      expect(codeElement.textContent).toContain('"error": "First error"');
      expect(codeElement.textContent).toContain('"error": "Second error"');
    });
  });
});