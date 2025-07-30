/**
 * Mock helper functions for AI SDK testing
 * Based on patterns from vercel/ai test suite
 */

import { JSONRPCMessage, JSONRPCResponse } from 'ai';

/**
 * Prepares a JSON response for mocking
 */
export function prepareJsonResponse(options: {
  content?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
  model?: string;
}) {
  const {
    content = 'Test response',
    toolCalls = [],
    usage = { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    finish_reason = 'stop',
    model = 'test-model',
  } = options;

  return {
    id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
    object: 'chat.completion',
    created: Date.now(),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
          tool_calls: toolCalls,
        },
        finish_reason,
      },
    ],
    usage,
  };
}

/**
 * Prepares a streaming response for mocking
 */
export function prepareStreamResponse(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        // Add data prefix and newline as per SSE format
        const chunk = `data: ${chunks[index]}\n\n`;
        controller.enqueue(encoder.encode(chunk));
        index++;
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        // End stream
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

/**
 * Creates a mock MCP transport for testing
 */
export function createMockTransport(responses: Map<string, any> = new Map()) {
  const sentMessages: JSONRPCMessage[] = [];
  const handlers = {
    onmessage: undefined as ((message: JSONRPCMessage) => void) | undefined,
    onclose: undefined as (() => void) | undefined,
    onerror: undefined as ((error: Error) => void) | undefined,
  };

  return {
    transport: {
      send: jest.fn(async (message: JSONRPCMessage) => {
        sentMessages.push(message);
        
        // Simulate response for specific methods
        if ('method' in message && responses.has(message.method) && 'id' in message && message.id !== undefined) {
          const response: JSONRPCResponse = {
            jsonrpc: '2.0',
            id: message.id,
            result: responses.get(message.method),
          };
          
          // Simulate async response
          setTimeout(() => {
            handlers.onmessage?.(response);
          }, 0);
        }
      }),
      
      start: jest.fn(async () => {}),
      close: jest.fn(async () => {}),
      
      get onmessage() { return handlers.onmessage; },
      set onmessage(handler) { handlers.onmessage = handler; },
      
      get onclose() { return handlers.onclose; },
      set onclose(handler) { handlers.onclose = handler; },
      
      get onerror() { return handlers.onerror; },
      set onerror(handler) { handlers.onerror = handler; },
    },
    
    getSentMessages: () => sentMessages,
    simulateMessage: (message: JSONRPCMessage) => handlers.onmessage?.(message),
    simulateError: (error: Error) => handlers.onerror?.(error),
    simulateClose: () => handlers.onclose?.(),
  };
}

/**
 * Creates a mock tool implementation for testing
 */
export function createMockTool(name: string, schema: any, mockExecute?: (args: any) => any) {
  return {
    description: `Mock ${name} tool`,
    inputSchema: schema,
    execute: mockExecute || jest.fn().mockResolvedValue({ success: true }),
  };
}

/**
 * Converts a readable stream to an array for easier testing
 */
export async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const chunks: T[] = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  return chunks;
}

/**
 * Creates a mock request object for testing
 */
export function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string | number>;
  body?: any;
  url?: string;
}) {
  const {
    method = 'POST',
    headers = {},
    body = {},
    url = 'http://localhost:3000/api/chat',
  } = options;

  // Convert model config to API headers
  const apiHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'modelId') {
      apiHeaders['x-model'] = String(value);
    } else if (key === 'temperature') {
      apiHeaders['x-temperature'] = String(value);
    } else if (key === 'topK') {
      apiHeaders['x-top-k'] = String(value);
    } else if (key === 'topP') {
      apiHeaders['x-top-p'] = String(value);
    } else if (key === 'presencePenalty') {
      apiHeaders['x-presence-penalty'] = String(value);
    } else if (key === 'frequencyPenalty') {
      apiHeaders['x-frequency-penalty'] = String(value);
    } else if (key === 'maxOutputTokens') {
      apiHeaders['x-max-output-tokens'] = String(value);
    } else if (key === 'maxSteps') {
      apiHeaders['x-max-steps'] = String(value);
    } else {
      apiHeaders[key] = String(value);
    }
  }

  return new Request(url, {
    method,
    headers: apiHeaders,
    body: JSON.stringify(body),
  });
}

/**
 * Helper to wait for all promises in the current tick
 */
export async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Creates a deferred promise for testing async flows
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}