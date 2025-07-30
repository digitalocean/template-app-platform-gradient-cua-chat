/**
 * Test utilities for simulating AI SDK streaming responses
 * Based on AI SDK testing utilities: https://ai-sdk.dev/docs/ai-sdk-core/testing
 */

import { simulateReadableStream } from 'ai/test';

/**
 * Simulates a tool call streaming response
 */
export function createToolCallStream(toolName: string, toolCallId: string, args: any) {
  const chunks = [
    `9:{"toolCallId":"${toolCallId}","toolName":"${toolName}"}\n`,
    `a:"${toolCallId}":${JSON.stringify(args)}\n`,
    `b:"${toolCallId}"\n`,
  ];

  return simulateReadableStream({
    initialDelayInMs: 50,
    chunkDelayInMs: 20,
    chunks,
  });
}

/**
 * Simulates a text streaming response
 */
export function createTextStream(text: string, chunkSize: number = 10) {
  const chunks: string[] = [];
  
  // Split text into chunks
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(`0:"${chunk}"\n`);
  }
  
  // Add finish reason
  chunks.push(`d:{"finishReason":"stop"}\n`);

  return simulateReadableStream({
    initialDelayInMs: 100,
    chunkDelayInMs: 30,
    chunks,
  });
}

/**
 * Simulates an interactive tool response (e.g., askForConfirmation)
 */
export function createInteractiveToolStream(
  toolName: string,
  toolCallId: string,
  message: string
) {
  const chunks = [
    // Tool call start
    `9:{"toolCallId":"${toolCallId}","toolName":"${toolName}"}\n`,
    // Tool arguments
    `a:"${toolCallId}":{"message":"${message}"}\n`,
    // Tool state: input-available (waiting for user input)
    `c:"${toolCallId}":"input-available"\n`,
  ];

  return simulateReadableStream({
    initialDelayInMs: 50,
    chunkDelayInMs: 20,
    chunks,
  });
}

/**
 * Simulates a tool result response
 */
export function createToolResultStream(
  toolCallId: string,
  result: any,
  isError: boolean = false
) {
  const chunks = isError
    ? [
        // Tool error state
        `c:"${toolCallId}":"output-error"\n`,
        `e:"${toolCallId}":"${result}"\n`,
      ]
    : [
        // Tool success state
        `c:"${toolCallId}":"output-available"\n`,
        `d:"${toolCallId}":${JSON.stringify(result)}\n`,
      ];

  return simulateReadableStream({
    initialDelayInMs: 30,
    chunkDelayInMs: 10,
    chunks,
  });
}

/**
 * Creates a complete message with multiple parts for testing
 */
export function createMultiPartStream(parts: Array<{ type: 'text' | 'tool', content: any }>) {
  const chunks: string[] = [];

  parts.forEach((part) => {
    if (part.type === 'text') {
      chunks.push(`0:"${part.content}"\n`);
    } else if (part.type === 'tool') {
      const { toolName, toolCallId, args } = part.content;
      chunks.push(`9:{"toolCallId":"${toolCallId}","toolName":"${toolName}"}\n`);
      chunks.push(`a:"${toolCallId}":${JSON.stringify(args)}\n`);
      chunks.push(`b:"${toolCallId}"\n`);
    }
  });

  // Add finish
  chunks.push(`d:{"finishReason":"stop"}\n`);

  return simulateReadableStream({
    initialDelayInMs: 100,
    chunkDelayInMs: 50,
    chunks,
  });
}

/**
 * Helper to convert a simulated stream to a Response object
 */
export function streamToResponse(stream: ReadableStream): Response {
  return new Response(
    stream.pipeThrough(new TextEncoderStream()),
    {
      headers: {
        'X-Vercel-AI-Data-Stream': 'v1',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    }
  );
}