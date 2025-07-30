/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import KeyboardShortcut from './KeyboardShortcut';

describe('KeyboardShortcut', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset navigator mock before each test
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('Mac OS detection', () => {
    it('should display Mac symbols when on Mac', () => {
      Object.defineProperty(global.navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      render(<KeyboardShortcut shortcut={{ key: 'k', ctrlOrCmd: true }} />);
      
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('should detect Mac from userAgent if platform is not Mac', () => {
      Object.defineProperty(global.navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
      });

      render(<KeyboardShortcut shortcut={{ key: 'k', ctrlOrCmd: true }} />);
      
      expect(screen.getByText('⌘')).toBeInTheDocument();
    });
  });

  describe('Windows/Linux display', () => {
    it('should display Windows notation when not on Mac', () => {
      Object.defineProperty(global.navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      });

      render(<KeyboardShortcut shortcut={{ key: 'k', ctrlOrCmd: true }} />);
      
      expect(screen.getByText(/Ctrl/)).toBeInTheDocument();
      expect(screen.getByText(/\+/)).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });
  });

  describe('Modifier combinations', () => {
    it('should display all modifiers on Mac', () => {
      Object.defineProperty(global.navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      render(
        <KeyboardShortcut 
          shortcut={{ 
            key: 's', 
            ctrlOrCmd: true, 
            shift: true, 
            alt: true 
          }} 
        />
      );
      
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('⇧')).toBeInTheDocument();
      expect(screen.getByText('⌥')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('should display all modifiers on Windows', () => {
      Object.defineProperty(global.navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      render(
        <KeyboardShortcut 
          shortcut={{ 
            key: 's', 
            ctrlOrCmd: true, 
            shift: true, 
            alt: true 
          }} 
        />
      );
      
      expect(screen.getByText(/Ctrl/)).toBeInTheDocument();
      expect(screen.getByText(/Shift/)).toBeInTheDocument();
      expect(screen.getByText(/Alt/)).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      // The + symbols are within the same spans as the modifier names
      const container = screen.getByText(/Ctrl/).parentElement;
      expect(container?.textContent).toContain('Ctrl+Shift+Alt+S');
    });
  });

  describe('Key display', () => {
    it('should uppercase single letter keys', () => {
      render(<KeyboardShortcut shortcut={{ key: 'a' }} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should handle special keys', () => {
      render(<KeyboardShortcut shortcut={{ key: 'Enter' }} />);
      
      expect(screen.getByText('ENTER')).toBeInTheDocument();
    });

    it('should handle number keys', () => {
      render(<KeyboardShortcut shortcut={{ key: '1' }} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply default classes', () => {
      const { container } = render(<KeyboardShortcut shortcut={{ key: 'k' }} />);
      const kbd = container.querySelector('kbd');
      
      expect(kbd).toHaveClass('inline-flex', 'items-center', 'font-mono');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <KeyboardShortcut 
          shortcut={{ key: 'k' }} 
          className="bg-blue-500 text-white"
        />
      );
      const kbd = container.querySelector('kbd');
      
      expect(kbd).toHaveClass('bg-blue-500', 'text-white');
    });
  });

  describe('Simple shortcuts', () => {
    it('should display single key without modifiers', () => {
      render(<KeyboardShortcut shortcut={{ key: 'Escape' }} />);
      
      expect(screen.getByText('ESCAPE')).toBeInTheDocument();
      expect(screen.queryByText('⌘')).not.toBeInTheDocument();
      expect(screen.queryByText('Ctrl')).not.toBeInTheDocument();
    });
  });
});