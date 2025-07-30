/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatSidebar from './ChatSidebar';

// Mock child components
jest.mock('@/components/ModelSelector', () => {
  return function ModelSelector({ selectedModel, onModelChange }: any) {
    return (
      <div data-testid="model-selector">
        <select value={selectedModel} onChange={(e) => onModelChange(e.target.value, 1000)}>
          <option value="model-1">Model 1</option>
          <option value="model-2">Model 2</option>
        </select>
      </div>
    );
  };
});

jest.mock('@/components/ParameterControls', () => {
  return function ParameterControls(props: any) {
    return (
      <div data-testid="parameter-controls">
        {Object.entries(props).map(([key, value]) => {
          if (key === 'onParameterChange') return null;
          return (
            <div key={key}>
              <label>{key}</label>
              <input
                type="number"
                value={value as number}
                onChange={(e) => props.onParameterChange(key, Number(e.target.value))}
              />
            </div>
          );
        })}
      </div>
    );
  };
});

describe('ChatSidebar', () => {
  const defaultProps = {
    selectedModel: 'model-1',
    parameters: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      presencePenalty: 0,
      frequencyPenalty: 0,
      maxOutputTokens: 4096,
      maxSteps: 5,
    },
    onModelChange: jest.fn(),
    onParameterChange: jest.fn(),
    onNewChat: jest.fn(),
    debugMode: false,
    onToggleDebug: jest.fn(),
    width: 300,
    onResize: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all main sections', () => {
      render(<ChatSidebar {...defaultProps} />);

      // Debug mode toggle
      expect(screen.getByText('Debug Mode')).toBeInTheDocument();
      
      // New chat button
      expect(screen.getByRole('button', { name: /New Chat/ })).toBeInTheDocument();
      
      // Model selector
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
      
      // Advanced settings button
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    });

    it('should apply correct width style', () => {
      const { container } = render(<ChatSidebar {...defaultProps} width={350} />);
      const sidebar = container.firstChild as HTMLElement;
      
      expect(sidebar.style.width).toBe('350px');
    });

    it('should show resize grabber', () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize');
      
      expect(grabber).toBeInTheDocument();
    });
  });

  describe('Debug mode toggle', () => {
    it('should show inactive state when debugMode is false', () => {
      render(<ChatSidebar {...defaultProps} debugMode={false} />);
      
      const toggle = screen.getByTitle('Enable debug mode to see raw message data');
      expect(toggle).toHaveClass('bg-gray-300');
    });

    it('should show active state when debugMode is true', () => {
      render(<ChatSidebar {...defaultProps} debugMode={true} />);
      
      const toggle = screen.getByTitle('Disable debug mode');
      expect(toggle).toHaveClass('bg-red-600');
    });

    it('should call onToggleDebug when clicked', () => {
      const onToggleDebug = jest.fn();
      render(<ChatSidebar {...defaultProps} onToggleDebug={onToggleDebug} />);
      
      const toggle = screen.getByTitle('Enable debug mode to see raw message data');
      fireEvent.click(toggle);
      
      expect(onToggleDebug).toHaveBeenCalled();
    });
  });

  describe('New chat button', () => {
    it('should call onNewChat when clicked', () => {
      const onNewChat = jest.fn();
      render(<ChatSidebar {...defaultProps} onNewChat={onNewChat} />);
      
      // The button now includes the keyboard shortcut in its accessible name
      const button = screen.getByRole('button', { name: /New Chat/ });
      fireEvent.click(button);
      
      expect(onNewChat).toHaveBeenCalled();
    });
  });

  describe('Advanced settings', () => {
    it('should not show parameter controls initially', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      expect(screen.queryByTestId('parameter-controls')).not.toBeInTheDocument();
    });

    it('should show parameter controls when advanced settings is clicked', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      const button = screen.getByText('Advanced Settings');
      fireEvent.click(button);
      
      expect(screen.getByTestId('parameter-controls')).toBeInTheDocument();
    });

    it('should hide parameter controls when clicked again', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      const button = screen.getByText('Advanced Settings');
      fireEvent.click(button);
      expect(screen.getByTestId('parameter-controls')).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(screen.queryByTestId('parameter-controls')).not.toBeInTheDocument();
    });

    it('should rotate arrow icon when expanded', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      const button = screen.getByText('Advanced Settings').closest('button');
      const arrow = button?.querySelector('svg');
      
      expect(arrow).not.toHaveClass('rotate-180');
      
      fireEvent.click(button!);
      expect(arrow).toHaveClass('rotate-180');
    });

    it('should pass parameters to ParameterControls', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      const button = screen.getByText('Advanced Settings');
      fireEvent.click(button);
      
      const controls = screen.getByTestId('parameter-controls');
      expect(controls).toBeInTheDocument();
      
      // Check that parameters are rendered
      expect(screen.getByText('temperature')).toBeInTheDocument();
      expect(screen.getByText('topK')).toBeInTheDocument();
    });
  });

  describe('Model selection', () => {
    it('should pass selectedModel to ModelSelector', () => {
      render(<ChatSidebar {...defaultProps} selectedModel="model-2" />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('model-2');
    });

    it('should call onModelChange when model is changed', () => {
      const onModelChange = jest.fn();
      render(<ChatSidebar {...defaultProps} onModelChange={onModelChange} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'model-2' } });
      
      expect(onModelChange).toHaveBeenCalledWith('model-2', 1000);
    });
  });

  describe('Resize functionality', () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should add event listeners on mousedown', () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      fireEvent.mouseDown(grabber);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should highlight grabber when resizing', () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      expect(grabber).toHaveClass('bg-transparent');
      
      fireEvent.mouseDown(grabber);
      expect(grabber).toHaveClass('bg-blue-500');
    });

    it('should call onResize with new width on mouse move', () => {
      const onResize = jest.fn();
      const { container } = render(<ChatSidebar {...defaultProps} onResize={onResize} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });
      
      fireEvent.mouseDown(grabber);
      
      // Simulate mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 600, // window.innerWidth - clientX = 400
      });
      document.dispatchEvent(mouseMoveEvent);
      
      expect(onResize).toHaveBeenCalledWith(400);
    });

    it('should respect min and max width constraints', () => {
      const onResize = jest.fn();
      const { container } = render(<ChatSidebar {...defaultProps} onResize={onResize} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      });
      
      fireEvent.mouseDown(grabber);
      
      // Try to resize below min width (280px)
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 800 })); // 200px width
      expect(onResize).not.toHaveBeenCalled();
      
      // Try to resize above max width (600px)
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 })); // 700px width
      expect(onResize).not.toHaveBeenCalled();
      
      // Resize within bounds
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600 })); // 400px width
      expect(onResize).toHaveBeenCalledWith(400);
    });

    it('should remove event listeners on mouseup', async () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      fireEvent.mouseDown(grabber);
      
      // Should add listeners when resizing starts
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      
      // Clear the spy to check for removals
      removeEventListenerSpy.mockClear();
      
      // Trigger mouseup - this should cause the component to clean up listeners
      document.dispatchEvent(new MouseEvent('mouseup'));
      
      // Use waitFor to handle async updates
      await waitFor(() => {
        // The component should have called removeEventListener when cleaning up
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('should remove event listeners on unmount during resize', () => {
      const { container, unmount } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      fireEvent.mouseDown(grabber);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Parameter changes', () => {
    it('should call onParameterChange when parameter is changed', () => {
      const onParameterChange = jest.fn();
      render(<ChatSidebar {...defaultProps} onParameterChange={onParameterChange} />);
      
      // Open advanced settings
      fireEvent.click(screen.getByText('Advanced Settings'));
      
      // Find temperature input by its value since label is not properly associated
      const inputs = screen.getAllByRole('spinbutton');
      const temperatureInput = inputs.find(input => (input as HTMLInputElement).value === '0.7');
      
      fireEvent.change(temperatureInput!, { target: { value: '0.5' } });
      
      expect(onParameterChange).toHaveBeenCalledWith('temperature', 0.5);
    });
  });

  describe('Hover effects', () => {
    it('should show hover effect on resize grabber', () => {
      const { container } = render(<ChatSidebar {...defaultProps} />);
      const grabber = container.querySelector('.cursor-col-resize')!;
      
      expect(grabber).toHaveClass('hover:bg-blue-500');
    });

    it('should show hover effect on advanced settings button', () => {
      render(<ChatSidebar {...defaultProps} />);
      
      const button = screen.getByText('Advanced Settings').closest('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });
  });
});