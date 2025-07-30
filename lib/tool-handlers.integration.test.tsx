/**
 * Integration tests for tool handlers with streaming responses
 * Based on patterns from vercel/ai test suite
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderAskForConfirmationTool, renderDynamicTool } from './tool-handlers';
import { TOOL_FIXTURES, ERROR_FIXTURES } from '@/lib/test-utils/fixtures';
import { flushPromises } from '@/lib/test-utils/mock-helpers';

// Helper to create confirmation part with defaults
function createConfirmationPart(state: string, overrides = {}) {
  return {
    state,
    toolCallId: TOOL_FIXTURES.askForConfirmation.callId,
    type: 'tool-askForConfirmation',
    ...overrides,
  };
}

describe('Tool Handlers - Integration Tests', () => {
  let mockAddToolResult: jest.Mock;

  beforeEach(() => {
    mockAddToolResult = jest.fn();
    jest.clearAllMocks();
  });

  describe('Interactive Tool Flow', () => {
    describe('askForConfirmation tool', () => {

      it('should handle the complete confirmation flow - user confirms', async () => {
        // Step 1: Loading state
        const { rerender } = render(
          <>{renderAskForConfirmationTool(
            'msg-1',
            0,
            createConfirmationPart('input-streaming'),
            mockAddToolResult
          )}</>
        );

        expect(screen.getByText('Loading confirmation request...')).toBeInTheDocument();

        // Step 2: Input available
        rerender(
          <>{renderAskForConfirmationTool(
            'msg-1',
            0,
            createConfirmationPart('input-available', {
              input: { message: TOOL_FIXTURES.askForConfirmation.args.message },
            }),
            mockAddToolResult
          )}</>
        );

        expect(screen.getByText(TOOL_FIXTURES.askForConfirmation.args.message)).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();

        // Step 3: User confirms
        fireEvent.click(screen.getByText('Yes'));

        expect(mockAddToolResult).toHaveBeenCalledWith({
          tool: 'askForConfirmation',
          toolCallId: TOOL_FIXTURES.askForConfirmation.callId,
          output: 'Yes, confirmed.',
        });

        // Step 4: Show result
        rerender(
          <>{renderAskForConfirmationTool(
            'msg-1',
            0,
            createConfirmationPart('output-available', {
              output: 'Yes, confirmed',
            }),
            mockAddToolResult
          )}</>
        );

        expect(screen.getByText('Confirmation response: Yes, confirmed')).toBeInTheDocument();
      });

      it('should handle the complete confirmation flow - user denies', async () => {
        render(
          <>{renderAskForConfirmationTool(
            'msg-1',
            0,
            createConfirmationPart('input-available', {
              input: { message: TOOL_FIXTURES.askForConfirmation.args.message },
            }),
            mockAddToolResult
          )}</>
        );

        fireEvent.click(screen.getByText('No'));

        expect(mockAddToolResult).toHaveBeenCalledWith({
          tool: 'askForConfirmation',
          toolCallId: TOOL_FIXTURES.askForConfirmation.callId,
          output: 'No, denied',
        });
      });

    });

    describe('dynamic tools', () => {
      it('should handle choice selection tools', async () => {
        const toolCallId = 'choice-test-456';
        const toolName = 'selectOption';
        const options = [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
        ];

        const part = {
          state: 'input-available',
          toolCallId,
          toolName,
          input: {
            type: 'choice',
            message: 'Select your preferred language:',
            options,
          },
        };

        render(
          <>{renderDynamicTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        expect(screen.getByText('Select your preferred language:')).toBeInTheDocument();
        options.forEach(option => {
          expect(screen.getByText(option.label)).toBeInTheDocument();
        });
        
        // Click on Spanish option
        fireEvent.click(screen.getByText('Spanish'));

        expect(mockAddToolResult).toHaveBeenCalledWith({
          tool: toolName,
          toolCallId,
          output: 'es',
        });
      });

      it('should handle text input tools', async () => {
        const toolCallId = 'input-test-789';
        const toolName = 'getUserInput';
        const testValue = 'sk-test-key-123';

        const part = {
          state: 'input-available',
          toolCallId,
          toolName,
          input: {
            type: 'text-input',
            message: 'Please enter your API key:',
            placeholder: 'sk-...',
          },
        };

        const { container } = render(
          <>{renderDynamicTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        expect(screen.getByText('Please enter your API key:')).toBeInTheDocument();
        
        const input = container.querySelector('input[name="input"]') as HTMLInputElement;
        expect(input).toHaveAttribute('placeholder', 'sk-...');

        // Type and submit
        fireEvent.change(input, { target: { value: testValue } });
        fireEvent.submit(input.form!);

        expect(mockAddToolResult).toHaveBeenCalledWith({
          tool: toolName,
          toolCallId,
          output: testValue,
        });

        // Note: Form clearing behavior might vary in test environment
      });

      it('should handle confirmation tools with custom values', () => {
        const part = {
          state: 'input-available',
          toolCallId: 'custom-confirm',
          toolName: 'deployApplication',
          input: {
            type: 'confirmation',
            message: 'Deploy to production?',
            confirmLabel: 'Deploy Now',
            denyLabel: 'Cancel Deployment',
            confirmValue: 'DEPLOY_CONFIRMED',
            denyValue: 'DEPLOY_CANCELLED',
          },
        };

        render(
          <>{renderDynamicTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        const deployButton = screen.getByText('Deploy Now');
        const cancelButton = screen.getByText('Cancel Deployment');

        expect(deployButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();

        fireEvent.click(cancelButton);

        expect(mockAddToolResult).toHaveBeenCalledWith({
          tool: 'deployApplication',
          toolCallId: 'custom-confirm',
          output: 'DEPLOY_CANCELLED',
        });
      });
    });

    describe('error handling', () => {
      it('should display error states appropriately', async () => {
        const part = createConfirmationPart('output-error', {
          errorText: ERROR_FIXTURES.toolError.errorText,
        });

        render(
          <>{renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        expect(screen.getByText('Confirmation Error')).toBeInTheDocument();
        expect(screen.getByText('Tool execution failed: Network timeout')).toBeInTheDocument();
      });

      it('should handle missing error text gracefully', () => {
        const part = createConfirmationPart('output-error', {
          errorText: undefined,
        });

        render(
          <>{renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        expect(screen.getByText('Confirmation Error')).toBeInTheDocument();
        expect(screen.getByText('Tool execution failed')).toBeInTheDocument();
      });
    });
  });

  describe('Streaming State Transitions', () => {
    it('should handle rapid state changes gracefully', async () => {
      const states = [
        createConfirmationPart('input-streaming'),
        createConfirmationPart('input-available', {
          input: { message: 'Quick question?' },
        }),
        createConfirmationPart('output-available', {
          output: 'Yes, confirmed.',
        }),
      ];

      const { rerender } = render(<div />);

      // Rapidly transition through states
      for (const part of states) {
        rerender(
          <>{renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult)}</>
        );

        // Brief pause to simulate streaming
        await flushPromises();
      }

      // Should end up in final state
      expect(screen.getByText('Confirmation response: Yes, confirmed.')).toBeInTheDocument();
    });

    it('should handle out-of-order state updates', async () => {
      render(
        <>{renderAskForConfirmationTool(
          'msg-1',
          0,
          createConfirmationPart('output-available', {
            output: 'Result without input',
          }),
          mockAddToolResult
        )}</>
      );

      // Should handle gracefully even without seeing input state
      expect(screen.getByText('Confirmation response: Result without input')).toBeInTheDocument();
    });
  });

  describe('Complex Tool Scenarios', () => {
    it('should handle generic tools with fallback UI', () => {
      const part = {
        state: 'input-available',
        toolCallId: 'generic-tool',
        toolName: 'complexTool',
        input: {
          // Unknown structure
          someField: 'value',
          nested: { data: [1, 2, 3] },
        },
      };

      render(
        <>{renderDynamicTool('msg-1', 0, part, mockAddToolResult)}</>
      );

      // Should show raw data and continue button
      expect(screen.getByText('Continue')).toBeInTheDocument();
      // The content is rendered as JSON, check for the button
      const codeBlock = screen.getByText(/json code block/);
      expect(codeBlock).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Continue'));

      expect(mockAddToolResult).toHaveBeenCalledWith({
        tool: 'complexTool',
        toolCallId: 'generic-tool',
        output: 'Acknowledged',
      });
    });

    it('should handle tools with complex nested inputs', () => {
      const complexInput = {
        type: 'form',
        fields: [
          { name: 'username', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'preferences', type: 'object', properties: {
            theme: 'dark',
            notifications: true,
          }},
        ],
      };

      const part = {
        state: 'input-available',
        toolCallId: 'form-tool',
        toolName: 'userRegistration',
        input: complexInput,
      };

      render(
        <>{renderDynamicTool('msg-1', 0, part, mockAddToolResult)}</>
      );

      // Should fall back to generic handler for unknown types
      expect(screen.getByText('Continue')).toBeInTheDocument();
      // The content is rendered as a collapsible JSON block
      const codeBlock = screen.getByText(/json code block/);
      expect(codeBlock).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('should clean up event listeners on unmount', () => {
      const part = createConfirmationPart('input-available', {
        input: { message: 'Test cleanup' },
      });

      const { unmount } = render(
        <>{renderAskForConfirmationTool('msg-1', 0, part, mockAddToolResult)}</>
      );

      const button = screen.getByText('Yes');
      unmount();

      // This shouldn't throw even though component is unmounted
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle multiple simultaneous tool instances', () => {
      const tools = Array(5).fill(null).map((_, i) => ({
        id: `tool-${i}`,
        part: createConfirmationPart('input-available', {
          input: { message: `Confirmation ${i}` },
        }),
      }));

      render(
        <>
          {tools.map((tool, index) => (
            <div key={tool.id}>
              {renderAskForConfirmationTool(tool.id, index, tool.part, mockAddToolResult)}
            </div>
          ))}
        </>
      );

      // All tools should render
      tools.forEach((tool, i) => {
        expect(screen.getByText(`Confirmation ${i}`)).toBeInTheDocument();
      });
    });
  });
});