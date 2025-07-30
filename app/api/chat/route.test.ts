/**
 * Tests for the chat API route using improved patterns from vercel/ai
 */

import { POST } from './route';
import {
  createTextStream,
  createToolCallStream,
  createInteractiveToolStream,
  createMultiPartStream,
  streamToResponse,
} from '@/lib/test-utils/stream-helpers';
import {
  TEST_PROMPTS,
  TEST_MESSAGES,
  TOOL_FIXTURES,
  MODEL_CONFIGS,
  ERROR_FIXTURES,
  S3_FIXTURES,
} from '@/lib/test-utils/fixtures';
import {
  createMockRequest,
} from '@/lib/test-utils/mock-helpers';

// Mock the AI SDK
jest.mock('ai', () => ({
  ...jest.requireActual('ai'),
  experimental_streamText: jest.fn(),
  streamText: jest.fn(),
  experimental_createMCPClient: jest.fn(),
  convertToModelMessages: jest.fn((messages) => messages),
  stepCountIs: jest.fn((count) => ({ type: 'step-count', count })),
}));

// Mock OpenAI compatible provider
jest.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: jest.fn(() => (modelId: string) => ({
    modelId,
    provider: 'openai-compatible',
  })),
}));

// Mock the MCP transport
jest.mock('@/lib/mcp-transport', () => ({
  PingAwareTransportWrapper: jest.fn((transport) => transport),
}));

