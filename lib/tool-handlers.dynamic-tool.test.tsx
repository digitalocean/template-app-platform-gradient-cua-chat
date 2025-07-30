/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderMessagePart } from './tool-handlers';

// Mock the media renderer components
jest.mock('@/components/media-renderers', () => ({
  MediaRenderer: ({ content, className }: { content: unknown; className?: string }) => (
    <div className={className} data-testid="media-renderer">
      {JSON.stringify(content)}
    </div>
  ),
  TextRenderer: ({ text, className }: any) => (
    <div className={className} data-testid="text-renderer">
      {text}
    </div>
  ),
  ErrorDisplay: ({ error, title, className }: any) => (
    <div className={className} data-testid="error-display">
      {title}: {error}
    </div>
  ),
  CollapsibleContent: ({ title, children, className, defaultOpen }: any) => (
    <div className={className} data-testid="collapsible-content" data-open={defaultOpen}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  ),
}));

describe('Dynamic Tool Rendering', () => {
  const mockAddToolResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dynamic-tool type handling', () => {
    it('should render dynamic-tool type with input-streaming state', () => {
      const dynamicToolPart = {
        type: 'dynamic-tool' as const,
        toolName: 'browser_navigate',
        toolCallId: 'call_123',
        state: 'input-streaming' as const,
        input: {
          url: 'http://example.com'
        }
      };

      const result = renderMessagePart('msg_1', 0, dynamicToolPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByText('Loading browser_navigate...')).toBeInTheDocument();
    });

    it('should render dynamic-tool type with input-available state', () => {
      const dynamicToolPart = {
        type: 'dynamic-tool' as const,
        toolName: 'browser_navigate',
        toolCallId: 'call_123',
        state: 'input-available' as const,
        input: {
          url: 'http://example.com'
        }
      };

      const result = renderMessagePart('msg_1', 0, dynamicToolPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByText('browser_navigate')).toBeInTheDocument();
      expect(screen.getByText(/Input data/)).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should render dynamic-tool type with output-available state', () => {
      const dynamicToolPart = {
        type: 'dynamic-tool' as const,
        toolName: 'browser_navigate',
        toolCallId: 'call_123',
        state: 'output-available' as const,
        input: {
          url: 'http://example.com'
        },
        output: {
          content: [
            {
              type: 'text',
              text: 'Navigated successfully to example.com'
            }
          ],
          isError: false
        }
      };

      const result = renderMessagePart('msg_1', 0, dynamicToolPart, mockAddToolResult);
      render(<>{result}</>);

      // Should render the output
      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('Navigated successfully to example.com');
    });

    it('should render dynamic-tool type with error output', () => {
      const dynamicToolPart = {
        type: 'dynamic-tool' as const,
        toolName: 'browser_take_screenshot',
        toolCallId: 'call_456',
        state: 'output-available' as const,
        input: {
          filename: 'screenshot.png'
        },
        output: {
          content: [
            {
              type: 'text',
              text: 'Error: No open pages available.'
            }
          ],
          isError: true
        }
      };

      const result = renderMessagePart('msg_1', 0, dynamicToolPart, mockAddToolResult);
      render(<>{result}</>);

      // Should render the error
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText(/Error in browser_take_screenshot/)).toBeInTheDocument();
    });

    it('should render dynamic-tool without addToolResult in display mode', () => {
      const dynamicToolPart = {
        type: 'dynamic-tool' as const,
        toolName: 'browser_navigate',
        toolCallId: 'call_789',
        state: 'output-available' as const,
        input: {
          url: 'http://example.com'
        },
        output: {
          content: [
            {
              type: 'text',
              text: 'Navigation complete'
            }
          ],
          isError: false
        }
      };

      // Call without addToolResult to test display mode
      const result = renderMessagePart('msg_1', 0, dynamicToolPart);
      render(<>{result}</>);

      // Should still render the output
      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('Navigation complete');
    });
  });

  describe('Real conversation flow rendering', () => {
    it('should handle the exact structure from debug mode', () => {
      const realDynamicToolPart = {
        "type": "dynamic-tool",
        "toolName": "browser_navigate",
        "toolCallId": "call_JpPHgVdzflbW8hcNLe9Adixx",
        "state": "output-available",
        "input": {
          "url": "https://www.google.com"
        },
        "output": {
          "content": [
            {
              "type": "text",
              "text": "### Ran Playwright code\n```js\n// Navigate to https://www.google.com\nawait page.goto('https://www.google.com');\n```\n\n### Page state\n- Page URL: https://www.google.com/\n- Page Title: Google"
            }
          ],
          "isError": false
        }
      };

      const result = renderMessagePart('msg_real', 0, realDynamicToolPart as any);
      render(<>{result}</>);

      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('Navigate to https://www.google.com');
      expect(mediaRenderer.textContent).toContain('Page Title: Google');
    });
  });
});