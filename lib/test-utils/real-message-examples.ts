/**
 * Real message examples captured from the debug mode output
 * These are used to validate our tests match real-world message structures
 */

import { UIMessage } from 'ai';

// Real user message structure
export const REAL_USER_MESSAGE: UIMessage = {
  parts: [
    {
      type: 'text',
      text: 'Hello, can you tell me what 2 + 2 equals?'
    }
  ],
  id: 'F80TLDwKOEN7tK2w',
  role: 'user'
};

// Real assistant message with text response
export const REAL_ASSISTANT_TEXT_MESSAGE: UIMessage = {
  parts: [
    {
      type: 'text',
      text: '2 + 2 equals 4.'
    }
  ],
  id: 'msg_123',
  role: 'assistant'
};

// Real assistant message with tool call
export const REAL_ASSISTANT_TOOL_MESSAGE: UIMessage = {
  parts: [
    {
      type: 'text',
      text: 'I\'ll take a screenshot for you.'
    },
    {
      type: 'tool',
      toolCallId: 'toolu_01ABC123',
      toolName: 'browser_take_screenshot',
      args: {
        filename: 'screenshot.png'
      },
      state: 'partial-call'
    } as any
  ],
  id: 'msg_456',
  role: 'assistant'
};

// Real tool result message part
export const REAL_TOOL_RESULT_PART = {
  type: 'tool-result',
  toolCallId: 'toolu_01ABC123',
  toolName: 'browser_take_screenshot',
  result: {
    content: [
      {
        type: 'image',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }
    ]
  }
};

// Real assistant message with multiple parts
export const REAL_MULTI_PART_MESSAGE: UIMessage = {
  parts: [
    {
      type: 'text',
      text: 'Let me help you with that calculation.'
    },
    {
      type: 'text', 
      text: '2 + 2 = 4'
    },
    {
      type: 'text',
      text: 'Is there anything else you\'d like to know?'
    }
  ],
  id: 'msg_789',
  role: 'assistant'
};

// Real streaming tool states (based on actual implementation)
export const REAL_TOOL_STREAMING_STATES = {
  inputStreaming: {
    type: 'tool',
    toolCallId: 'toolu_01DEF456',
    toolName: 'askForConfirmation',
    state: 'input-streaming',
    args: {
      message: 'Do you want to proceed with this action?'
    }
  },
  inputAvailable: {
    type: 'tool',
    toolCallId: 'toolu_01DEF456', 
    toolName: 'askForConfirmation',
    state: 'input-available',
    input: {
      message: 'Do you want to proceed with this action?'
    }
  },
  outputAvailable: {
    type: 'tool',
    toolCallId: 'toolu_01DEF456',
    toolName: 'askForConfirmation',
    state: 'output-available',
    output: 'Yes, confirmed.'
  },
  outputError: {
    type: 'tool',
    toolCallId: 'toolu_01DEF456',
    toolName: 'askForConfirmation',
    state: 'output-error',
    errorText: 'Tool execution failed'
  }
};

// Note: Error parts are not valid UIMessage part types in the AI SDK v5
// Errors are handled at the message stream level, not as message parts

// Real message with image upload
// Note: In AI SDK v5, images are typically handled as file attachments
// or encoded within text parts, not as separate "image" parts
export const REAL_IMAGE_UPLOAD_MESSAGE: UIMessage = {
  parts: [
    {
      type: 'text',
      text: 'Here is an image:'
    },
    // Images would be included as attachments or data URLs within text
    {
      type: 'text' as const,
      text: '[Image: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==]'
    }
  ],
  id: 'img_upload_123',
  role: 'user'
};