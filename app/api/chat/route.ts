import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
    convertToModelMessages,
    experimental_createMCPClient,
    stepCountIs,
    streamText,
    tool,
    UIMessage,
} from 'ai';
import { z } from 'zod';
import { PingAwareTransportWrapper } from '@/lib/mcp-transport';
import { processMessagesForBase64, processToolCallForBase64, processToolResultForBase64 } from '@/app/lib/s3-utils';



export async function POST(req: Request) {

    // Get parameters from headers
    const modelId = req.headers.get('x-model');
    if (!modelId) {
        return Response.json(
            { error: 'Model ID is required' },
            { status: 400 }
        );
    }

    const provider = createOpenAICompatible({
        name: 'Gradient',
        apiKey: process.env.GRADIENT_API_KEY || '',
        baseURL: process.env.GRADIENT_BASE_URL || '',
    });

    console.log("Model ID:", modelId);
    const temperature = parseFloat(req.headers.get('x-temperature') || '0.7');
    const topK = parseInt(req.headers.get('x-top-k') || '40');
    const topP = parseFloat(req.headers.get('x-top-p') || '0.95');
    const presencePenalty = parseFloat(req.headers.get('x-presence-penalty') || '0.0');
    const frequencyPenalty = parseFloat(req.headers.get('x-frequency-penalty') || '0.0');
    const maxOutputTokens = parseInt(req.headers.get('x-max-output-tokens') || '32000');
    const maxSteps = parseInt(req.headers.get('x-max-steps') || '20');

    console.log("Using model:", modelId, "with params:", { temperature, topK, topP, presencePenalty, frequencyPenalty, maxOutputTokens, maxSteps });
    const url = new URL(process.env.PLAYWRIGHT_MCP_ENDPOINT || 'http://localhost:8080/mcp');
    const baseTransport = new StreamableHTTPClientTransport(url, {});
    const transport = new PingAwareTransportWrapper(baseTransport);

    const [mcpClient, body] = await Promise.all([
        experimental_createMCPClient({
            transport,
            async onUncaughtError(error) {
                console.error('Uncaught error in MCP client:', error);
                if (mcpClient) {
                    await mcpClient.close();
                }
            },
        }),
        req.json(),
    ]);

    // Process messages to replace base64 data with S3 URLs
    const processedMessages = await processMessagesForBase64(body.messages);
    const messages = processedMessages as UIMessage[];

    try {
        // Get MCP tools directly - they're already in the correct format for AI SDK
        const mcpTools = await mcpClient.tools();

        // Wrap MCP tools to intercept and process base64 data
        const wrappedMcpTools: Record<string, unknown> = {};
        for (const [toolName, toolDef] of Object.entries(mcpTools)) {
            const tool = toolDef as unknown;
            wrappedMcpTools[toolName] = {
                ...(tool as object),
                execute: async (...args: unknown[]) => {
                    // Process input arguments for base64 data
                    const processedToolCall = await processToolCallForBase64({
                        toolName,
                        args: args[0],
                    });

                    // Get the original execute function
                    const execute = (tool as { execute?: unknown })?.execute;
                    if (typeof execute !== 'function') {
                        throw new Error(`Tool ${toolName} does not have an execute function`);
                    }

                    // Call with processed args and pass through any additional arguments
                    const newArgs = [processedToolCall.args, ...args.slice(1)];
                    const result = await (execute as (...args: unknown[]) => unknown)(...newArgs);

                    // Process the result for base64 data
                    const processedResult = await processToolResultForBase64(result);

                    return processedResult;
                },
            };
        }

        // Define custom client-side tools that require confirmation
        const customTools = {
            askForConfirmation: tool({
                description: 'Ask the user for confirmation before proceeding',
                inputSchema: z.object({
                    message: z.string(),
                }),
                outputSchema: z.string(),
                // No execute function - this will be handled on the client
            }),
        };

        // Combine wrapped MCP tools with custom tools
        const tools = { ...wrappedMcpTools, ...customTools };

        try {
            const result = await streamText({
                model: provider(modelId),
                tools,
                stopWhen: stepCountIs(maxSteps),
                onStepFinish: async ({ toolResults }: { toolResults?: unknown[] }) => {
                    // Log tool results count instead of full JSON to avoid performance issues
                    console.log(`Step finished with ${toolResults?.length || 0} tool results`);
                },
                maxOutputTokens,
                topK,
                topP,
                temperature,
                presencePenalty,
                frequencyPenalty,
                system: `You are a helpful chatbot capable of anything the user asks for. You're empowered to decide , no need to always ask for confirmation. Your goal is to help the user find the content they need by searching Bing. You can navigate to other websites as well, and you should always send screenshots. Take as many steps as you need to complete the task. Be creative and resourceful in your approach.`,
                messages: convertToModelMessages(messages),
                maxRetries: 5,
            });

            const response = result.toUIMessageStreamResponse({
                headers: {
                    'Transfer-Encoding': 'chunked',
                    Connection: 'keep-alive',
                },
            });

            return response;
        } catch (streamError) {
            console.error('Error during streamText:', streamError);

            // Extract detailed error message if available
            let errorMessage = 'An error occurred';

            if (streamError && typeof streamError === 'object' && 'responseBody' in streamError) {
                try {
                    const responseBody = (streamError as { responseBody?: unknown }).responseBody;
                    if (typeof responseBody === 'string') {
                        const parsed = JSON.parse(responseBody);
                        if (parsed.message) {
                            // Try to extract the nested error message
                            const match = parsed.message.match(/\\"message\\":\\"([^"]+)\\"/);
                            if (match) {
                                errorMessage = match[1];
                            } else {
                                errorMessage = parsed.message;
                            }
                        }
                    }
                } catch {
                    // If parsing fails, use the original error message
                    if (streamError instanceof Error) {
                        errorMessage = streamError.message;
                    }
                }
            } else if (streamError instanceof Error) {
                errorMessage = streamError.message;
            }

            console.log('Extracted error message:', errorMessage);

            // Return error as part of the stream format that useChat expects
            return new Response(
                JSON.stringify({
                    error: errorMessage,
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }
    } catch (error) {
        console.error('Chat API error caught in catch block:', error);
        mcpClient.close();

        // Extract detailed error message if available
        let errorMessage = 'An error occurred';

        if (error && typeof error === 'object' && 'responseBody' in error) {
            try {
                const responseBody = (error as { responseBody?: unknown }).responseBody;
                if (typeof responseBody === 'string') {
                    const parsed = JSON.parse(responseBody);
                    if (parsed.message) {
                        // Try to extract the nested error message
                        const match = parsed.message.match(/\\"message\\":\\"([^"]+)\\"/);
                        if (match) {
                            errorMessage = match[1];
                        } else {
                            errorMessage = parsed.message;
                        }
                    }
                }
            } catch {
                // If parsing fails, use the original error message
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        // Return a proper error response that includes the detailed message
        // Following the AI SDK expected format
        const errorResponse = {
            error: {
                message: errorMessage,
                type: 'api_error',
            },
        };

        console.log('Returning error response:', errorResponse);

        return new Response(
            JSON.stringify(errorResponse),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
