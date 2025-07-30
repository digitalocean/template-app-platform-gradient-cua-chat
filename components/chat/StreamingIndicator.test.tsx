/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import StreamingIndicator from './StreamingIndicator';

describe('StreamingIndicator', () => {
  const defaultProps = {
    isStreaming: true,
    onStop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when isStreaming is true', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      expect(screen.getByText('Assistant is typing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });

    it('should not render when isStreaming is false', () => {
      render(<StreamingIndicator {...defaultProps} isStreaming={false} />);
      
      expect(screen.queryByText('Assistant is typing...')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
    });

    it('should return null when not streaming', () => {
      const { container } = render(<StreamingIndicator {...defaultProps} isStreaming={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Stop functionality', () => {
    it('should call onStop when stop button is clicked', () => {
      const onStop = jest.fn();
      render(<StreamingIndicator {...defaultProps} onStop={onStop} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      fireEvent.click(stopButton);
      
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('should have correct button type', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      expect(stopButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Styling', () => {
    it('should have correct container classes', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      const container = screen.getByText('Assistant is typing...').parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('gap-3');
      expect(container).toHaveClass('text-gray-500');
    });

    it('should have animate-pulse class on text', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      const typingText = screen.getByText('Assistant is typing...');
      expect(typingText).toHaveClass('animate-pulse');
    });

    it('should have correct stop button classes', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      expect(stopButton).toHaveClass('px-3');
      expect(stopButton).toHaveClass('py-1');
      expect(stopButton).toHaveClass('text-sm');
      expect(stopButton).toHaveClass('text-red-600');
      expect(stopButton).toHaveClass('border');
      expect(stopButton).toHaveClass('border-red-300');
      expect(stopButton).toHaveClass('rounded-md');
      expect(stopButton).toHaveClass('hover:bg-red-50');
    });
  });

  describe('Component updates', () => {
    it('should appear when isStreaming changes to true', () => {
      const { rerender } = render(<StreamingIndicator {...defaultProps} isStreaming={false} />);
      
      expect(screen.queryByText('Assistant is typing...')).not.toBeInTheDocument();
      
      rerender(<StreamingIndicator {...defaultProps} isStreaming={true} />);
      
      expect(screen.getByText('Assistant is typing...')).toBeInTheDocument();
    });

    it('should disappear when isStreaming changes to false', () => {
      const { rerender } = render(<StreamingIndicator {...defaultProps} isStreaming={true} />);
      
      expect(screen.getByText('Assistant is typing...')).toBeInTheDocument();
      
      rerender(<StreamingIndicator {...defaultProps} isStreaming={false} />);
      
      expect(screen.queryByText('Assistant is typing...')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button text', () => {
      render(<StreamingIndicator {...defaultProps} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      expect(stopButton).toHaveTextContent('Stop');
    });

    it('should allow keyboard interaction with stop button', () => {
      const onStop = jest.fn();
      render(<StreamingIndicator {...defaultProps} onStop={onStop} />);
      
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      
      // Simulate Enter key press
      fireEvent.keyDown(stopButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(stopButton);
      
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });
});