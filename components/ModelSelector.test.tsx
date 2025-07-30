/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModelSelector from './ModelSelector';

// Mock fetch
global.fetch = jest.fn();

describe('ModelSelector', () => {
  const mockModels = {
    models: [
      { id: 'model-1', name: 'Model One', maxTokens: 1000 },
      { id: 'model-2', name: 'Model Two', maxTokens: 2000 },
      { id: 'model-3', name: 'Model Three' },
    ],
  };

  const defaultProps = {
    selectedModel: 'model-1',
    onModelChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockModels),
    });
  });

  describe('Initial loading', () => {
    it('should show loading state initially', () => {
      render(<ModelSelector {...defaultProps} />);
      
      expect(screen.getByText('Loading models...')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should fetch models on mount', () => {
      render(<ModelSelector {...defaultProps} />);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/gradient-models');
    });
  });

  describe('Model display', () => {
    it('should display models after loading', async () => {
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Model One')).toBeInTheDocument();
        expect(screen.getByText('Model Two')).toBeInTheDocument();
        expect(screen.getByText('Model Three')).toBeInTheDocument();
      });
    });

    it('should select the correct model initially', async () => {
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('model-1');
      });
    });

    it('should enable select after loading', async () => {
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });
    });
  });

  describe('Model selection', () => {
    it('should call onModelChange when selecting a model with maxTokens', async () => {
      const onModelChange = jest.fn();
      render(<ModelSelector {...defaultProps} onModelChange={onModelChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Model Two')).toBeInTheDocument();
      });
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'model-2' } });
      
      expect(onModelChange).toHaveBeenCalledWith('model-2', 2000);
    });

    it('should call onModelChange when selecting a model without maxTokens', async () => {
      const onModelChange = jest.fn();
      render(<ModelSelector {...defaultProps} onModelChange={onModelChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Model Three')).toBeInTheDocument();
      });
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'model-3' } });
      
      expect(onModelChange).toHaveBeenCalledWith('model-3', undefined);
    });
  });

  describe('Initial model configuration', () => {
    it('should set maxTokens for initially selected model', async () => {
      const onModelChange = jest.fn();
      render(<ModelSelector selectedModel="model-1" onModelChange={onModelChange} />);
      
      await waitFor(() => {
        expect(onModelChange).toHaveBeenCalledWith('model-1', 1000);
      });
    });

    it('should not set maxTokens if initial model has none', async () => {
      const onModelChange = jest.fn();
      render(<ModelSelector selectedModel="model-3" onModelChange={onModelChange} />);
      
      await waitFor(() => {
        expect(screen.getByText('Model Three')).toBeInTheDocument();
      });
      
      // Should not be called since model-3 has no maxTokens
      expect(onModelChange).not.toHaveBeenCalled();
    });

    it('should only set initial maxTokens once', async () => {
      const onModelChange = jest.fn();
      const { rerender } = render(<ModelSelector selectedModel="model-1" onModelChange={onModelChange} />);
      
      await waitFor(() => {
        expect(onModelChange).toHaveBeenCalledWith('model-1', 1000);
      });
      
      // Clear mock and rerender
      onModelChange.mockClear();
      rerender(<ModelSelector selectedModel="model-1" onModelChange={onModelChange} />);
      
      // Should not be called again
      expect(onModelChange).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load models:', expect.any(Error));
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });
      
      consoleError.mockRestore();
    });

    it('should handle empty model list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ models: [] }),
      });
      
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).not.toBeDisabled();
        expect(select.children.length).toBe(0);
      });
    });

    it('should handle malformed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });
      
      render(<ModelSelector {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).not.toBeDisabled();
        expect(select.children.length).toBe(0);
      });
    });
  });
});