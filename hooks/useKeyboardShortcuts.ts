/**
 * Custom hook for keyboard shortcuts
 */
import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrCmdPressed = shortcut.ctrlOrCmd ? (e.ctrlKey || e.metaKey) : true;
        const shiftPressed = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altPressed = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key === shortcut.key &&
          ctrlOrCmdPressed &&
          shiftPressed &&
          altPressed
        ) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}