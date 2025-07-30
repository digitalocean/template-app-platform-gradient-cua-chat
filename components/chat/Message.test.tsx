/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Message from './Message';
import { UIMessage } from 'ai';
import { 
  REAL_USER_MESSAGE, 
  REAL_ASSISTANT_TEXT_MESSAGE,
  REAL_ASSISTANT_TOOL_MESSAGE,
  REAL_MULTI_PART_MESSAGE
} from '@/lib/test-utils/real-message-examples';

// Mock the tool handlers
jest.mock('@/lib/tool-handlers', () => ({
  renderMessagePart: jest.fn((messageId, index, part) => (
    <div key={`${messageId}-${index}`} data-testid={`part-${index}`}>
      {part.type}: {part.text || part.toolName || 'content'}
    </div>
  )),
}));

// Mock the CollapsibleContent component
jest.mock('@/components/media-renderers', () => ({
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

describe('Message Component', () => {
  const mockAddToolResult = jest.fn();
  
  const createMockMessage = (overrides?: Partial<UIMessage>): UIMessage => ({
    id: 'msg-1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Hello' },
      { type: 'tool-call', toolName: 'test', toolCallId: 'call-1' },
    ],
    ...overrides,
  } as UIMessage);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render user message with correct styling', () => {
      const message = createMockMessage({ role: 'user' });
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
        />
      );

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('You')).toHaveClass('text-blue-600');
    });

    it('should render assistant message with correct styling', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
        />
      );

      expect(screen.getByText('Assistant')).toBeInTheDocument();
      expect(screen.getByText('Assistant')).toHaveClass('text-green-600');
    });

    it('should not show role label when isNewRole is false', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={false}
          addToolResult={mockAddToolResult}
        />
      );

      expect(screen.queryByText('Assistant')).not.toBeInTheDocument();
    });
  });

  describe('Debug Mode', () => {
    it('should not show debug button when debug is false', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={false}
        />
      );

      expect(screen.queryByTitle('Toggle debug view')).not.toBeInTheDocument();
    });

    it('should show debug button with part count when debug is true', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      const debugButton = screen.getByTitle('Toggle debug view');
      expect(debugButton).toBeInTheDocument();
      expect(debugButton).toHaveTextContent('{2}'); // 2 parts
    });

    it('should toggle debug panel when button is clicked', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      const debugButton = screen.getByTitle('Toggle debug view');
      
      // Initially debug panel should not be visible
      expect(screen.queryByText(/Message ID:/)).not.toBeInTheDocument();

      // Click to show debug panel
      fireEvent.click(debugButton);
      
      expect(screen.getByText(/Message ID: msg-1/)).toBeInTheDocument();
      expect(screen.getByText(/Parts: 2/)).toBeInTheDocument();
      expect(debugButton).toHaveTextContent('✕');

      // Click again to hide
      fireEvent.click(debugButton);
      
      expect(screen.queryByText(/Message ID:/)).not.toBeInTheDocument();
      expect(debugButton).toHaveTextContent('{2}');
    });

    it('should show part type counts in debug panel', () => {
      const message = createMockMessage({
        parts: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: 'World' },
          { type: 'tool-call', toolName: 'test', toolCallId: 'call-1' },
          { type: 'step-start' },
        ],
      });
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      fireEvent.click(screen.getByTitle('Toggle debug view'));
      
      expect(screen.getByText(/text: 2/)).toBeInTheDocument();
      expect(screen.getByText(/tool-call: 1/)).toBeInTheDocument();
      expect(screen.getByText(/step-start: 1/)).toBeInTheDocument();
    });

    it('should show expandable raw JSON', () => {
      const message = createMockMessage();
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      fireEvent.click(screen.getByTitle('Toggle debug view'));
      
      const summary = screen.getByText('View raw JSON');
      expect(summary).toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(summary);
      
      // Should show the JSON content
      const jsonContent = screen.getByText(/"id": "msg-1"/);
      expect(jsonContent).toBeInTheDocument();
    });
  });

  describe('Message Parts Rendering', () => {
    it('should render all message parts', () => {
      const message = createMockMessage();
      const { renderMessagePart } = require('@/lib/tool-handlers');
      
      render(
        <Message
          message={message}
          isNewRole={true}
          addToolResult={mockAddToolResult}
        />
      );

      expect(renderMessagePart).toHaveBeenCalledTimes(2);
      expect(renderMessagePart).toHaveBeenCalledWith(
        'msg-1',
        0,
        { type: 'text', text: 'Hello' },
        mockAddToolResult
      );
      expect(renderMessagePart).toHaveBeenCalledWith(
        'msg-1',
        1,
        { type: 'tool-call', toolName: 'test', toolCallId: 'call-1' },
        mockAddToolResult
      );
    });
  });

  describe('Real Message Structure Tests', () => {
    it('should correctly render real user message', () => {
      render(
        <Message
          message={REAL_USER_MESSAGE}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      expect(screen.getByText('You')).toBeInTheDocument();
      
      // Check debug info matches real structure
      fireEvent.click(screen.getByTitle('Toggle debug view'));
      expect(screen.getByText(/Message ID: F80TLDwKOEN7tK2w/)).toBeInTheDocument();
      expect(screen.getByText(/Parts: 1/)).toBeInTheDocument();
      expect(screen.getByText(/text: 1/)).toBeInTheDocument();
    });

    it('should correctly render real assistant text message', () => {
      const { renderMessagePart } = require('@/lib/tool-handlers');
      
      render(
        <Message
          message={REAL_ASSISTANT_TEXT_MESSAGE}
          isNewRole={true}
          addToolResult={mockAddToolResult}
        />
      );

      expect(screen.getByText('Assistant')).toBeInTheDocument();
      expect(renderMessagePart).toHaveBeenCalledWith(
        'msg_123',
        0,
        { type: 'text', text: '2 + 2 equals 4.' },
        mockAddToolResult
      );
    });

    it('should correctly render real assistant tool message', () => {
      const { renderMessagePart } = require('@/lib/tool-handlers');
      
      render(
        <Message
          message={REAL_ASSISTANT_TOOL_MESSAGE}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      // Check debug shows correct part counts
      fireEvent.click(screen.getByTitle('Toggle debug view'));
      expect(screen.getByText(/Parts: 2/)).toBeInTheDocument();
      expect(screen.getByText(/text: 1/)).toBeInTheDocument();
      expect(screen.getByText(/tool: 1/)).toBeInTheDocument();

      // Verify tool call part was rendered correctly
      expect(renderMessagePart).toHaveBeenCalledWith(
        'msg_456',
        1,
        {
          type: 'tool',
          toolCallId: 'toolu_01ABC123',
          toolName: 'browser_take_screenshot',
          args: { filename: 'screenshot.png' },
          state: 'partial-call'
        },
        mockAddToolResult
      );
    });

    it('should correctly render real multi-part message', () => {
      const { renderMessagePart } = require('@/lib/tool-handlers');
      
      render(
        <Message
          message={REAL_MULTI_PART_MESSAGE}
          isNewRole={true}
          addToolResult={mockAddToolResult}
          debug={true}
        />
      );

      // Should render all 3 text parts
      expect(renderMessagePart).toHaveBeenCalledTimes(3);
      
      // Check debug shows 3 text parts
      fireEvent.click(screen.getByTitle('Toggle debug view'));
      expect(screen.getByText(/Parts: 3/)).toBeInTheDocument();
      expect(screen.getByText(/text: 3/)).toBeInTheDocument();
    });
  });
});