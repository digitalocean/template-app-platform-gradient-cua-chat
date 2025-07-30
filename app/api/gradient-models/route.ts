import { createLogger } from '@/app/lib/logger';
import { NextResponse } from 'next/server';

interface GradientModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

const logger = createLogger('gradient-models-api');

/**
 * Get the maximum token limit for a specific model. 
 * This route doesn't yet return model information.
 * @param modelId - The ID of the model to get max tokens for
 * @returns The maximum token limit for the model
 */
function getMaxTokensForModel(modelId: string): number {
  // Extract the model name from the ID (e.g., "models/openai-gpt-4.1" -> "openai-gpt-4.1")
  const modelName = modelId.split('/').pop() || modelId;

  // Hardcoded max tokens mapping
  switch (modelName) {
    // Alibaba models
    case 'alibaba-qwen3-32b':
      return 32768;

    // Anthropic Claude models
    case 'anthropic-claude-3-opus':
      return 4096;

    case 'anthropic-claude-3.5-haiku':
      return 100000;

    case 'anthropic-claude-3.5-sonnet':
      return 100000;

    case 'anthropic-claude-3.7-sonnet':
      return 64000;
    case 'anthropic-claude-opus-4':
      return 32000;

    case 'anthropic-claude-sonnet-4':
      return 64000;

    // DeepSeek models
    case 'deepseek-r1-distill-llama-70b':
      return 8192;

    // Llama models
    case 'llama3-8b-instruct':
    case 'llama3.3-70b-instruct':
      return 8192;

    // Mistral models
    case 'mistral-nemo-instruct-2407':
      return 130072;

    // OpenAI models
    case 'openai-gpt-4.1':
      return 32768;

    case 'openai-gpt-4o':
      return 100000;

    case 'openai-gpt-4o-mini':
      return 16384;
    case 'openai-o3':
      return 100000;

    case 'openai-o3-mini':
      return 128000;

    // Default
    default:
      return 32000;
  }
}

export const GET = async () => {
  try {
    const gradientApiKey = process.env.GRADIENT_API_KEY;

    if (!gradientApiKey) {
      logger.error('GRADIENT_API_KEY not configured');
      return NextResponse.json(
        { error: 'Gradient API key not configured' },
        { status: 500 }
      );
    }

    logger.info('Fetching models from Gradient');

    const response = await fetch('https://inference.do-ai.run/v1/models', {
      headers: {
        'Authorization': `Bearer ${gradientApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`Fetched ${data.data?.length || 0} models from Gradient`);
    // Transform the response to match expected format
    const models = data.data?.map((model: GradientModel) => ({
      id: model.id,
      name: model.id.split('/').pop() || model.id, // Extract display name from ID
      object: model.object,
      created: model.created,
      owned_by: model.owned_by,
      maxTokens: getMaxTokensForModel(model.id),
    })) || [];

    return NextResponse.json({ models });
  } catch (error) {
    logger.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
};
