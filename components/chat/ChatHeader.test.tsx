/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from './ChatHeader';

// Mock the imported components
jest.mock('@/components/ModelSelector', () => ({
  __esModule: true,
  default: ({ selectedModel, onModelChange }: any) => (
    <div data-testid="model-selector">
      Model: {selectedModel}
      <button onClick={() => onModelChange('new-model')}>Change Model</button>
    </div>
  ),
}));

jest.mock('@/components/ParameterControls', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="parameter-controls">
      Temperature: {props.temperature}
      <button onClick={() => props.onParameterChange('temperature', 0.8)}>
        Update Temperature
      </button>
    </div>
  ),
}));

describe('ChatHeader', () => {
  const defaultProps = {
    selectedModel: 'test-model',
    showAdvanced: false,
    parameters: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      maxOutputTokens: 32000,
      maxSteps: 20,
    },
    onModelChange: jest.fn(),
    onParameterChange: jest.fn(),
    onToggleAdvanced: jest.fn(),
    onNewChat: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders with basic elements', () => {
      render(<ChatHeader {...defaultProps} />);
      
      expect(screen.getByLabelText('Start new chat')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByTestId('model-selector')).toBeInTheDocument();
    });

    it('renders without debug button by default', () => {
      render(<ChatHeader {...defaultProps} />);
      
      expect(screen.queryByText('Debug')).not.toBeInTheDocument();
    });

    it('renders debug button when onToggleDebug is provided', () => {
      render(<ChatHeader {...defaultProps} onToggleDebug={jest.fn()} />);
      
      expect(screen.getByText('Debug')).toBeInTheDocument();
    });
  });

  describe('New chat functionality', () => {
    it('calls onNewChat when new chat button is clicked', () => {
      render(<ChatHeader {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('Start new chat'));
      expect(defaultProps.onNewChat).toHaveBeenCalledTimes(1);
    });

    it('shows tooltip on hover', () => {
      render(<ChatHeader {...defaultProps} />);
      
      // The tooltip now contains separate elements
      const tooltip = screen.getByText('New Chat').parentElement;
      expect(tooltip).toHaveClass('opacity-0');
      // Check for the group class on the parent button wrapper
      const groupElement = screen.getByLabelText('Start new chat').parentElement;
      expect(groupElement).toHaveClass('group');
    });
  });

  describe('Debug mode', () => {
    it('shows inactive debug button state', () => {
      render(<ChatHeader {...defaultProps} debugMode={false} onToggleDebug={jest.fn()} />);
      
      const button = screen.getByTitle('Enable debug mode');
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toHaveClass('text-gray-700');
    });

    it('shows active debug button state', () => {
      render(<ChatHeader {...defaultProps} debugMode={true} onToggleDebug={jest.fn()} />);
      
      const button = screen.getByTitle('Disable debug mode');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('text-white');
    });

    it('calls onToggleDebug when debug button is clicked', () => {
      const onToggleDebug = jest.fn();
      render(<ChatHeader {...defaultProps} onToggleDebug={onToggleDebug} />);
      
      fireEvent.click(screen.getByText('Debug'));
      expect(onToggleDebug).toHaveBeenCalledTimes(1);
    });
  });

  describe('Advanced controls', () => {
    it('toggles advanced controls when button is clicked', () => {
      render(<ChatHeader {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Advanced'));
      expect(defaultProps.onToggleAdvanced).toHaveBeenCalledTimes(1);
    });

    it('shows parameter controls when showAdvanced is true', () => {
      render(<ChatHeader {...defaultProps} showAdvanced={true} />);
      
      expect(screen.getByTestId('parameter-controls')).toBeInTheDocument();
      expect(screen.getByText('Temperature: 0.7')).toBeInTheDocument();
    });

    it('hides parameter controls when showAdvanced is false', () => {
      render(<ChatHeader {...defaultProps} showAdvanced={false} />);
      
      expect(screen.queryByTestId('parameter-controls')).not.toBeInTheDocument();
    });

    it('rotates chevron icon when advanced is shown', () => {
      const { rerender } = render(<ChatHeader {...defaultProps} showAdvanced={false} />);
      
      const chevron = screen.getByText('Advanced').querySelector('svg');
      expect(chevron).not.toHaveClass('rotate-180');
      
      rerender(<ChatHeader {...defaultProps} showAdvanced={true} />);
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('Model and parameter handling', () => {
    it('passes through model changes', () => {
      render(<ChatHeader {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Change Model'));
      expect(defaultProps.onModelChange).toHaveBeenCalledWith('new-model');
    });

    it('passes through parameter changes', () => {
      render(<ChatHeader {...defaultProps} showAdvanced={true} />);
      
      fireEvent.click(screen.getByText('Update Temperature'));
      expect(defaultProps.onParameterChange).toHaveBeenCalledWith('temperature', 0.8);
    });
  });

  describe('Layout and styling', () => {
    it('has correct container classes', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const header = container.firstChild;
      
      expect(header).toHaveClass('flex-shrink-0');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-gray-200');
      expect(header).toHaveClass('bg-white');
      expect(header).toHaveClass('px-6');
      expect(header).toHaveClass('py-4');
    });

    it('uses flexbox layout for header content', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      const flexContainer = container.querySelector('.flex.items-center.justify-between');
      
      expect(flexContainer).toBeInTheDocument();
    });

    it('applies correct margin to parameter controls', () => {
      render(<ChatHeader {...defaultProps} showAdvanced={true} />);
      
      const paramContainer = screen.getByTestId('parameter-controls').parentElement;
      expect(paramContainer).toHaveClass('mt-3');
    });
  });

  describe('Icon rendering', () => {
    it('renders chat icon for new chat button', () => {
      render(<ChatHeader {...defaultProps} />);
      
      const button = screen.getByLabelText('Start new chat');
      const svg = button.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-5');
      expect(svg).toHaveClass('h-5');
    });

    it('renders code icon for debug button', () => {
      render(<ChatHeader {...defaultProps} onToggleDebug={jest.fn()} />);
      
      const button = screen.getByText('Debug').parentElement;
      const svg = button?.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4');
      expect(svg).toHaveClass('h-4');
    });

    it('renders chevron icon for advanced toggle', () => {
      render(<ChatHeader {...defaultProps} />);
      
      const button = screen.getByText('Advanced');
      const svg = button.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4');
      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('transition-transform');
    });
  });
});