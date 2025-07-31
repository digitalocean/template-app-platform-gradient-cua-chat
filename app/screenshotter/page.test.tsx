/**
 * Tests for the Screenshotter page
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScreenshotterPage from './page';

// Mock fetch
global.fetch = jest.fn();

describe('ScreenshotterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful devices fetch
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/devices') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            devices: [
              { value: 'none', label: 'No device emulation' },
              { value: 'iPhone 14', label: 'iPhone 14' },
              { value: 'iPad', label: 'iPad' },
            ]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Error Display', () => {
    it('should display simple error messages with red styling', async () => {
      render(<ScreenshotterPage />);
      
      // Mock failed screenshot request
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'Failed to take screenshot'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElement = screen.getByText('Failed to take screenshot');
        expect(errorElement).toBeInTheDocument();
        // Check that it's within the red error container
        const container = errorElement.closest('.bg-red-50');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('mt-2', 'bg-red-50', 'border', 'border-red-200', 'rounded-lg', 'p-3');
      });
    });

    it('should display detailed error messages with all fields', async () => {
      render(<ScreenshotterPage />);
      
      // Mock failed screenshot request with detailed error
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'Browser connection failed',
              details: 'Unable to connect to the browser service. Please try again later.',
              code: 'CONNECTION_FAILED'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Browser connection failed')).toBeInTheDocument();
        expect(screen.getByText(/Unable to connect to the browser service/)).toBeInTheDocument();
        expect(screen.getByText('CONNECTION_FAILED')).toBeInTheDocument();
      });
    });

    it('should display multi-line errors with proper formatting', async () => {
      render(<ScreenshotterPage />);
      
      // Mock failed screenshot request with multi-line error
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'Multiple errors occurred',
              details: 'Error 1: Connection timeout\nError 2: Invalid credentials\nError 3: Server unavailable',
              code: 'MULTIPLE_ERRORS'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Multiple errors occurred')).toBeInTheDocument();
        // Check that the multi-line details are displayed
        expect(screen.getByText(/Error 1: Connection timeout/)).toBeInTheDocument();
      });
    });

    it('should handle errors without details or code fields', async () => {
      render(<ScreenshotterPage />);
      
      // Mock failed screenshot request with only error message
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'Simple error message'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElement = screen.getByText('Simple error message');
        expect(errorElement).toBeInTheDocument();
        // Should not contain "Details:" or "Error Code:" when not provided
        expect(screen.queryByText(/Details:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Error Code:/)).not.toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      render(<ScreenshotterPage />);
      
      // Mock network error
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorElement = screen.getByText('Network error');
        expect(errorElement).toBeInTheDocument();
        // Check that it's within the red error container
        const container = errorElement.closest('.bg-red-50');
        expect(container).toBeInTheDocument();
      });
    });

    it('should clear error when user modifies the URL', async () => {
      render(<ScreenshotterPage />);
      
      // First, trigger an error
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'Test error'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Now change the URL
      fireEvent.change(urlInput, { target: { value: 'https://newsite.com' } });

      // Error should be cleared
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Successful Screenshot', () => {
    it('should display screenshot on success', async () => {
      render(<ScreenshotterPage />);
      
      const mockScreenshotData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      
      (fetch as jest.Mock).mockImplementationOnce((url) => {
        if (url === '/api/screenshot') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              screenshot: mockScreenshotData,
              metadata: {
                url: 'https://example.com',
                timestamp: new Date().toISOString(),
                resolution: '1920x1080',
                browser: 'chromium',
                fullPage: false,
                quality: 80
              }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ devices: [] }) });
      });

      const urlInput = screen.getByPlaceholderText('https://digitalocean.com');
      const button = screen.getByText('Take Screenshot');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        const screenshotImg = screen.getByAltText('Screenshot');
        expect(screenshotImg).toBeInTheDocument();
        expect(screenshotImg).toHaveAttribute('src', mockScreenshotData);
      });
    });
  });
});