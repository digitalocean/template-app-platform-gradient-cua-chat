/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useChatParameters } from './useChatParameters';

describe('useChatParameters', () => {
  it('initializes with default parameters', () => {
    const { result } = renderHook(() => useChatParameters());
    
    expect(result.current.parameters).toEqual({
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      maxOutputTokens: 32000,
      maxSteps: 20,
    });
  });

  it('updates individual parameters', () => {
    const { result } = renderHook(() => useChatParameters());
    
    act(() => {
      result.current.handleParameterChange('temperature', 0.9);
    });
    
    expect(result.current.parameters.temperature).toBe(0.9);
    // Other parameters should remain unchanged
    expect(result.current.parameters.topK).toBe(40);
  });

  it('updates max output tokens', () => {
    const { result } = renderHook(() => useChatParameters());
    
    act(() => {
      result.current.updateMaxOutputTokens(4096);
    });
    
    expect(result.current.parameters.maxOutputTokens).toBe(4096);
  });

  it('generates correct headers', () => {
    const { result } = renderHook(() => useChatParameters());
    
    const headers = result.current.getHeaders();
    
    expect(headers).toEqual({
      "x-temperature": "0.7",
      "x-top-k": "40",
      "x-top-p": "0.95",
      "x-presence-penalty": "0",
      "x-frequency-penalty": "0",
      "x-max-output-tokens": "32000",
      "x-max-steps": "20",
    });
  });

  it('updates headers when parameters change', () => {
    const { result } = renderHook(() => useChatParameters());
    
    act(() => {
      result.current.handleParameterChange('temperature', 0.5);
      result.current.handleParameterChange('topK', 50);
    });
    
    const headers = result.current.getHeaders();
    
    expect(headers["x-temperature"]).toBe("0.5");
    expect(headers["x-top-k"]).toBe("50");
  });

  it('maintains parameter independence', () => {
    const { result } = renderHook(() => useChatParameters());
    
    act(() => {
      result.current.handleParameterChange('temperature', 0.3);
    });
    
    act(() => {
      result.current.handleParameterChange('topP', 0.8);
    });
    
    expect(result.current.parameters.temperature).toBe(0.3);
    expect(result.current.parameters.topP).toBe(0.8);
    expect(result.current.parameters.topK).toBe(40); // Unchanged
  });

  it('handles multiple rapid updates', () => {
    const { result } = renderHook(() => useChatParameters());
    
    act(() => {
      result.current.handleParameterChange('temperature', 0.1);
      result.current.handleParameterChange('temperature', 0.2);
      result.current.handleParameterChange('temperature', 0.3);
    });
    
    expect(result.current.parameters.temperature).toBe(0.3);
  });
});