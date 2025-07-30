/**
 * Keyboard shortcut display component that automatically detects OS
 */
import React, { useEffect, useState } from 'react';

interface KeyboardShortcutProps {
  shortcut: {
    key: string;
    ctrlOrCmd?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  className?: string;
}

export default function KeyboardShortcut({ shortcut, className = '' }: KeyboardShortcutProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if we're on Mac
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
             navigator.userAgent.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const modifierSymbols = {
    mac: {
      cmd: '⌘',
      shift: '⇧',
      alt: '⌥',
      ctrl: '⌃'
    },
    windows: {
      cmd: 'Ctrl',
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl'
    }
  };

  const symbols = isMac ? modifierSymbols.mac : modifierSymbols.windows;
  const parts: string[] = [];

  // Build the shortcut string
  if (shortcut.ctrlOrCmd) {
    parts.push(symbols.cmd);
  }
  if (shortcut.shift) {
    parts.push(symbols.shift);
  }
  if (shortcut.alt) {
    parts.push(symbols.alt);
  }
  
  // Add the main key
  parts.push(shortcut.key.toUpperCase());

  // Base styles that can be completely overridden
  const baseStyles = "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded font-mono";
  const defaultStyles = "bg-gradient-to-b from-gray-50 to-gray-100 text-gray-600 border border-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]";
  
  // If className starts with !, use only base styles, otherwise combine with defaults
  const finalClassName = className.startsWith('!') 
    ? `${baseStyles} ${className.substring(1)}` 
    : `${baseStyles} ${defaultStyles} ${className}`;

  return (
    <kbd className={finalClassName}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && !isMac && (
            <span className="text-[10px] opacity-70">+</span>
          )}
          <span>{part}</span>
        </React.Fragment>
      ))}
    </kbd>
  );
}