// Mock the StreamableHTTPClientTransport
jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: jest.fn(() => ({
    send: jest.fn(),
    start: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock S3 utils
jest.mock('@/app/lib/s3-utils', () => ({
  processMessagesForBase64: jest.fn((messages) => messages),
  processToolCallForBase64: jest.fn((toolCall) => toolCall),
  processToolResultForBase64: jest.fn((result) => result),
}));

describe('Chat API Route', () => {
  let mockMCPClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock MCP client
    mockMCPClient = {
      tools: jest.fn().mockResolvedValue({}),
      close: jest.fn(),
    };

    const { experimental_createMCPClient } = require('ai');
    experimental_createMCPClient.mockResolvedValue(mockMCPClient);
  });

  describe('POST /api/chat', () => {
    describe('Text Streaming', () => {
      it('should handle simple text responses', async () => {
        const mockStream = createTextStream('Hello, this is a test response!');

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: mockStream,
          toUIMessageStreamResponse: () => streamToResponse(mockStream),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage(TEST_PROMPTS.simple)],
          },
        });

        const response = await POST(request);

        expect(response).toBeInstanceOf(Response);
        expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
        expect(response.headers.get('X-Vercel-AI-Data-Stream')).toBe('v1');

        // Verify streamText was called with correct params
        const streamTextCall = streamText.mock.calls[0][0];
        expect(streamTextCall.temperature).toBe(MODEL_CONFIGS.default.temperature);
        expect(streamTextCall.maxOutputTokens).toBe(MODEL_CONFIGS.default.maxOutputTokens);
      });

      it('should handle chunked text streaming', async () => {
        const fullText = 'Hello, world!';
        const mockStream = createTextStream(fullText, 5);

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: mockStream,
          toUIMessageStreamResponse: () => streamToResponse(mockStream),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Hello')],
          },
        });

        const response = await POST(request);
        const responseText = await response.text();

        // The stream format adds prefixes, so look for the content parts
        expect(responseText).toContain('Hello');
        expect(responseText).toContain('ld!'); // This is how "world!" gets chunked
        expect(responseText).toContain('finishReason');
      });
    });

    describe('Tool Calling', () => {
      it('should handle browser screenshot tool calls', async () => {
        const { screenshot } = TOOL_FIXTURES;
        const mockStream = createToolCallStream(
          screenshot.name,
          screenshot.callId,
          screenshot.args
        );

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: mockStream,
          toUIMessageStreamResponse: () => streamToResponse(mockStream),
        });

        // Mock MCP tools
        mockMCPClient.tools.mockResolvedValueOnce({
          [screenshot.name]: {
            description: 'Take a browser screenshot',
            inputSchema: { type: 'object' },
            execute: jest.fn().mockResolvedValue(screenshot.result),
          },
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage(TEST_PROMPTS.withTool)],
          },
        });

        const response = await POST(request);
        const responseText = await response.text();

        expect(responseText).toContain(screenshot.callId);
        expect(responseText).toContain(screenshot.name);
      });

      it('should handle interactive confirmation tools', async () => {
        const { askForConfirmation } = TOOL_FIXTURES;
        const mockStream = createInteractiveToolStream(
          askForConfirmation.name,
          askForConfirmation.callId,
          askForConfirmation.args.message
        );

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: mockStream,
          toUIMessageStreamResponse: () => streamToResponse(mockStream),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage(TEST_PROMPTS.withConfirmation)],
          },
        });

        const response = await POST(request);
        const responseText = await response.text();

        expect(responseText).toContain('input-available');
        expect(responseText).toContain(askForConfirmation.args.message);
      });

      it('should wrap MCP tools to process base64 data', async () => {
        const { processToolCallForBase64, processToolResultForBase64 } = require('@/app/lib/s3-utils');

        // Reset mocks
        processToolCallForBase64.mockReset();
        processToolResultForBase64.mockReset();

        // Mock processing functions
        processToolCallForBase64.mockImplementation((toolCall) => Promise.resolve(toolCall));
        processToolResultForBase64.mockImplementation((result) => Promise.resolve({
          ...result,
          processed: true,
        }));

        // Mock MCP tool
        const mockExecute = jest.fn().mockResolvedValue({
          content: [{ type: 'image', data: 'base64data' }],
        });

        mockMCPClient.tools.mockResolvedValueOnce({
          test_tool: {
            description: 'Test tool',
            inputSchema: { type: 'object' },
            execute: mockExecute,
          },
        });

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('Done'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('Done')),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Test')],
          },
        });

        await POST(request);

        // Get the wrapped tool from streamText call
        const streamTextCall = streamText.mock.calls[0][0];
        const wrappedTool = streamTextCall.tools.test_tool;

        // Execute the wrapped tool
        const testArgs = { test: 'args' };
        const result = await wrappedTool.execute(testArgs);

        // Verify wrapping happened
        expect(processToolCallForBase64).toHaveBeenCalledWith({
          toolName: 'test_tool',
          args: testArgs,
        });

        expect(mockExecute).toHaveBeenCalledWith(testArgs);

        expect(processToolResultForBase64).toHaveBeenCalledWith({
          content: [{ type: 'image', data: 'base64data' }],
        });

        expect(result).toEqual({
          content: [{ type: 'image', data: 'base64data' }],
          processed: true,
        });
      });

      it('should handle real-world screenshot tool with base64 processing', async () => {
        const { processToolCallForBase64, processToolResultForBase64 } = require('@/app/lib/s3-utils');

        // Mock the S3 processing to convert base64 to URL
        processToolCallForBase64.mockImplementation((toolCall) => Promise.resolve(toolCall));
        processToolResultForBase64.mockImplementation((result) => {
          if (result?.content?.[0]?.data === S3_FIXTURES.base64Image.small) {
            return Promise.resolve({
              content: [{
                type: 'image',
                url: S3_FIXTURES.base64Image.s3Url,
                mimeType: 'image/png',
              }],
            });
          }
          return Promise.resolve(result);
        });

        // Mock browser_take_screenshot tool
        const mockScreenshotTool = {
          description: 'Take a browser screenshot',
          inputSchema: { type: 'object' },
          execute: jest.fn().mockResolvedValue({
            content: [{
              type: 'image',
              data: S3_FIXTURES.base64Image.small,
              mimeType: 'image/png',
            }],
          }),
        };

        mockMCPClient.tools.mockResolvedValueOnce({
          browser_take_screenshot: mockScreenshotTool,
        });

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('Screenshot taken'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('Screenshot taken')),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Take a screenshot')],
          },
        });

        await POST(request);

        // Get wrapped tool and test it
        const streamTextCall = streamText.mock.calls[0][0];
        const wrappedTool = streamTextCall.tools.browser_take_screenshot;

        // Call the wrapped tool
        const result = await wrappedTool.execute({ filename: 'screenshot.png' });

        // Verify the result has S3 URL instead of base64
        expect(result).toEqual({
          content: [{
            type: 'image',
            url: S3_FIXTURES.base64Image.s3Url,
            mimeType: 'image/png',
          }],
        });

        // Verify processing functions were called
        expect(processToolCallForBase64).toHaveBeenCalled();
        expect(processToolResultForBase64).toHaveBeenCalled();
        expect(mockScreenshotTool.execute).toHaveBeenCalled();
      });
    });

    describe('Multi-Part Responses', () => {
      it('should handle mixed text and tool responses', async () => {
        const mockStream = createMultiPartStream([
          { type: 'text', content: 'I will take a screenshot for you.' },
          {
            type: 'tool',
            content: TOOL_FIXTURES.screenshot,
          },
          { type: 'text', content: 'Screenshot captured successfully!' },
        ]);

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: mockStream,
          toUIMessageStreamResponse: () => streamToResponse(mockStream),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage(TEST_PROMPTS.multiStep)],
          },
        });

        const response = await POST(request);
        const responseText = await response.text();

        expect(responseText).toContain('I will take a screenshot for you.');
        // Check for tool name in the stream
        expect(responseText).toContain('screenshot');
        expect(responseText).toContain('Screenshot captured successfully!');
      });
    });

    describe('Error Handling', () => {
      it('should handle MCP client initialization errors without race conditions', async () => {
        // This test ensures that onUncaughtError doesn't cause "Cannot access before initialization" errors
        const { experimental_createMCPClient } = require('ai');
        const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
        
        // Create a mock that simulates the actual implementation behavior
        experimental_createMCPClient.mockImplementationOnce(async ({ transport, onUncaughtError }) => {
          // Simulate an error occurring during initialization
          setTimeout(() => {
            if (onUncaughtError) {
              // This should not throw "Cannot access 'client' before initialization"
              onUncaughtError(new Error('Transport error during initialization'));
            }
          }, 0);
          
          // Return a mock client
          return {
            tools: jest.fn().mockResolvedValue({}),
            close: jest.fn(),
          };
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Test')],
          },
        });

        // This should not throw an error
        const response = await POST(request);
        
        // Wait for any pending timers
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should handle the request normally despite the transport error
        expect(response).toBeDefined();
      });

      it('should handle transport errors after client initialization', async () => {
        const { experimental_createMCPClient } = require('ai');
        const mockClient = {
          tools: jest.fn().mockResolvedValue({}),
          close: jest.fn(),
        };
        
        let capturedOnUncaughtError: ((error: Error) => Promise<void>) | undefined;
        
        experimental_createMCPClient.mockImplementationOnce(async ({ onUncaughtError }) => {
          capturedOnUncaughtError = onUncaughtError;
          return mockClient;
        });

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('Response'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('Response')),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Test')],
          },
        });

        await POST(request);
        
        // Now simulate a transport error after initialization
        if (capturedOnUncaughtError) {
          await capturedOnUncaughtError(new Error('Transport error after init'));
        }
        
        // Verify close was called
        expect(mockClient.close).toHaveBeenCalled();
      });

      it('should handle model errors with proper error messages', async () => {
        const { streamText } = require('ai');
        streamText.mockImplementationOnce(() => {
          throw new Error(ERROR_FIXTURES.apiError.message);
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Hello')],
          },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toBe(ERROR_FIXTURES.apiError.message);
      });

      it('should handle API errors with response bodies', async () => {
        const { streamText } = require('ai');
        streamText.mockImplementationOnce(() => {
          const error: any = new Error('API Error');
          error.statusCode = ERROR_FIXTURES.apiError.statusCode;
          error.responseBody = ERROR_FIXTURES.apiError.responseBody;
          throw error;
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [TEST_MESSAGES.userMessage('Hello')],
          },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const errorData = await response.json();
        // The error falls back to default message when parsing fails
        expect(errorData.error).toBe('An error occurred');
      });

      it('should validate required headers', async () => {
        const request = createMockRequest({
          headers: {
            // Missing x-model header
          },
          body: {
            messages: [TEST_MESSAGES.userMessage('Hello')],
          },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Model ID is required');
      });
    });

    describe('Model Configuration', () => {
      it('should use default model configuration', async () => {
        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('Response'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('Response')),
        });

        const request = createMockRequest({
          headers: { 'x-model': MODEL_CONFIGS.default.modelId },
          body: {
            messages: [TEST_MESSAGES.userMessage('Test')],
          },
        });

        await POST(request);

        expect(streamText).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 32000,
          })
        );
      });

      it('should override model configuration from headers', async () => {
        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('Response'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('Response')),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.creative,
          body: {
            messages: [TEST_MESSAGES.userMessage('Test')],
          },
        });

        await POST(request);

        expect(streamText).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature: MODEL_CONFIGS.creative.temperature,
            topK: MODEL_CONFIGS.creative.topK,
            topP: MODEL_CONFIGS.creative.topP,
            maxOutputTokens: MODEL_CONFIGS.creative.maxOutputTokens,
          })
        );
      });
    });

    describe('Message Processing', () => {
      it('should process messages for base64 content', async () => {
        const { processMessagesForBase64 } = require('@/app/lib/s3-utils');
        const processedMessages = [
          {
            ...TEST_MESSAGES.userMessage('Here is an image'),
            content: [
              { type: 'text', text: 'Here is an image' },
              { type: 'image', image: S3_FIXTURES.base64Image.s3Url },
            ],
          },
        ];
        processMessagesForBase64.mockResolvedValueOnce(processedMessages);

        const { streamText } = require('ai');
        streamText.mockReturnValueOnce({
          textStream: createTextStream('I see the image'),
          toUIMessageStreamResponse: () => streamToResponse(createTextStream('I see the image')),
        });

        const request = createMockRequest({
          headers: MODEL_CONFIGS.default,
          body: {
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Here is an image' },
                  { type: 'image', image: S3_FIXTURES.base64Image.small },
                ],
              },
            ],
          },
        });

        await POST(request);

        expect(processMessagesForBase64).toHaveBeenCalled();
        expect(streamText).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.any(Array),
          })
        );
      });
    });
  });
});
