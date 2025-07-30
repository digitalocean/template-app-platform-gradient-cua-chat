/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add event listener on mount', () => {
    const shortcuts = [{ key: 'k', action: jest.fn() }];
    
    renderHook(() => useKeyboardShortcuts(shortcuts));
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const shortcuts = [{ key: 'k', action: jest.fn() }];
    
    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  describe('Keyboard event handling', () => {
    const dispatchKeyboardEvent = (key: string, options: Partial<KeyboardEventInit> = {}) => {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...options,
      });
      
      // Spy on preventDefault
      jest.spyOn(event, 'preventDefault');
      
      window.dispatchEvent(event);
      return event;
    };

    it('should trigger action for simple key press', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      const event = dispatchKeyboardEvent('k');
      
      expect(action).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not trigger action for different key', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      dispatchKeyboardEvent('j');
      
      expect(action).not.toHaveBeenCalled();
    });

    it('should handle Ctrl/Cmd modifier', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', ctrlOrCmd: true, action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      // Should not trigger without modifier
      dispatchKeyboardEvent('k');
      expect(action).not.toHaveBeenCalled();
      
      // Should trigger with Ctrl
      dispatchKeyboardEvent('k', { ctrlKey: true });
      expect(action).toHaveBeenCalledTimes(1);
      
      // Should trigger with Cmd (Meta)
      dispatchKeyboardEvent('k', { metaKey: true });
      expect(action).toHaveBeenCalledTimes(2);
    });

    it('should handle Shift modifier', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', shift: true, action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      // Should not trigger without Shift
      dispatchKeyboardEvent('k');
      expect(action).not.toHaveBeenCalled();
      
      // Should trigger with Shift
      dispatchKeyboardEvent('k', { shiftKey: true });
      expect(action).toHaveBeenCalled();
    });

    it('should handle Alt modifier', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', alt: true, action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      // Should not trigger without Alt
      dispatchKeyboardEvent('k');
      expect(action).not.toHaveBeenCalled();
      
      // Should trigger with Alt
      dispatchKeyboardEvent('k', { altKey: true });
      expect(action).toHaveBeenCalled();
    });

    it('should handle multiple modifiers', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', ctrlOrCmd: true, shift: true, alt: true, action }];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      // Should not trigger with partial modifiers
      dispatchKeyboardEvent('k', { ctrlKey: true });
      expect(action).not.toHaveBeenCalled();
      
      dispatchKeyboardEvent('k', { ctrlKey: true, shiftKey: true });
      expect(action).not.toHaveBeenCalled();
      
      // Should trigger with all modifiers
      dispatchKeyboardEvent('k', { ctrlKey: true, shiftKey: true, altKey: true });
      expect(action).toHaveBeenCalled();
    });

    it('should handle multiple shortcuts', () => {
      const action1 = jest.fn();
      const action2 = jest.fn();
      const shortcuts = [
        { key: 'k', action: action1 },
        { key: 'j', action: action2 },
      ];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      dispatchKeyboardEvent('k');
      expect(action1).toHaveBeenCalled();
      expect(action2).not.toHaveBeenCalled();
      
      action1.mockClear();
      
      dispatchKeyboardEvent('j');
      expect(action1).not.toHaveBeenCalled();
      expect(action2).toHaveBeenCalled();
    });

    it('should stop checking shortcuts after first match', () => {
      const action1 = jest.fn();
      const action2 = jest.fn();
      const shortcuts = [
        { key: 'k', action: action1 },
        { key: 'k', action: action2 }, // Same key
      ];
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      dispatchKeyboardEvent('k');
      
      expect(action1).toHaveBeenCalled();
      expect(action2).not.toHaveBeenCalled();
    });

    it('should not trigger when modifiers dont match exactly', () => {
      const action = jest.fn();
      const shortcuts = [{ key: 'k', action }]; // No modifiers required
      
      renderHook(() => useKeyboardShortcuts(shortcuts));
      
      // Should trigger without modifiers
      dispatchKeyboardEvent('k');
      expect(action).toHaveBeenCalledTimes(1);
      
      // Should not trigger with unexpected modifiers when not specified
      dispatchKeyboardEvent('k', { shiftKey: true });
      expect(action).toHaveBeenCalledTimes(1); // Still 1, not 2
      
      dispatchKeyboardEvent('k', { altKey: true });
      expect(action).toHaveBeenCalledTimes(1); // Still 1, not 3
    });
  });

  describe('Dependency changes', () => {
    it('should update event listener when shortcuts change', () => {
      const action1 = jest.fn();
      const action2 = jest.fn();
      
      const { rerender } = renderHook(
        ({ shortcuts }) => useKeyboardShortcuts(shortcuts),
        { initialProps: { shortcuts: [{ key: 'k', action: action1 }] } }
      );
      
      // Initial listener added
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(0);
      
      // Update shortcuts
      rerender({ shortcuts: [{ key: 'j', action: action2 }] });
      
      // Old listener removed, new one added
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });
});