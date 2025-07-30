/**
 * Tool handlers for rendering various tool UI components in the chat interface
 * This module contains all the rendering functions for different tool types and states
 */

import {
  MediaRenderer,
  TextRenderer,
  ErrorDisplay,
  CollapsibleContent,
} from "@/components/media-renderers";
import ApiErrorDisplay from "@/components/chat/ApiErrorDisplay";

// Type definitions for tool output
interface ToolOutputContent {
  type: string;
  text?: string;
}

interface ToolOutput {
  isError?: boolean;
  content?: ToolOutputContent[];
}

// Type for the addToolResult function
type AddToolResultFunction = (result: {
  tool: string;
  toolCallId: string;
  output: string;
}) => void;

// Part type definitions
interface BasePart {
  type: string;
}

interface TextPart extends BasePart {
  type: "text";
  text: string;
}

interface FilePart extends BasePart {
  type: "file";
  url: string;
  mediaType?: string;
  filename?: string;
}

interface StepPart extends BasePart {
  type: "step";
  stepNumber?: number;
  name?: string;
  description?: string;
  status?: "completed" | "in-progress" | string;
}

interface StepStartPart extends BasePart {
  type: "step-start";
  request?: {
    modelId?: string;
    messages?: unknown[];
  };
  warnings?: unknown[];
}

