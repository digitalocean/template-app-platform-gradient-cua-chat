/**
 * Test fixtures for AI SDK testing
 * Based on patterns from vercel/ai test suite
 */

import { CoreMessage } from 'ai';

// Standard test prompts
export const TEST_PROMPTS = {
  simple: 'Hello, how are you?',
  withTool: 'Take a screenshot of example.com',
  withConfirmation: 'Delete all files in the directory',
  multiStep: 'First, navigate to google.com, then take a screenshot, and finally analyze the content',
} as const;

// Standard test messages
export const TEST_MESSAGES = {
  userMessage: (content: string): CoreMessage => ({
    role: 'user',
    content,
  }),
  
  assistantMessage: (content: string): CoreMessage => ({
    role: 'assistant',
    content,
  }),
  
  systemMessage: (content: string): CoreMessage => ({
    role: 'system',
    content,
  }),
  
  toolCallMessage: (toolName: string, toolCallId: string, args: any): CoreMessage => ({
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolName,
        toolCallId,
        input: args,
      },
    ],
  }),
  
  toolResultMessage: (toolCallId: string, toolName: string, result: any): CoreMessage => ({
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId,
        toolName,
        output: result,
      },
    ],
  }),
};

// Tool call fixtures
export const TOOL_FIXTURES = {
  screenshot: {
    name: 'browser_screenshot',
    callId: 'screenshot-123',
    args: {
      url: 'https://example.com',
      filename: 'example-screenshot.png',
    },
    result: {
      success: true,
      screenshot: 'base64-image-data',
    },
  },
  
  askForConfirmation: {
    name: 'askForConfirmation',
    callId: 'confirm-456',
    args: {
      message: 'Are you sure you want to proceed?',
    },
    result: 'Yes, confirmed',
  },
  
  navigate: {
    name: 'browser_navigate',
    callId: 'nav-789',
    args: {
      url: 'https://google.com',
    },
    result: {
      success: true,
      title: 'Google',
    },
  },
};

// Stream response fixtures
export const STREAM_FIXTURES = {
  textChunks: ['Hello', ', ', 'this ', 'is ', 'a ', 'test ', 'response', '!'],
  
  toolCallChunks: (toolName: string, toolCallId: string, args: any) => [
    `9:{"toolCallId":"${toolCallId}","toolName":"${toolName}"}`,
    `a:"${toolCallId}":${JSON.stringify(args)}`,
    `b:"${toolCallId}"`,
  ],
  
  interactiveToolChunks: (toolName: string, toolCallId: string, message: string) => [
    `9:{"toolCallId":"${toolCallId}","toolName":"${toolName}"}`,
    `a:"${toolCallId}":{"message":"${message}"}`,
    `c:"${toolCallId}":"input-available"`,
  ],
  
  finishReason: 'd:{"finishReason":"stop"}',
};

// Model configuration fixtures
export const MODEL_CONFIGS = {
  default: {
    modelId: 'test-model',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    maxOutputTokens: 32000,
    maxSteps: 20,
  },
  
  creative: {
    modelId: 'test-model-creative',
    temperature: 0.9,
    topK: 50,
    topP: 0.98,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1,
    maxOutputTokens: 4096,
    maxSteps: 10,
  },
  
  deterministic: {
    modelId: 'test-model-deterministic',
    temperature: 0.1,
    topK: 10,
    topP: 0.9,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    maxOutputTokens: 2048,
    maxSteps: 5,
  },
};

// Error fixtures
export const ERROR_FIXTURES = {
  apiError: {
    message: 'API request failed',
    statusCode: 400,
    responseBody: '{"error": "Invalid request"}',
  },
  
  toolError: {
    toolCallId: 'error-tool-123',
    errorText: 'Tool execution failed: Network timeout',
  },
  
  streamError: {
    message: 'Stream interrupted',
    cause: new Error('Connection lost'),
  },
};

// S3/Base64 fixtures
export const S3_FIXTURES = {
  base64Image: {
    small: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    filename: 'test-image.png',
    s3Url: 'https://example-bucket.s3.amazonaws.com/uploads/test-image.png',
  },
  
  base64Document: {
    data: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2c+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzPj4KZW5kb2JqCnhyZWYKMCAxCjAwMDAwMDAwMDAgNjU1MzUgZiAKdHJhaWxlcgo8PAo+PgpzdGFydHhyZWYKMTYyCiUlRU9G',
    filename: 'test-document.pdf',
    s3Url: 'https://example-bucket.s3.amazonaws.com/uploads/test-document.pdf',
  },
};

// Complex scenario fixtures
export const SCENARIO_FIXTURES = {
  multiToolWorkflow: [
    {
      step: 'navigate',
      tool: TOOL_FIXTURES.navigate,
    },
    {
      step: 'screenshot',
      tool: TOOL_FIXTURES.screenshot,
    },
    {
      step: 'confirmation',
      tool: TOOL_FIXTURES.askForConfirmation,
    },
  ],
  
  errorRecovery: {
    initialError: ERROR_FIXTURES.toolError,
    retryAttempts: 3,
    finalSuccess: TOOL_FIXTURES.screenshot.result,
  },
};