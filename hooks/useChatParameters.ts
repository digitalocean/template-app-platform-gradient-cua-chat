/**
 * Custom hook for managing chat parameters
 */
import { useState, useCallback } from 'react';

export interface ChatParameters {
  temperature: number;
  topK: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  maxOutputTokens: number;
  maxSteps: number;
}

const DEFAULT_PARAMETERS: ChatParameters = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  maxOutputTokens: 32000,
  maxSteps: 20,
};

export function useChatParameters() {
  const [parameters, setParameters] = useState<ChatParameters>(DEFAULT_PARAMETERS);

  const handleParameterChange = useCallback((param: string, value: number) => {
    setParameters((prev) => ({ ...prev, [param]: value }));
  }, []);

  const updateMaxOutputTokens = useCallback((maxTokens: number) => {
    setParameters((prev) => ({ ...prev, maxOutputTokens: maxTokens }));
  }, []);

  const getHeaders = useCallback(() => {
    return {
      "x-temperature": parameters.temperature.toString(),
      "x-top-k": parameters.topK.toString(),
      "x-top-p": parameters.topP.toString(),
      "x-presence-penalty": parameters.presencePenalty.toString(),
      "x-frequency-penalty": parameters.frequencyPenalty.toString(),
      "x-max-output-tokens": parameters.maxOutputTokens.toString(),
      "x-max-steps": parameters.maxSteps.toString(),
    };
  }, [parameters]);

  return {
    parameters,
    handleParameterChange,
    updateMaxOutputTokens,
    getHeaders,
  };
}