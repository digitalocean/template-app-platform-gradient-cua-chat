/**
 * Tests for the screenshot API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';

// Mock playwright
jest.mock('playwright', () => ({
  chromium: {
    connect: jest.fn()
  },
  firefox: {
    connect: jest.fn()
  },
  webkit: {
    connect: jest.fn()
  },
  devices: {}
}));

const mockBrowser = {
  newPage: jest.fn(),
  close: jest.fn()
};

const mockPage = {
  setViewportSize: jest.fn(),
  goto: jest.fn(),
  screenshot: jest.fn(),
  close: jest.fn()
};

describe('Screenshot API Route', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Setup default mock implementations
    const { chromium, firefox, webkit } = require('playwright');
    chromium.connect.mockResolvedValue(mockBrowser);
    firefox.connect.mockResolvedValue(mockBrowser);
    webkit.connect.mockResolvedValue(mockBrowser);
    
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.screenshot.mockResolvedValue(Buffer.from('fake-screenshot-data'));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Error Handling', () => {
    it('should return sanitized error when browser connection fails', async () => {
      const { chromium } = require('playwright');
      chromium.connect.mockRejectedValueOnce(new Error('connect ECONNREFUSED ::1:8081'));

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'chromium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        error: 'Browser connection failed',
        details: 'Unable to connect to the browser service. Please try again later.',
        code: 'CONNECTION_FAILED'
      });
      
      // Verify console logging is minimal
      expect(consoleLogSpy).toHaveBeenCalledWith('Connecting to Playwright server for browser: chromium');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Browser connection failed:',
        'chromium',
        'connect ECONNREFUSED ::1:8081'
      );
    });

    it('should not expose environment variables in error messages', async () => {
      const originalEnv = process.env.PLAYWRIGHT_SERVER_ENDPOINT;
      process.env.PLAYWRIGHT_SERVER_ENDPOINT = 'http://secret-server:8081';

      const { chromium } = require('playwright');
      chromium.connect.mockRejectedValueOnce(new Error('Connection refused'));

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'chromium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      // Ensure the secret endpoint is not in the response
      expect(JSON.stringify(data)).not.toContain('secret-server');
      expect(data.details).toBe('Unable to connect to the browser service. Please try again later.');
      
      // Restore env
      process.env.PLAYWRIGHT_SERVER_ENDPOINT = originalEnv;
    });

    it('should handle different browser types in error logging', async () => {
      const { firefox } = require('playwright');
      firefox.connect.mockRejectedValueOnce(new Error('Firefox connection error'));

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'firefox'
        })
      });

      const response = await POST(request);
      await response.json();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Browser connection failed:',
        'firefox',
        'Firefox connection error'
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      const { webkit } = require('playwright');
      webkit.connect.mockRejectedValueOnce('String error');

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'webkit'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Browser connection failed:',
        'webkit',
        'Unknown error'
      );
    });

    it('should return 400 for missing URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          browser: 'chromium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('should return 400 for invalid URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'not-a-valid-url',
          browser: 'chromium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format');
    });

    it('should handle timeout errors', async () => {
      mockPage.goto.mockRejectedValueOnce(new Error('timeout 30000ms exceeded'));

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://slow-site.com',
          browser: 'chromium'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.error).toBe('Screenshot timeout');
      expect(data.details).toBe('The page took too long to load. Please try again with a faster-loading page.');
      expect(data.code).toBe('TIMEOUT');
    });

    it('should clean up browser on error', async () => {
      mockPage.screenshot.mockRejectedValueOnce(new Error('Screenshot failed'));

      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'chromium'
        })
      });

      await POST(request);

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('Successful Screenshots', () => {
    it('should successfully take a screenshot', async () => {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'chromium',
          width: 1920,
          height: 1080,
          quality: 80
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.screenshot).toMatch(/^data:image\/jpeg;base64,/);
      expect(data.metadata).toMatchObject({
        url: 'https://example.com',
        resolution: '1920x1080',
        browser: 'chromium',
        fullPage: false,
        quality: 80
      });
      
      expect(mockPage.setViewportSize).toHaveBeenCalledWith({ width: 1920, height: 1080 });
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        quality: 80,
        fullPage: false
      });
    });

    it('should log minimal information on success', async () => {
      const request = new NextRequest('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          browser: 'firefox'
        })
      });

      await POST(request);

      // Should only log the connection attempt, not the full endpoint
      expect(consoleLogSpy).toHaveBeenCalledWith('Connecting to Playwright server for browser: firefox');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });
});