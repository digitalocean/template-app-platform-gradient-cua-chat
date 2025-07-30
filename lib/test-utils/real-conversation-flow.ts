/**
 * Complete conversation flow captured from debug mode
 * This shows the exact structure of messages as they stream through the system
 * Including step-start parts that were previously missing
 */

// Type for tool output content which can include images (for reference)
// type ToolOutputContent = {
//   type: 'text' | 'image';
//   text?: string;
//   mimeType?: string;
//   url?: string;
// };

// Extended part type for our test data
type ExtendedMessagePart = {
  type: string;
  [key: string]: unknown;
};

// Extended UIMessage type that allows our test data structure
type TestUIMessage = {
  parts: ExtendedMessagePart[];
  id: string;
  role: 'user' | 'assistant' | 'system';
};

// The complete conversation array as it appears in the debug view
export const REAL_CONVERSATION_FLOW: TestUIMessage[] = [
  // User message
  {
    "parts": [
      {
        "type": "text",
        "text": "Please navigate to google.com and take a screenshot"
      }
    ],
    "id": "bQoCU90DKThG8V5b",
    "role": "user"
  },
  
  // Assistant response with multiple steps
  {
    "id": "uXN5d0RYQfoojLAI",
    "role": "assistant",
    "parts": [
      // First step-start
      {
        "type": "step-start"
      },
      // Empty text part
      {
        "type": "text",
        "text": "",
        "state": "done"
      },
      // First tool call - browser_navigate
      {
        "type": "dynamic-tool",
        "toolName": "browser_navigate",
        "toolCallId": "call_JpPHgVdzflbW8hcNLe9Adixx",
        "state": "output-available",
        "input": {
          "url": "https://www.google.com"
        },
        "output": {
          "content": [
            {
              "type": "text",
              "text": "### Ran Playwright code\n```js\n// Navigate to https://www.google.com\nawait page.goto('https://www.google.com');\n```\n\n### Page state\n- Page URL: https://www.google.com/\n- Page Title: Google\n- Page Snapshot:\n```yaml\n- generic [ref=e3]:\n  - navigation [ref=e5]:\n    - link \"About\" [ref=e6] [cursor=pointer]:\n      - /url: https://about.google/?fg=1&utm_source=google-US&utm_medium=referral&utm_campaign=hp-header\n    - link \"Store\" [ref=e7] [cursor=pointer]:\n      - /url: https://store.google.com/US?utm_source=hp_header&utm_medium=google_ooo&utm_campaign=GS100042&hl=en-US\n    - generic [ref=e9]:\n      - generic [ref=e10]:\n        - link \"Gmail\" [ref=e12] [cursor=pointer]:\n          - /url: https://mail.google.com/mail/&ogbl\n        - link \"Search for Images\" [ref=e14] [cursor=pointer]:\n          - /url: https://www.google.com/imghp?hl=en&ogbl\n          - text: Images\n      - button \"Google apps\" [ref=e17] [cursor=pointer]:\n        - img [ref=e18] [cursor=pointer]\n      - link \"Sign in\" [ref=e22] [cursor=pointer]:\n        - /url: https://accounts.google.com/ServiceLogin?hl=en&passive=true&continue=https://www.google.com/&ec=futura_exp_og_so_72776762_e\n        - generic [ref=e23] [cursor=pointer]: Sign in\n  - img [ref=e26]\n  - search [ref=e34]:\n    - generic [ref=e36]:\n      - generic [ref=e38]:\n        - img [ref=e42]\n        - combobox \"Search\" [active] [ref=e46]\n        - generic [ref=e49]:\n          - button \"Search by voice\" [ref=e50] [cursor=pointer]:\n            - img [ref=e51] [cursor=pointer]\n          - button \"Search by image\" [ref=e53] [cursor=pointer]:\n            - img [ref=e54] [cursor=pointer]\n          - link \"AI Mode\" [ref=e56] [cursor=pointer]:\n            - generic [ref=e62] [cursor=pointer]:\n              - img [ref=e64] [cursor=pointer]\n              - generic [ref=e71] [cursor=pointer]: AI Mode\n      - generic [ref=e74]:\n        - button \"Google Search\" [ref=e75] [cursor=pointer]\n        - button \"I'm Feeling Lucky\" [ref=e76] [cursor=pointer]\n  - contentinfo [ref=e94]:\n    - generic [ref=e95]:\n      - generic [ref=e96]:\n        - link \"Advertising\" [ref=e97] [cursor=pointer]:\n          - /url: https://www.google.com/intl/en_us/ads/?subid=ww-ww-et-g-awa-a-g_hpafoot1_1!o2&utm_source=google.com&utm_medium=referral&utm_campaign=google_hpafooter&fg=1\n        - link \"Business\" [ref=e98] [cursor=pointer]:\n          - /url: https://www.google.com/services/?subid=ww-ww-et-g-awa-a-g_hpbfoot1_1!o2&utm_source=google.com&utm_medium=referral&utm_campaign=google_hpbfooter&fg=1\n        - link \"How Search works\" [ref=e99] [cursor=pointer]:\n          - /url: https://google.com/search/howsearchworks/?fg=1\n      - link \"Applying AI towards science and the environment\" [ref=e101] [cursor=pointer]:\n        - /url: https://ai.google/societal-impact/?utm_source=googlehpfooter&utm_medium=housepromos&utm_campaign=bottom-footer\n        - generic [ref=e102] [cursor=pointer]: Applying AI towards science and the environment\n      - generic [ref=e103]:\n        - link \"Privacy\" [ref=e104] [cursor=pointer]:\n          - /url: https://policies.google.com/privacy?hl=en&fg=1\n        - link \"Terms\" [ref=e105] [cursor=pointer]:\n          - /url: https://policies.google.com/terms?hl=en&fg=1\n        - button \"Settings\" [ref=e109] [cursor=pointer]:\n          - generic [ref=e110] [cursor=pointer]: Settings\n```\n"
            }
          ],
          "isError": false
        }
      },
      // Failed screenshot attempt (error)
      {
        "type": "dynamic-tool",
        "toolName": "browser_take_screenshot",
        "toolCallId": "call_h9FUvkxrzQJnIzRjkA8PuGCN",
        "state": "output-available",
        "input": {
          "filename": "google-homepage.png"
        },
        "output": {
          "content": [
            {
              "type": "text",
              "text": "Error: No open pages available. Use the \"browser_navigate\" tool to navigate to a page first."
            }
          ],
          "isError": true
        }
      },
      // Second step-start
      {
        "type": "step-start"
      },
      // Successful screenshot
      {
        "type": "dynamic-tool",
        "toolName": "browser_take_screenshot",
        "toolCallId": "call_ErUKE9dQQkfVwUCllnddPmAA",
        "state": "output-available",
        "input": {
          "filename": "google-homepage.png"
        },
        "output": {
          "content": [
            {
              "type": "text",
              "text": "### Result\nTook the viewport screenshot and saved it as /app/files/google-homepage.png\n\n### Ran Playwright code\n```js\n// Screenshot viewport and save it as /app/files/google-homepage.png\nawait page.screenshot({\n  path: '/app/files/google-homepage.png',\n  quality: 50,\n  scale: 'css',\n  type: 'jpeg'\n});\n```\n"
            },
            {
              "type": "image",
              "mimeType": "image/jpeg",
              "url": "https://playwright-mcp-cua-demo.nyc3.digitaloceanspaces.com/uploads/f0466657-4acd-48f9-ad43-a7e7936f66b3/screenshot.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=DO00ANDG6ND7ZWZKZD3M%2F20250730%2Fnyc3%2Fs3%2Faws4_request&X-Amz-Date=20250730T024559Z&X-Amz-Expires=604800&X-Amz-Signature=4fcdcf83b15621725db6111fe0053ed7a0c861997afd8367c30b67ff6b6a32dc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
            }
          ],
          "isError": false
        }
      },
      // Another empty text part
      {
        "type": "text",
        "text": "",
        "state": "done"
      },
      // Third step-start
      {
        "type": "step-start"
      },
      // Final response text
      {
        "type": "text",
        "text": "I have navigated to google.com and taken a screenshot of the homepage.\n\nYou can view or download the screenshot here:\n[Google Homepage Screenshot](https://playwright-mcp-cua-demo.nyc3.digitaloceanspaces.com/uploads/f0466657-4acd-48f9-ad43-a7e7936f66b3/screenshot.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=DO00ANDG6ND7ZWZKZD3M%2F20250730%2Fnyc3%2Fs3%2Faws4_request&X-Amz-Date=20250730T024559Z&X-Amz-Expires=604800&X-Amz-Signature=4fcdcf83b15621725db6111fe0053ed7a0c861997afd8367c30b67ff6b6a32dc&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)",
        "state": "done"
      }
    ]
  }
];

