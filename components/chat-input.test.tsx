/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInput from './chat-input';

describe('ChatInput', () => {
  const defaultProps = {
    status: 'ready',
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ChatInput {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Say something... (Shift+Enter for new line)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });

    it('should render stop button when streaming and stop function is provided', () => {
      render(<ChatInput {...defaultProps} status="streaming" stop={jest.fn()} />);
      
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });

    it('should render stop button when submitted and stop function is provided', () => {
      render(<ChatInput {...defaultProps} status="submitted" stop={jest.fn()} />);
      
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });

    it('should not render stop button when ready', () => {
      render(<ChatInput {...defaultProps} stop={jest.fn()} />);
      
      expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
    });
  });

  describe('Input behavior', () => {
    it('should update input value when typing', () => {
      render(<ChatInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      expect(textarea).toHaveValue('Hello world');
    });

    it('should disable input when status is not ready', () => {
      render(<ChatInput {...defaultProps} status="streaming" />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      expect(textarea).toBeDisabled();
    });

    it('should enable input when status is ready', () => {
      render(<ChatInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Form submission', () => {
    it('should submit form on Enter key press', () => {
      const onSubmit = jest.fn();
      render(<ChatInput {...defaultProps} onSubmit={onSubmit} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      
      expect(onSubmit).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('should not submit form on Shift+Enter', () => {
      const onSubmit = jest.fn();
      render(<ChatInput {...defaultProps} onSubmit={onSubmit} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should submit form on Send button click', () => {
      const onSubmit = jest.fn();
      render(<ChatInput {...defaultProps} onSubmit={onSubmit} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      const sendButton = screen.getByRole('button', { name: 'Send' });
      
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      expect(onSubmit).toHaveBeenCalledWith('Test message');
      expect(textarea).toHaveValue('');
    });

    it('should not submit empty messages', () => {
      const onSubmit = jest.fn();
      render(<ChatInput {...defaultProps} onSubmit={onSubmit} />);
      
      const sendButton = screen.getByRole('button', { name: 'Send' });
      
      fireEvent.click(sendButton);
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should not submit messages with only whitespace', () => {
      const onSubmit = jest.fn();
      render(<ChatInput {...defaultProps} onSubmit={onSubmit} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Send button state', () => {
    it('should disable Send button when input is empty', () => {
      render(<ChatInput {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: 'Send' });
      
      expect(sendButton).toBeDisabled();
    });

    it('should enable Send button when input has text', () => {
      render(<ChatInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)');
      const sendButton = screen.getByRole('button', { name: 'Send' });
      
      fireEvent.change(textarea, { target: { value: 'Test' } });
      
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable Send button when status is not ready', () => {
      render(<ChatInput {...defaultProps} status="streaming" />);
      
      const sendButton = screen.getByRole('button', { name: 'Send' });
      
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Stop functionality', () => {
    it('should call stop function when Stop button is clicked', () => {
      const stop = jest.fn();
      render(<ChatInput {...defaultProps} status="streaming" stop={stop} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      
      fireEvent.click(stopButton);
      
      expect(stop).toHaveBeenCalled();
    });
  });

  describe('Textarea auto-resize', () => {
    it('should auto-resize textarea based on content', async () => {
      render(<ChatInput {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('Say something... (Shift+Enter for new line)') as HTMLTextAreaElement;
      
      // Set a mock scrollHeight
      Object.defineProperty(textarea, 'scrollHeight', {
        configurable: true,
        value: 100,
      });
      
      // Type multi-line content
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });
      
      // Wait for effect to run
      await waitFor(() => {
        expect(textarea.style.height).toBe('100px');
      });
    });
  });
});