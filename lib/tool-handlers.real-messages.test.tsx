/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderMessagePart } from './tool-handlers';
import { 
  REAL_TOOL_RESULT_PART
} from '@/lib/test-utils/real-message-examples';

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

describe('Tool Handlers - Real Message Structure Tests', () => {
  const mockAddToolResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Real Tool Call Parts', () => {
    it('should handle real tool-call part structure - calling state', () => {
      const toolCallPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01ABC123',
        toolName: 'browser_take_screenshot',
        state: 'partial-call' as const,
        args: {
          filename: 'screenshot.png'
        }
      };

      const result = renderMessagePart('msg_456', 0, toolCallPart, mockAddToolResult);
      render(<>{result}</>);

      // Tool calls during streaming show state
      expect(screen.getByText(/browser_take_screenshot - State: partial-call/)).toBeInTheDocument();
    });

    it('should handle real tool-result part structure', () => {
      const result = renderMessagePart('msg_456', 0, REAL_TOOL_RESULT_PART, mockAddToolResult);
      render(<>{result}</>);

      // Tool results should render the content
      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('"type":"image"');
    });

    it('should handle streaming tool states - input-streaming', () => {
      const toolPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01DEF456',
        toolName: 'askForConfirmation',
        state: 'input-streaming' as const,
        args: {
          message: 'Do you want to proceed with this action?'
        }
      };
      
      const result = renderMessagePart('msg_789', 0, toolPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByText('Loading confirmation request...')).toBeInTheDocument();
    });

    it('should handle streaming tool states - input-available', () => {
      const toolPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01DEF456',
        toolName: 'askForConfirmation',
        state: 'input-available' as const,
        input: {
          message: 'Do you want to proceed with this action?'
        }
      };
      
      const result = renderMessagePart('msg_789', 0, toolPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByText('Do you want to proceed with this action?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should handle streaming tool states - output-available', () => {
      const toolPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01DEF456',
        toolName: 'askForConfirmation',
        state: 'output-available' as const,
        output: 'Yes, confirmed.'
      };
      
      const result = renderMessagePart('msg_789', 0, toolPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByText('Confirmation response: Yes, confirmed.')).toBeInTheDocument();
    });
  });

  describe('Real Screenshot Tool Flow', () => {
    it('should handle browser_take_screenshot with base64 result', () => {
      const screenshotResult = {
        type: 'tool-result' as const,
        toolCallId: 'toolu_01XYZ789',
        toolName: 'browser_take_screenshot',
        result: {
          content: [
            {
              type: 'image',
              data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              mimeType: 'image/png'
            }
          ]
        }
      };

      const result = renderMessagePart('msg_screenshot', 0, screenshotResult, mockAddToolResult);
      render(<>{result}</>);

      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      // The data should be passed to MediaRenderer for rendering
      expect(mediaRenderer.textContent).toContain('"type":"image"');
      expect(mediaRenderer.textContent).toContain('data:image/png;base64');
    });

    it('should handle browser_take_screenshot with S3 URL result', () => {
      const screenshotResult = {
        type: 'tool-result' as const,
        toolCallId: 'toolu_01XYZ789',
        toolName: 'browser_take_screenshot',
        result: {
          content: [
            {
              type: 'image',
              url: 'https://test-bucket.s3.amazonaws.com/uploads/uuid/screenshot.png',
              mimeType: 'image/png'
            }
          ]
        }
      };

      const result = renderMessagePart('msg_screenshot', 0, screenshotResult, mockAddToolResult);
      render(<>{result}</>);

      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('"url":"https://test-bucket.s3.amazonaws.com');
    });
  });

  describe('Interactive Tool Button Actions', () => {
    it('should handle confirmation tool Yes/No clicks correctly', () => {
      const confirmationPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01CONFIRM',
        toolName: 'askForConfirmation',
        state: 'input-available' as const,
        input: {
          message: 'Do you want to delete this file?'
        }
      };

      const result = renderMessagePart('msg_confirm', 0, confirmationPart, mockAddToolResult);
      render(<>{result}</>);

      // Click Yes
      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'askForConfirmation',
        toolCallId: 'toolu_01CONFIRM',
        output: 'Yes, confirmed.'
      });

      // Reset and test No
      mockAddToolResult.mockClear();
      
      const noPart = { ...confirmationPart, toolCallId: 'toolu_01CONFIRM2' };
      const { container } = render(
        <div id="test-no">{renderMessagePart('msg_confirm2', 0, noPart, mockAddToolResult)}</div>
      );

      const noButton = container.querySelector('#test-no button:nth-child(2)') as HTMLButtonElement;
      expect(noButton).toHaveTextContent('No');
      fireEvent.click(noButton);

      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'askForConfirmation',
        toolCallId: 'toolu_01CONFIRM2',
        output: 'No, denied'
      });
    });
  });

  describe('Error States', () => {
    it('should handle tool error state', () => {
      const errorPart = {
        type: 'tool' as const,
        toolCallId: 'toolu_01ERROR',
        toolName: 'browser_navigate',
        state: 'output-error' as const,
        errorText: 'Failed to navigate: Network timeout'
      };

      const result = renderMessagePart('msg_error', 0, errorPart, mockAddToolResult);
      render(<>{result}</>);

      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'Error in browser_navigate: Failed to navigate: Network timeout'
      );
    });
  });
});