// Key observations from the real conversation flow:
// 1. step-start parts appear at the beginning of each AI processing step
// 2. dynamic-tool is the actual type name, not "tool" or "tool-call"
// 3. Tool outputs can have isError flag for error states
// 4. Text parts can be empty with state "done"
// 5. The assistant message contains all parts in sequential order
// 6. Each step seems to start with step-start and may contain multiple operations

// Part type counts in assistant message:
// - step-start: 3
// - text: 3 (including empty ones)
// - dynamic-tool: 3

export const STEP_START_PART_EXAMPLE = {
  "type": "step-start"
};

export const DYNAMIC_TOOL_PART_EXAMPLE = {
  "type": "dynamic-tool",
  "toolName": "browser_navigate",
  "toolCallId": "call_JpPHgVdzflbW8hcNLe9Adixx",
  "state": "output-available",
  "input": {
    "url": "https://www.google.com"
  },
  "output": {
    "content": [
      {
        "type": "text",
        "text": "Tool output text here..."
      }
    ],
    "isError": false
  }
};

export const DYNAMIC_TOOL_ERROR_EXAMPLE = {
  "type": "dynamic-tool",
  "toolName": "browser_take_screenshot",
  "toolCallId": "call_h9FUvkxrzQJnIzRjkA8PuGCN",
  "state": "output-available",
  "input": {
    "filename": "screenshot.png"
  },
  "output": {
    "content": [
      {
        "type": "text",
        "text": "Error: No open pages available."
      }
    ],
    "isError": true
  }
};