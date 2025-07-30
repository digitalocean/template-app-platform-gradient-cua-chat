import { GET } from './route';

// Mock the logger
jest.mock('@/app/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('GET /api/gradient-models', () => {
  const mockModelsResponse = {
    data: [
      { id: 'models/openai-gpt-4.1', object: 'model', created: 1234567890, owned_by: 'openai' },
      { id: 'models/anthropic-claude-3.5-sonnet', object: 'model', created: 1234567890, owned_by: 'anthropic' },
      { id: 'models/mistral-nemo-instruct-2407', object: 'model', created: 1234567890, owned_by: 'mistral' },
      { id: 'models/unknown-model', object: 'model', created: 1234567890, owned_by: 'unknown' },
    ],
  };

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GRADIENT_API_KEY: 'test-api-key' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockModelsResponse),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Successful responses', () => {
    it('should return models with correct max tokens', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.models).toHaveLength(4);

      // Check specific models have correct max tokens
      expect(data.models[0]).toEqual({
        id: 'models/openai-gpt-4.1',
        name: 'openai-gpt-4.1',
        object: 'model',
        created: 1234567890,
        owned_by: 'openai',
        maxTokens: 32768,
      });

      expect(data.models[1]).toEqual({
        id: 'models/anthropic-claude-3.5-sonnet',
        name: 'anthropic-claude-3.5-sonnet',
        object: 'model',
        created: 1234567890,
        owned_by: 'anthropic',
        maxTokens: 100000,
      });

      expect(data.models[2]).toEqual({
        id: 'models/mistral-nemo-instruct-2407',
        name: 'mistral-nemo-instruct-2407',
        object: 'model',
        created: 1234567890,
        owned_by: 'mistral',
        maxTokens: 130072,
      });

      // Unknown model should get default max tokens
      expect(data.models[3]).toEqual({
        id: 'models/unknown-model',
        name: 'unknown-model',
        object: 'model',
        created: 1234567890,
        owned_by: 'unknown',
        maxTokens: 32000, // Default value
      });
    });

    it('should make correct API request', async () => {
      await GET();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://inference.do-ai.run/v1/models',
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle empty model list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [] }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.models).toEqual([]);
    });

    it('should handle missing data property', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.models).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should return 500 if GRADIENT_API_KEY is not set', async () => {
      delete process.env.GRADIENT_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Gradient API key not configured');
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch models');
    });

    it('should handle non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch models');
    });
  });

  describe('Model token limits', () => {
    const testCases = [
      // Alibaba models
      { modelId: 'alibaba-qwen3-32b', expectedTokens: 32768 },

      // Anthropic models
      { modelId: 'anthropic-claude-3-opus', expectedTokens: 4096 },
      { modelId: 'anthropic-claude-3.5-haiku', expectedTokens: 100000 },
      { modelId: 'anthropic-claude-3.5-sonnet', expectedTokens: 100000 },
      { modelId: 'anthropic-claude-3.7-sonnet', expectedTokens: 64000 },
      { modelId: 'anthropic-claude-opus-4', expectedTokens: 32000 },
      { modelId: 'anthropic-claude-sonnet-4', expectedTokens: 64000 },

      // DeepSeek models
      { modelId: 'deepseek-r1-distill-llama-70b', expectedTokens: 8192 },

      // Llama models
      { modelId: 'llama3-8b-instruct', expectedTokens: 8192 },
      { modelId: 'llama3.3-70b-instruct', expectedTokens: 8192 },

      // Mistral models
      { modelId: 'mistral-nemo-instruct-2407', expectedTokens: 130072 },

      // OpenAI models
      { modelId: 'openai-gpt-4.1', expectedTokens: 32768 },
      { modelId: 'openai-gpt-4o', expectedTokens: 100000 },
      { modelId: 'openai-gpt-4o-mini', expectedTokens: 16384 },
      { modelId: 'openai-o3', expectedTokens: 100000 },
      { modelId: 'openai-o3-mini', expectedTokens: 128000 },

      // Unknown model (default)
      { modelId: 'unknown-model-xyz', expectedTokens: 32000 },
    ];

    test.each(testCases)('should return $expectedTokens tokens for $modelId', async ({ modelId, expectedTokens }) => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: [{ id: `models/${modelId}`, object: 'model', created: 1234567890, owned_by: 'test' }],
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.models[0].maxTokens).toBe(expectedTokens);
    });
  });
});