interface FinishStepPart extends BasePart {
  type: "finish-step";
  response?: {
    id?: string;
    modelId?: string;
  };
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

interface ErrorPart extends BasePart {
  type: "error";
  error?: string | Error | {
    message?: string;
    statusCode?: number;
    responseBody?: string;
  };
}

interface ToolPart extends BasePart {
  type: "tool" | "tool-result" | "dynamic-tool";
  toolName: string;
  toolCallId: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: {
    message?: string;
    type?: "confirmation" | "choice" | "text-input";
    confirmValue?: string;
    denyValue?: string;
    confirmLabel?: string;
    denyLabel?: string;
    options?: Array<{ label?: string; value?: string } | string>;
    placeholder?: string;
    url?: string;
    filename?: string;
  };
  output?: string | ToolOutput;
  result?: ToolOutput;
  errorText?: string;
}

type MessagePart = TextPart | FilePart | StepPart | StepStartPart | FinishStepPart | ToolPart | ErrorPart | { type: string; [key: string]: unknown };

/**
 * Renders a text part in the message
 */
export function renderTextPart(messageId: string, index: number, text: string) {
  return (
    <TextRenderer
      key={`${messageId}-text-${index}`}
      text={text}
      className="my-2"
    />
  );
}

/**
 * Renders a file part with media renderer
 */
export function renderFilePart(messageId: string, index: number, part: FilePart) {
  return (
    <MediaRenderer
      key={`${messageId}-file-${index}`}
      content={{
        type: "file",
        url: part.url,
        mimeType: part.mediaType,
        filename: part.filename,
      }}
      className="my-2"
    />
  );
}

/**
 * Renders a tool error display
 */
export function renderToolError(messageId: string, index: number, toolName: string) {
  return (
    <ErrorDisplay
      key={`${messageId}-tool-${index}`}
      error={"Tool execution failed"}
      title={`Error in ${toolName}`}
      className="my-2"
    />
  );
}

/**
 * Renders a browser snapshot in a collapsible container
 */
export function renderBrowserSnapshot(
  messageId: string,
  index: number,
  output: ToolOutput
) {
  const snapshotContent = output.content?.find(
    (c: ToolOutputContent) =>
      c.type === "text" && c.text?.includes("Page Snapshot:")
  );

  if (!snapshotContent) return null;

  return (
    <CollapsibleContent
      key={`${messageId}-tool-${index}`}
      title="Browser Snapshot"
      className="my-2"
      defaultOpen={false}
    >
      <MediaRenderer content={snapshotContent} className="text-xs" />
    </CollapsibleContent>
  );
}

/**
 * Renders tool output content
 */
export function renderToolOutput(
  messageId: string,
  index: number,
  output: ToolOutput
) {
  if (!output?.content) return null;

  return (
    <div key={`${messageId}-tool-${index}`} className="my-2">
      {output.content.map(
        (content: ToolOutputContent, contentIndex: number) => (
          <MediaRenderer
            key={`${messageId}-tool-${index}-content-${contentIndex}`}
            content={content}
            className="my-2"
          />
        )
      )}
    </div>
  );
}

/**
 * Renders unknown part types for debugging
 */
export function renderUnknownPart(messageId: string, index: number, part: MessagePart) {
  return (
    <div
      key={`${messageId}-unknown-${index}`}
      className="my-2 p-2 bg-gray-100 rounded text-sm"
    >
      <div className="font-semibold text-gray-600">
        Unknown Part Type: {part.type}
      </div>
      <TextRenderer
        text={`\`\`\`json\n${JSON.stringify(part, null, 2)}\n\`\`\``}
        className="text-xs mt-1"
      />
    </div>
  );
}

/**
 * Renders the askForConfirmation interactive tool
 */
 
export function renderAskForConfirmationTool(
  messageId: string,
  index: number,
  part: ToolPart,
  addToolResult: AddToolResultFunction
) {
  const toolCallId = part.toolCallId;

  switch (part.state) {
    case "input-streaming":
      return (
        <div
          key={`${messageId}-askForConfirmation-${index}`}
          className="my-2 p-3 bg-gray-100 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span className="text-sm text-gray-600">
              Loading confirmation request...
            </span>
          </div>
        </div>
      );

    case "input-available":
      return (
        <div
          key={`${messageId}-askForConfirmation-${index}`}
          className="my-2 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="mb-3">
            <p className="text-sm text-gray-700">{part.input?.message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                addToolResult({
                  tool: "askForConfirmation",
                  toolCallId: toolCallId,
                  output: "Yes, confirmed.",
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() =>
                addToolResult({
                  tool: "askForConfirmation",
                  toolCallId: toolCallId,
                  output: "No, denied",
                })
              }
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              No
            </button>
          </div>
        </div>
      );

    case "output-available":
      return (
        <div
          key={`${messageId}-askForConfirmation-${index}`}
          className="my-2 p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="text-sm text-green-800">
            Confirmation response: {typeof part.output === 'string' ? part.output : JSON.stringify(part.output)}
          </div>
        </div>
      );

    case "output-error":
      return (
        <ErrorDisplay
          key={`${messageId}-askForConfirmation-${index}`}
          error={part.errorText || "Tool execution failed"}
          title="Confirmation Error"
          className="my-2"
        />
      );

    default:
      return null;
  }
}

/**
 * Renders dynamic tools with various input types
 */
 
export function renderDynamicTool(
  messageId: string,
  index: number,
  part: ToolPart,
  addToolResult: AddToolResultFunction
) {
  const { toolName, state, output, input, toolCallId } = part;

  // Handle different states
  switch (state) {
    case "input-streaming":
      return (
        <div
          key={`${messageId}-dynamic-tool-${index}`}
          className="my-2 p-3 bg-gray-100 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span className="text-sm text-gray-600">Loading {toolName}...</span>
          </div>
        </div>
      );

    case "input-available":
      // Handle interactive tools that need user input
      return (
        <div
          key={`${messageId}-dynamic-tool-${index}`}
          className="my-2 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="mb-3">
            <span className="font-medium text-blue-900">{toolName}</span>
            {input?.message && (
              <p className="mt-2 text-sm text-gray-700">{input.message}</p>
            )}
          </div>

          {/* Render UI based on input structure */}
          {renderDynamicToolInput(toolName, input, toolCallId, addToolResult)}
        </div>
      );

    case "output-available":
      // Render successful output
      return renderDynamicToolOutput(messageId, index, toolName, output || '');

    case "output-error":
      return (
        <ErrorDisplay
          key={`${messageId}-dynamic-tool-${index}`}
          error={part.errorText || "Tool execution failed"}
          title={`Error in ${toolName}`}
          className="my-2"
        />
      );

    default:
      // For any unknown state, show a generic message
      return (
        <div
          key={`${messageId}-dynamic-tool-${index}`}
          className="my-2 p-3 bg-gray-100 rounded-lg"
        >
          <span className="text-sm text-gray-600">
            {toolName} - State: {state || "unknown"}
          </span>
        </div>
      );
  }
}

/**
 * Helper function to render dynamic tool input UI
 */
 
function renderDynamicToolInput(
  toolName: string,
  input: ToolPart['input'],
  toolCallId: string,
  addToolResult: AddToolResultFunction
) {
  // Handle confirmation-style tools
  if (
    input?.type === "confirmation" ||
    toolName === "askForConfirmation"
  ) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() =>
            addToolResult({
              tool: toolName,
              toolCallId: toolCallId,
              output: input?.confirmValue || "Yes, confirmed.",
            })
          }
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          {input?.confirmLabel || "Yes"}
        </button>
        <button
          onClick={() =>
            addToolResult({
              tool: toolName,
              toolCallId: toolCallId,
              output: input?.denyValue || "No, denied",
            })
          }
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {input?.denyLabel || "No"}
        </button>
      </div>
    );
  }

