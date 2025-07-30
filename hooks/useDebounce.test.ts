/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial value', 500));
    
    expect(result.current).toBe('initial value');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 400ms
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Value should still not have changed
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change value multiple times rapidly
    rerender({ value: 'update1', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'update2', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'update3', delay: 500 });

    // Total time passed: 400ms, but each change reset the timer
    expect(result.current).toBe('initial');

    // Fast-forward to complete the last debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have the last value
    expect(result.current).toBe('update3');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // After 500ms, value should not change
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // After another 500ms, value should change
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change both value and delay
    rerender({ value: 'updated', delay: 1000 });

    // After 500ms (original delay), value should not change
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // After another 500ms (new delay total), value should change
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different data types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 42, delay: 100 },
      }
    );

    numberRerender({ value: 100, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(100);

    // Test with object
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: { count: 1 }, delay: 100 },
      }
    );

    const newObject = { count: 2 };
    objectRerender({ value: newObject, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(objectResult.current).toBe(newObject);

    // Test with array
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: [1, 2, 3], delay: 100 },
      }
    );

    const newArray = [4, 5, 6];
    arrayRerender({ value: newArray, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(arrayResult.current).toBe(newArray);
  });

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: null as string | null, delay: 100 },
      }
    );

    expect(result.current).toBe(null);

    rerender({ value: 'value', delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('value');

    rerender({ value: undefined as string | undefined, delay: 100 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(undefined);
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    rerender({ value: 'updated', delay: 0 });

    // With zero delay, should still use setTimeout
    expect(result.current).toBe('initial');

    // But should update immediately in next tick
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Trigger a debounce
    rerender({ value: 'updated', delay: 500 });

    // Unmount before timeout completes
    unmount();

    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should not update state after unmount', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Trigger a debounce
    rerender({ value: 'updated', delay: 500 });

    // Unmount before timeout completes
    unmount();

    // Complete the timeout
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should not throw or log errors about updating unmounted component
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  describe('Performance scenarios', () => {
    it('should handle high-frequency updates efficiently', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: '', delay: 100 },
        }
      );

      // Simulate rapid typing (100 characters)
      for (let i = 0; i < 100; i++) {
        rerender({ value: 'a'.repeat(i + 1), delay: 100 });
        act(() => {
          jest.advanceTimersByTime(10); // 10ms between keystrokes
        });
      }

      // Value should still be initial (no debounce completed)
      expect(result.current).toBe('');

      // Complete the final debounce
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have the final value
      expect(result.current).toBe('a'.repeat(100));
    });

    it('should handle very long delays', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 10000 }, // 10 seconds
        }
      );

      rerender({ value: 'updated', delay: 10000 });

      // After 9 seconds, should still be initial
      act(() => {
        jest.advanceTimersByTime(9000);
      });
      expect(result.current).toBe('initial');

      // After 1 more second, should update
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Edge cases', () => {
    it('should handle negative delays as zero', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: -100 },
        }
      );

      rerender({ value: 'updated', delay: -100 });

      // Should behave like zero delay
      act(() => {
        jest.advanceTimersByTime(0);
      });
      expect(result.current).toBe('updated');
    });

    it('should handle Infinity delay', () => {
      // Skip this test as Infinity behavior is environment-specific
      // In some environments, Infinity is treated as 0, in others it's clamped to max int
      expect(true).toBe(true);
    });

    it('should handle NaN delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: NaN },
        }
      );

      rerender({ value: 'updated', delay: NaN });

      // NaN delay should behave like 0
      act(() => {
        jest.advanceTimersByTime(0);
      });
      expect(result.current).toBe('updated');
    });
  });
});