/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { UIMessage } from 'ai';
import MessagesArea from './MessagesArea';

// Mock child components
jest.mock('./Message', () => {
  return function Message({ message, isNewRole, addToolResult, debug }: any) {
    return (
      <div data-testid={`message-${message.id}`}>
        <div>Role: {message.role}</div>
        <div>Content: {message.content}</div>
        <div>Is New Role: {isNewRole.toString()}</div>
        <div>Debug: {debug.toString()}</div>
        {message.toolInvocations && (
          <button onClick={() => addToolResult({ tool: 'test', toolCallId: '123', output: 'result' })}>
            Add Tool Result
          </button>
        )}
      </div>
    );
  };
});

jest.mock('./StreamingIndicator', () => {
  return function StreamingIndicator({ isStreaming, onStop }: any) {
    if (!isStreaming) return null;
    return (
      <div data-testid="streaming-indicator">
        <span>Streaming...</span>
        <button onClick={onStop}>Stop</button>
      </div>
    );
  };
});

jest.mock('./ErrorDisplay', () => {
  return function ErrorDisplay({ error, onRetry }: any) {
    if (!error) return null;
    return (
      <div data-testid="error-display">
        <span>Error: {error.message}</span>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  };
});

describe('MessagesArea', () => {
  const mockMessages: UIMessage[] = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
    { id: '3', role: 'assistant', content: 'How can I help you?' },
    { id: '4', role: 'user', content: 'Tell me a joke' },
  ];

  const defaultProps = {
    messages: mockMessages,
    status: 'ready',
    error: null,
    addToolResult: jest.fn(),
    stop: jest.fn(),
    regenerate: jest.fn(),
    debug: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all messages', () => {
      render(<MessagesArea {...defaultProps} />);
      
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-3')).toBeInTheDocument();
      expect(screen.getByTestId('message-4')).toBeInTheDocument();
    });

    it('should render empty when no messages', () => {
      render(<MessagesArea {...defaultProps} messages={[]} />);
      
      expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument();
    });

    it('should have correct container classes', () => {
      const { container } = render(<MessagesArea {...defaultProps} />);
      const messagesArea = container.firstChild;
      
      expect(messagesArea).toHaveClass('flex-1', 'overflow-y-auto', 'px-6', 'py-4');
    });

    it('should have max-width wrapper', () => {
      render(<MessagesArea {...defaultProps} />);
      
      const wrapper = screen.getByTestId('message-1').parentElement;
      expect(wrapper).toHaveClass('max-w-full');
    });
  });

  describe('Message properties', () => {
    it('should pass correct message content', () => {
      render(<MessagesArea {...defaultProps} />);
      
      expect(screen.getByText('Content: Hello')).toBeInTheDocument();
      expect(screen.getByText('Content: Hi there!')).toBeInTheDocument();
      expect(screen.getByText('Content: How can I help you?')).toBeInTheDocument();
      expect(screen.getByText('Content: Tell me a joke')).toBeInTheDocument();
    });

    it('should detect role changes correctly', () => {
      render(<MessagesArea {...defaultProps} />);
      
      // First message is always a new role
      expect(screen.getByTestId('message-1')).toHaveTextContent('Is New Role: true');
      
      // Second message has different role from first
      expect(screen.getByTestId('message-2')).toHaveTextContent('Is New Role: true');
      
      // Third message has same role as second
      expect(screen.getByTestId('message-3')).toHaveTextContent('Is New Role: false');
      
      // Fourth message has different role from third
      expect(screen.getByTestId('message-4')).toHaveTextContent('Is New Role: true');
    });

    it('should pass debug prop to messages', () => {
      const { rerender } = render(<MessagesArea {...defaultProps} debug={false} />);
      
      expect(screen.getByTestId('message-1')).toHaveTextContent('Debug: false');
      
      rerender(<MessagesArea {...defaultProps} debug={true} />);
      
      expect(screen.getByTestId('message-1')).toHaveTextContent('Debug: true');
    });

    it('should pass addToolResult to messages', () => {
      const addToolResult = jest.fn();
      const messagesWithTools: UIMessage[] = [
        { id: '1', role: 'assistant', content: 'Using tool...', toolInvocations: [] },
      ];
      
      render(<MessagesArea {...defaultProps} messages={messagesWithTools} addToolResult={addToolResult} />);
      
      const button = screen.getByText('Add Tool Result');
      fireEvent.click(button);
      
      expect(addToolResult).toHaveBeenCalledWith({
        tool: 'test',
        toolCallId: '123',
        output: 'result',
      });
    });
  });

  describe('Streaming indicator', () => {
    it('should show streaming indicator when status is submitted', () => {
      render(<MessagesArea {...defaultProps} status="submitted" />);
      
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
      expect(screen.getByText('Streaming...')).toBeInTheDocument();
    });

    it('should show streaming indicator when status is streaming', () => {
      render(<MessagesArea {...defaultProps} status="streaming" />);
      
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    it('should not show streaming indicator when status is ready', () => {
      render(<MessagesArea {...defaultProps} status="ready" />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('should call stop when stop button is clicked', () => {
      const stop = jest.fn();
      render(<MessagesArea {...defaultProps} status="streaming" stop={stop} />);
      
      const stopButton = screen.getByText('Stop');
      fireEvent.click(stopButton);
      
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error display', () => {
    it('should show error display when error is present', () => {
      const error = new Error('Test error message');
      render(<MessagesArea {...defaultProps} error={error} />);
      
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    });

    it('should not show error display when error is null', () => {
      render(<MessagesArea {...defaultProps} error={null} />);
      
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });

    it('should call regenerate when retry button is clicked', () => {
      const regenerate = jest.fn();
      const error = new Error('Test error');
      render(<MessagesArea {...defaultProps} error={error} regenerate={regenerate} />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(regenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component updates', () => {
    it('should update when messages change', () => {
      const { rerender } = render(<MessagesArea {...defaultProps} />);
      
      expect(screen.getAllByTestId(/message-/)).toHaveLength(4);
      
      const newMessages: UIMessage[] = [
        { id: '5', role: 'assistant', content: 'Here is a joke!' },
      ];
      
      rerender(<MessagesArea {...defaultProps} messages={newMessages} />);
      
      expect(screen.getAllByTestId(/message-/)).toHaveLength(1);
      expect(screen.getByTestId('message-5')).toBeInTheDocument();
    });

    it('should update streaming indicator when status changes', () => {
      const { rerender } = render(<MessagesArea {...defaultProps} status="ready" />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
      
      rerender(<MessagesArea {...defaultProps} status="streaming" />);
      
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    it('should update error display when error changes', () => {
      const { rerender } = render(<MessagesArea {...defaultProps} error={null} />);
      
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      
      const error = new Error('New error');
      rerender(<MessagesArea {...defaultProps} error={error} />);
      
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Error: New error')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render all components together correctly', () => {
      const error = new Error('Test error');
      render(<MessagesArea
        {...defaultProps}
        status="streaming"
        error={error}
      />);
      
      // Messages should be rendered
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      
      // Streaming indicator should be shown
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
      
      // Error should be shown
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    it('should maintain scroll container', () => {
      const { container } = render(<MessagesArea {...defaultProps} />);
      const scrollContainer = container.firstChild;
      
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });
  });
});