  // Handle choice-style tools
  if (input?.type === "choice" && input?.options) {
    return (
      <div className="space-y-2">
        {input.options.map(
          (
            option: { label?: string; value?: string } | string,
            idx: number
          ) => (
            <button
              key={idx}
              onClick={() =>
                addToolResult({
                  tool: toolName,
                  toolCallId: toolCallId,
                  output:
                    typeof option === "string"
                      ? option
                      : option.value || JSON.stringify(option),
                })
              }
              className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {typeof option === "string"
                ? option
                : option.label || option.value || "Option"}
            </button>
          )
        )}
      </div>
    );
  }

  // Handle text input tools
  if (input?.type === "text-input") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const value = formData.get("input") as string;
          addToolResult({
            tool: toolName,
            toolCallId: toolCallId,
            output: value,
          });
        }}
        className="flex gap-2"
      >
        <input
          name="input"
          type="text"
          placeholder={input.placeholder || "Enter your response"}
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Submit
        </button>
      </form>
    );
  }

  // Default: Show input data with a generic submit button
  return (
    <div className="space-y-3">
      <div className="p-3 bg-white rounded border border-gray-200">
        <TextRenderer
          text={`Input data:\n\`\`\`json\n${JSON.stringify(
            input || {},
            null,
            2
          )}\n\`\`\``}
          className="text-xs"
        />
      </div>
      <button
        onClick={() =>
          addToolResult({
            tool: toolName,
            toolCallId: toolCallId,
            output: "Acknowledged",
          })
        }
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

/**
 * Helper function to render dynamic tool output
 */
 
function renderDynamicToolOutput(
  messageId: string,
  index: number,
  toolName: string,
  output: string | ToolOutput
) {
  // Special handling for browser_snapshot tool
  if (toolName === "browser_snapshot" && output && typeof output !== 'string') {
    return renderBrowserSnapshot(messageId, index, output);
  }

  // Render generic output
  return (
    <CollapsibleContent
      key={`${messageId}-dynamic-tool-${index}`}
      title={`${toolName} Result`}
      className="my-2"
      defaultOpen={false}
    >
      {typeof output === 'string' ? (
        <div className="text-sm text-gray-700">{output}</div>
      ) : output?.isError ? (
        renderToolError(messageId, index, toolName)
      ) : output ? (
        renderToolOutput(messageId, index, output)
      ) : (
        <div className="text-sm text-gray-600">Tool executed successfully</div>
      )}
    </CollapsibleContent>
  );
}

/**
 * Renders a step-start part
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function renderStepStartPart(messageId: string, index: number, part: StepStartPart) {
  // Step-start parts are typically internal metadata, so we'll render them minimally
  // or skip them entirely in production
  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        key={`${messageId}-step-start-${index}`}
        className="my-1 p-2 bg-gray-50 rounded text-xs text-gray-500"
      >
        <span className="font-mono">Step started</span>
      </div>
    );
  }
  return null;
}

/**
 * Renders a finish-step part
 */
export function renderFinishStepPart(messageId: string, index: number, part: FinishStepPart) {
  // Finish-step parts contain usage metadata, typically not shown to users
  if (process.env.NODE_ENV === 'development' && part.usage) {
    return (
      <div
        key={`${messageId}-finish-step-${index}`}
        className="my-1 p-2 bg-gray-50 rounded text-xs text-gray-500"
      >
        <span className="font-mono">
          Tokens: {part.usage.promptTokens || 0} prompt, {part.usage.completionTokens || 0} completion
        </span>
      </div>
    );
  }
  return null;
}

/**
 * Renders an error part (API errors, streaming errors, etc.)
 */
export function renderErrorPart(messageId: string, index: number, part: ErrorPart) {
  const { error } = part;
  
  // Handle different error formats
  if (!error) {
    return null;
  }
  
  // If it's a structured error object with statusCode
  if (typeof error === 'object' && 'statusCode' in error) {
    return (
      <ApiErrorDisplay
        key={`${messageId}-error-${index}`}
        error={error}
        className="my-2"
      />
    );
  }
  
  // If it's an Error instance
  if (error instanceof Error) {
    return (
      <ErrorDisplay
        key={`${messageId}-error-${index}`}
        error={error.message}
        title="Error"
        className="my-2"
      />
    );
  }
  
  // If it's a string
  return (
    <ErrorDisplay
      key={`${messageId}-error-${index}`}
      error={String(error)}
      title="Error"
      className="my-2"
    />
  );
}

/**
 * Renders a step part (for multi-step processes)
 */
export function renderStepPart(messageId: string, index: number, part: StepPart) {
  return (
    <div
      key={`${messageId}-step-${index}`}
      className="my-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
          {part.stepNumber || index + 1}
        </div>
        <span className="font-medium text-gray-900">{part.name}</span>
      </div>
      {part.description && (
        <p className="text-sm text-gray-600 ml-8">{part.description}</p>
      )}
      {part.status && (
        <div className="mt-2 ml-8">
          <span
            className={`text-xs px-2 py-1 rounded ${
              part.status === "completed"
                ? "bg-green-100 text-green-800"
                : part.status === "in-progress"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {part.status}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a tool part based on its type and state
 */
 
export function renderToolPart(
  messageId: string,
  index: number,
  part: ToolPart,
  addToolResult?: AddToolResultFunction
) {
  // Handle askForConfirmation tool specifically
  if ((part.type === "tool" || part.type === "dynamic-tool") && part.toolName === "askForConfirmation" && addToolResult) {
    return renderAskForConfirmationTool(messageId, index, part, addToolResult);
  }

  // Handle other dynamic tools
  if ((part.type === "tool" || part.type === "dynamic-tool") && part.toolName && addToolResult) {
    return renderDynamicTool(messageId, index, part, addToolResult);
  }

  // Handle dynamic-tool without addToolResult (display mode)
  if (part.type === "dynamic-tool" && part.state === "output-available") {
    const { toolName, output } = part;
    
    // Handle browser_snapshot special case
    if (toolName === "browser_snapshot" && output && typeof output !== 'string') {
      return renderBrowserSnapshot(messageId, index, output);
    }

    // Handle error outputs
    if (typeof output === 'object' && output && 'isError' in output && output.isError) {
      return renderToolError(messageId, index, toolName);
    }

    // Handle normal outputs
    if (output && typeof output === 'object' && 'content' in output) {
      return renderToolOutput(messageId, index, output);
    }
  }

  // Handle tool results without interactive elements
  if (part.type === "tool-result") {
    const { toolName, result } = part;

    // Handle browser_snapshot special case
    if (toolName === "browser_snapshot" && result) {
      return renderBrowserSnapshot(messageId, index, result);
    }

    // Handle error results
    if (result?.isError) {
      return renderToolError(messageId, index, toolName);
    }

    // Handle normal results
    if (result) {
      return renderToolOutput(messageId, index, result);
    }
  }

  // Fallback
  return null;
}

/**
 * Main function to render any message part
 */
 
export function renderMessagePart(
  messageId: string,
  index: number,
  part: MessagePart,
  addToolResult?: AddToolResultFunction
) {
  switch (part.type) {
    case "text":
      return renderTextPart(messageId, index, (part as TextPart).text);
    
    case "file":
      return renderFilePart(messageId, index, part as FilePart);
    
    case "step":
      return renderStepPart(messageId, index, part as StepPart);
    
    case "step-start":
      return renderStepStartPart(messageId, index, part as StepStartPart);
    
    case "finish-step":
      return renderFinishStepPart(messageId, index, part as FinishStepPart);
    
    case "error":
      return renderErrorPart(messageId, index, part as ErrorPart);
    
    case "tool":
    case "tool-result":
    case "dynamic-tool":
      return renderToolPart(messageId, index, part as ToolPart, addToolResult);
    
    default:
      return renderUnknownPart(messageId, index, part);
  }
}