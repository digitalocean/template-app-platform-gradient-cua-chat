/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  renderTextPart,
  renderFilePart,
  renderToolError,
  renderBrowserSnapshot,
  renderToolOutput,
  renderUnknownPart,
  renderAskForConfirmationTool,
  renderDynamicTool,
  renderStepPart,
  renderStepStartPart,
  renderFinishStepPart,
  renderMessagePart,
} from './tool-handlers';

// Mock the media renderer components
jest.mock('@/components/media-renderers', () => ({
  MediaRenderer: ({ content, className }: any) => (
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

describe('Tool Handlers', () => {
  const mockAddToolResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderTextPart', () => {
    it('should render text content', () => {
      const result = renderTextPart('msg-1', 0, 'Hello, world!');
      const { container } = render(<>{result}</>);
      
      expect(screen.getByTestId('text-renderer')).toHaveTextContent('Hello, world!');
      expect(container.firstChild).toHaveClass('my-2');
    });
  });

  describe('renderFilePart', () => {
    it('should render file with correct props', () => {
      const part = {
        url: 'https://example.com/file.pdf',
        mediaType: 'application/pdf',
        filename: 'document.pdf',
      };
      
      const result = renderFilePart('msg-1', 0, part);
      render(<>{result}</>);
      
      const mediaRenderer = screen.getByTestId('media-renderer');
      expect(mediaRenderer).toBeInTheDocument();
      expect(mediaRenderer.textContent).toContain('"type":"file"');
      expect(mediaRenderer.textContent).toContain('"url":"https://example.com/file.pdf"');
      expect(mediaRenderer.textContent).toContain('"filename":"document.pdf"');
    });
  });

  describe('renderToolError', () => {
    it('should render error display with tool name', () => {
      const result = renderToolError('msg-1', 0, 'browser_screenshot');
      render(<>{result}</>);
      
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'Error in browser_screenshot: Tool execution failed'
      );
    });
  });

  describe('renderBrowserSnapshot', () => {
    it('should render snapshot content in collapsible', () => {
      const output = {
        content: [
          { type: 'text', text: 'Page Snapshot: <html>...</html>' },
          { type: 'text', text: 'Other content' },
        ],
      };
      
      const result = renderBrowserSnapshot('msg-1', 0, output);
      render(<>{result}</>);
      
      const collapsible = screen.getByTestId('collapsible-content');
      expect(collapsible).toHaveTextContent('Browser Snapshot');
      expect(collapsible).toHaveAttribute('data-open', 'false');
    });

    it('should return null if no snapshot content', () => {
      const output = {
        content: [{ type: 'text', text: 'Other content' }],
      };
      
      const result = renderBrowserSnapshot('msg-1', 0, output);
      expect(result).toBeNull();
    });
  });

  describe('renderToolOutput', () => {
    it('should render multiple content items', () => {
      const output = {
        content: [
          { type: 'text', text: 'Result 1' },
          { type: 'image', url: 'image.png' },
        ],
      };
      
      const result = renderToolOutput('msg-1', 0, output);
      render(<>{result}</>);
      
      const renderers = screen.getAllByTestId('media-renderer');
      expect(renderers).toHaveLength(2);
    });

    it('should return null if no content', () => {
      const result = renderToolOutput('msg-1', 0, {});
      expect(result).toBeNull();
    });
  });

  describe('renderUnknownPart', () => {
    it('should render unknown part type with JSON', () => {
      const part = { type: 'custom', data: 'test' };
      
      const result = renderUnknownPart('msg-1', 0, part);
      render(<>{result}</>);
      
      expect(screen.getByText('Unknown Part Type: custom')).toBeInTheDocument();
      // The text content is rendered without formatting/newlines in the mock
      const expectedText = `\`\`\`json\n${JSON.stringify(part, null, 2)}\n\`\`\``.replace(/\s+/g, ' ');
      const actualText = screen.getByTestId('text-renderer').textContent?.replace(/\s+/g, ' ');
      expect(actualText).toBe(expectedText);
    });
  });

  describe('renderAskForConfirmationTool', () => {
    it('should render loading state', () => {
      const part = {
        state: 'input-streaming',
        toolCallId: 'tool-1',
      };
      
      const result = renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Loading confirmation request...')).toBeInTheDocument();
    });

    it('should render input state with Yes/No buttons', () => {
      const part = {
        state: 'input-available',
        toolCallId: 'tool-1',
        input: { message: 'Are you sure?' },
      };
      
      const result = renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      
      const yesButton = screen.getByText('Yes');
      const noButton = screen.getByText('No');
      
      fireEvent.click(yesButton);
      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'askForConfirmation',
        toolCallId: 'tool-1',
        output: 'Yes, confirmed.',
      });
      
      fireEvent.click(noButton);
      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'askForConfirmation',
        toolCallId: 'tool-1',
        output: 'No, denied',
      });
    });

    it('should render output state', () => {
      const part = {
        state: 'output-available',
        toolCallId: 'tool-1',
        output: 'Yes, confirmed.',
      };
      
      const result = renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Confirmation response: Yes, confirmed.')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const part = {
        state: 'output-error',
        toolCallId: 'tool-1',
        errorText: 'Something went wrong',
      };
      
      const result = renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'Confirmation Error: Something went wrong'
      );
    });
  });

  describe('renderDynamicTool', () => {
    it('should render loading state', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'input-streaming',
        toolCallId: 'tool-1',
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Loading custom_tool...')).toBeInTheDocument();
    });

    it('should render confirmation input type', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'input-available',
        toolCallId: 'tool-1',
        input: {
          type: 'confirmation',
          message: 'Proceed?',
          confirmLabel: 'Continue',
          denyLabel: 'Cancel',
        },
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Proceed?')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render choice input type', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'input-available',
        toolCallId: 'tool-1',
        input: {
          type: 'choice',
          message: 'Select an option:',
          options: ['Option A', 'Option B', { label: 'Option C', value: 'c' }],
        },
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByText('Select an option:')).toBeInTheDocument();
      
      const optionA = screen.getByText('Option A');
      fireEvent.click(optionA);
      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'custom_tool',
        toolCallId: 'tool-1',
        output: 'Option A',
      });
    });

    it('should render text input type', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'input-available',
        toolCallId: 'tool-1',
        input: {
          type: 'text-input',
          placeholder: 'Enter your name',
        },
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      const { container } = render(<>{result}</>);
      
      const input = container.querySelector('input[name="input"]');
      const submitButton = screen.getByText('Submit');
      
      expect(input).toHaveAttribute('placeholder', 'Enter your name');
      
      fireEvent.change(input!, { target: { value: 'John Doe' } });
      fireEvent.click(submitButton);
      
      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'custom_tool',
        toolCallId: 'tool-1',
        output: 'John Doe',
      });
    });

    it('should render generic input with Continue button', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'input-available',
        toolCallId: 'tool-1',
        input: { someData: 'value' },
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);
      
      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'custom_tool',
        toolCallId: 'tool-1',
        output: 'Acknowledged',
      });
    });

    it('should render browser_snapshot output specially', () => {
      const part = {
        toolName: 'browser_snapshot',
        state: 'output-available',
        toolCallId: 'tool-1',
        output: {
          content: [{ type: 'text', text: 'Page Snapshot: <html>...</html>' }],
        },
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByTestId('collapsible-content')).toHaveTextContent('Browser Snapshot');
    });

    it('should render error state', () => {
      const part = {
        toolName: 'custom_tool',
        state: 'output-error',
        toolCallId: 'tool-1',
        errorText: 'Failed to execute',
      };
      
      const result = renderDynamicTool('msg-1', 0, part, mockAddToolResult);
      render(<>{result}</>);
      
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'Error in custom_tool: Failed to execute'
      );
    });
  });

  describe('renderStepPart', () => {
    it('should render step with all details', () => {
      const part = {
        stepNumber: 3,
        name: 'Process data',
        description: 'Processing the uploaded data',
        status: 'in-progress',
      };
      
      const result = renderStepPart('msg-1', 0, part);
      render(<>{result}</>);
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Process data')).toBeInTheDocument();
      expect(screen.getByText('Processing the uploaded data')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
    });

    it('should use index if stepNumber not provided', () => {
      const part = {
        name: 'First step',
      };
      
      const result = renderStepPart('msg-1', 5, part);
      render(<>{result}</>);
      
      expect(screen.getByText('6')).toBeInTheDocument(); // index + 1
    });
  });

  describe('renderStepStartPart', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should render step-start in development mode', () => {
      const part = {
        type: 'step-start' as const,
        request: {
          modelId: 'gpt-4',
          messages: [],
        },
        warnings: [],
      };
      
      const result = renderStepStartPart('msg-1', 0, part);
      render(<>{result}</>);
      
      expect(screen.getByText('Step started')).toBeInTheDocument();
    });

    it('should return null in production mode', () => {
      process.env.NODE_ENV = 'production';
      const part = {
        type: 'step-start' as const,
      };
      
      const result = renderStepStartPart('msg-1', 0, part);
      expect(result).toBeNull();
    });
  });

  describe('renderFinishStepPart', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should render finish-step with usage in development mode', () => {
      const part = {
        type: 'finish-step' as const,
        usage: {
          promptTokens: 150,
          completionTokens: 250,
          totalTokens: 400,
        },
        finishReason: 'stop',
      };
      
      const result = renderFinishStepPart('msg-1', 0, part);
      render(<>{result}</>);
      
      expect(screen.getByText('Tokens: 150 prompt, 250 completion')).toBeInTheDocument();
    });

    it('should handle missing token values', () => {
      const part = {
        type: 'finish-step' as const,
        usage: {
          promptTokens: undefined,
          completionTokens: undefined,
        },
      };
      
      const result = renderFinishStepPart('msg-1', 0, part);
      render(<>{result}</>);
      
      expect(screen.getByText('Tokens: 0 prompt, 0 completion')).toBeInTheDocument();
    });

    it('should return null without usage data', () => {
      const part = {
        type: 'finish-step' as const,
      };
      
      const result = renderFinishStepPart('msg-1', 0, part);
      expect(result).toBeNull();
    });

    it('should return null in production mode', () => {
      process.env.NODE_ENV = 'production';
      const part = {
        type: 'finish-step' as const,
        usage: {
          promptTokens: 150,
          completionTokens: 250,
        },
      };
      
      const result = renderFinishStepPart('msg-1', 0, part);
      expect(result).toBeNull();
    });
  });

  describe('renderMessagePart', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should route to correct renderer based on type', () => {
      const textPart = { type: 'text', text: 'Hello' };
      const filePart = { type: 'file', url: 'file.pdf', mediaType: 'application/pdf' };
      const stepPart = { type: 'step', name: 'Step 1' };
      const stepStartPart = { type: 'step-start' };
      const finishStepPart = { type: 'finish-step', usage: { promptTokens: 10, completionTokens: 20 } };
      const unknownPart = { type: 'unknown-type' };
      
      render(
        <>
          {renderMessagePart('msg-1', 0, textPart)}
          {renderMessagePart('msg-1', 1, filePart)}
          {renderMessagePart('msg-1', 2, stepPart)}
          {renderMessagePart('msg-1', 3, stepStartPart)}
          {renderMessagePart('msg-1', 4, finishStepPart)}
          {renderMessagePart('msg-1', 5, unknownPart)}
        </>
      );
      
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step started')).toBeInTheDocument();
      expect(screen.getByText('Tokens: 10 prompt, 20 completion')).toBeInTheDocument();
      expect(screen.getByText('Unknown Part Type: unknown-type')).toBeInTheDocument();
    });
  });
});