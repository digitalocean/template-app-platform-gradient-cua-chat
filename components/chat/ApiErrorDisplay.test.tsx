/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ApiErrorDisplay from './ApiErrorDisplay';

describe('ApiErrorDisplay Component', () => {
  describe('Basic error rendering', () => {
    it('should render error with just a message', () => {
      const error = { message: 'Something went wrong' };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
    });

    it('should render default message when no message provided', () => {
      const error = {};
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should render error with status code', () => {
      const error = { 
        message: 'Bad Request', 
        statusCode: 400 
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('API Error (400)')).toBeInTheDocument();
      expect(screen.getByText('Bad Request')).toBeInTheDocument();
    });

    it('should render error with status code but no message', () => {
      const error = { statusCode: 500 };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('API Error (500)')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  describe('ResponseBody handling', () => {
    it('should parse JSON responseBody and use message from it', () => {
      const error = {
        message: 'Original message',
        responseBody: JSON.stringify({
          message: 'JSON message',
          details: 'Additional details'
        })
      };
      render(<ApiErrorDisplay error={error} />);

      // Should use message from JSON, not original message
      expect(screen.getByText('JSON message')).toBeInTheDocument();
      expect(screen.queryByText('Original message')).not.toBeInTheDocument();
      
      // Details should be available
      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should handle JSON responseBody with only message', () => {
      const error = {
        responseBody: JSON.stringify({
          message: 'JSON only message'
        })
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('JSON only message')).toBeInTheDocument();
      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });

    it('should handle JSON responseBody with only details', () => {
      const error = {
        message: 'Original message',
        responseBody: JSON.stringify({
          details: 'Some details without message'
        })
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Original message')).toBeInTheDocument();
      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should handle non-JSON responseBody as details', () => {
      const error = {
        message: 'Error occurred',
        responseBody: 'Plain text error response'
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should handle malformed JSON in responseBody', () => {
      const error = {
        message: 'Error occurred',
        responseBody: '{"invalid": json}'
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Show details')).toBeInTheDocument();
    });

    it('should handle empty responseBody', () => {
      const error = {
        message: 'Error occurred',
        responseBody: ''
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });
  });

  describe('Details collapsible functionality', () => {
    it('should expand and collapse details when clicked', () => {
      const error = {
        responseBody: JSON.stringify({
          message: 'Error message',
          details: 'Detailed error information'
        })
      };
      render(<ApiErrorDisplay error={error} />);

      const detailsElement = screen.getByText('Show details');
      expect(detailsElement).toBeInTheDocument();
      
      // Details should not be visible initially
      expect(screen.queryByText('Detailed error information')).not.toBeVisible();

      // Click to expand
      fireEvent.click(detailsElement);
      expect(screen.getByText('Detailed error information')).toBeVisible();

      // Click to collapse
      fireEvent.click(detailsElement);
      expect(screen.queryByText('Detailed error information')).not.toBeVisible();
    });

    it('should show details in preformatted text', () => {
      const details = 'Line 1\nLine 2\n  Indented line';
      const error = {
        responseBody: JSON.stringify({
          details: details
        })
      };
      render(<ApiErrorDisplay error={error} />);

      fireEvent.click(screen.getByText('Show details'));
      
      const preElement = screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('Line 1');
      });
      expect(preElement.tagName).toBe('PRE');
      expect(preElement).toHaveClass('text-xs', 'text-red-700', 'overflow-x-auto', 'bg-red-100', 'p-2', 'rounded');
    });

    it('should show non-JSON responseBody as details', () => {
      const responseBody = 'Stack trace:\n  at function1()\n  at function2()';
      const error = {
        message: 'Runtime error',
        responseBody: responseBody
      };
      render(<ApiErrorDisplay error={error} />);

      fireEvent.click(screen.getByText('Show details'));
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('Stack trace');
      })).toBeInTheDocument();
    });
  });

  describe('Custom className prop', () => {
    it('should apply custom className', () => {
      const error = { message: 'Test error' };
      const { container } = render(<ApiErrorDisplay error={error} className="custom-class" />);

      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).toHaveClass('custom-class');
    });

    it('should preserve base classes when custom className is provided', () => {
      const error = { message: 'Test error' };
      const { container } = render(<ApiErrorDisplay error={error} className="custom-class" />);

      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).toHaveClass('rounded-lg', 'border', 'border-red-300', 'bg-red-50', 'p-4', 'custom-class');
    });

    it('should work without custom className', () => {
      const error = { message: 'Test error' };
      const { container } = render(<ApiErrorDisplay error={error} />);

      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).toHaveClass('rounded-lg', 'border', 'border-red-300', 'bg-red-50', 'p-4');
    });
  });

  describe('Styling and structure', () => {
    it('should have correct container structure and styles', () => {
      const error = { message: 'Test error', statusCode: 404 };
      const { container } = render(<ApiErrorDisplay error={error} />);

      const errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).toHaveClass('rounded-lg', 'border', 'border-red-300', 'bg-red-50', 'p-4');
    });

    it('should have correct icon placement and styles', () => {
      const error = { message: 'Test error' };
      render(<ApiErrorDisplay error={error} />);

      const icon = screen.getByTestId('alert-triangle');
      expect(icon).toHaveClass('h-5', 'w-5', 'text-red-600', 'flex-shrink-0', 'mt-0.5');
    });

    it('should have correct title styles', () => {
      const error = { message: 'Test error', statusCode: 500 };
      render(<ApiErrorDisplay error={error} />);

      const title = screen.getByText('API Error (500)');
      expect(title).toHaveClass('font-medium', 'text-red-900');
    });

    it('should have correct message styles', () => {
      const error = { message: 'Test error message' };
      render(<ApiErrorDisplay error={error} />);

      const message = screen.getByText('Test error message');
      expect(message).toHaveClass('mt-1', 'text-sm', 'text-red-800');
    });

    it('should have correct details summary styles', () => {
      const error = {
        responseBody: JSON.stringify({ details: 'Some details' })
      };
      render(<ApiErrorDisplay error={error} />);

      const summary = screen.getByText('Show details');
      expect(summary).toHaveClass('cursor-pointer', 'text-sm', 'text-red-700', 'hover:text-red-900');
    });
  });

  describe('Edge cases and empty states', () => {
    it('should handle undefined error properties', () => {
      const error = {
        message: undefined,
        statusCode: undefined,
        responseBody: undefined
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });

    it('should handle null responseBody', () => {
      const error = {
        message: 'Test error',
        responseBody: null as unknown as string
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.queryByText('Show details')).not.toBeInTheDocument();
    });

    it('should handle zero status code', () => {
      const error = {
        message: 'Connection error',
        statusCode: 0
      };
      render(<ApiErrorDisplay error={error} />);

      // Status code 0 is falsy, so it won't be displayed
      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.queryByText('API Error (0)')).not.toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'This is a very '.repeat(50) + 'long error message';
      const error = { message: longMessage };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in error message', () => {
      const error = { message: 'Error with special chars: <>{}[]()&amp;' };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Error with special chars: <>{}[]()&amp;')).toBeInTheDocument();
    });
  });

  describe('Complex responseBody scenarios', () => {
    it('should handle nested JSON objects in responseBody', () => {
      const error = {
        responseBody: JSON.stringify({
          message: 'Validation failed',
          details: JSON.stringify({
            field: 'email',
            errors: ['Invalid format', 'Already exists']
          })
        })
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Validation failed')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Show details'));
      const detailsText = screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('email');
      }).textContent;
      expect(detailsText).toContain('email');
      expect(detailsText).toContain('Invalid format');
      expect(detailsText).toContain('Already exists');
    });

    it('should handle arrays in JSON responseBody', () => {
      const error = {
        responseBody: JSON.stringify({
          message: 'Multiple errors',
          details: JSON.stringify(['Error 1', 'Error 2', 'Error 3'])
        })
      };
      render(<ApiErrorDisplay error={error} />);

      expect(screen.getByText('Multiple errors')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Show details'));
      const detailsText = screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('Error 1');
      }).textContent;
      expect(detailsText).toContain('Error 1');
      expect(detailsText).toContain('Error 2');
      expect(detailsText).toContain('Error 3');
    });

    it('should handle boolean and number values in JSON', () => {
      const error = {
        responseBody: JSON.stringify({
          message: 'Configuration error',
          details: JSON.stringify({
            enabled: false,
            retryCount: 3,
            timeout: null
          })
        })
      };
      render(<ApiErrorDisplay error={error} />);

      fireEvent.click(screen.getByText('Show details'));
      const detailsText = screen.getByText((content, element) => {
        return element?.tagName === 'PRE' && content.includes('enabled');
      }).textContent;
      expect(detailsText).toContain('false');
      expect(detailsText).toContain('3');
      expect(detailsText).toContain('null');
    });
  });

  describe('Component updates and re-renders', () => {
    it('should update when error changes', () => {
      const { rerender } = render(
        <ApiErrorDisplay error={{ message: 'First error' }} />
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<ApiErrorDisplay error={{ message: 'Second error' }} />);

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('should update details when responseBody changes', () => {
      const { rerender } = render(
        <ApiErrorDisplay error={{ 
          responseBody: JSON.stringify({ details: 'First details' })
        }} />
      );

      fireEvent.click(screen.getByText('Show details'));
      expect(screen.getByText('First details')).toBeInTheDocument();

      rerender(<ApiErrorDisplay error={{ 
        responseBody: JSON.stringify({ details: 'Second details' })
      }} />);

      expect(screen.queryByText('First details')).not.toBeInTheDocument();
      expect(screen.getByText('Second details')).toBeInTheDocument();
    });

    it('should handle className updates', () => {
      const { rerender, container } = render(
        <ApiErrorDisplay error={{ message: 'Test' }} className="first-class" />
      );

      let errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).toHaveClass('first-class');

      rerender(<ApiErrorDisplay error={{ message: 'Test' }} className="second-class" />);

      errorContainer = container.firstChild as HTMLElement;
      expect(errorContainer).not.toHaveClass('first-class');
      expect(errorContainer).toHaveClass('second-class');
    });
  });
});