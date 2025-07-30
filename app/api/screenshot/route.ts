import { NextRequest, NextResponse } from 'next/server';
// We intentionally are using playwright directly here
import { chromium, firefox, webkit, devices } from 'playwright';

/**
 * Capture a screenshot of a given URL using a remote browser session
 * @summary Capture screenshot of a web page
 * @tag Screenshot
 * @body {object} - Request body containing url (string, required)
 * @response 200 - Screenshot captured successfully
 * @response 400 - Missing or invalid URL
 * @response 401 - Authentication required
 * @response 503 - Browser connection failed
 * @response 504 - Screenshot timeout
 * @response 500 - Internal server error during screenshot capture
 * 
 * Note: Browser channels for chromium-based browsers:
 * - chromium: Default Chromium browser
 * - msedge: Microsoft Edge (channel: 'msedge')
 * - chrome: Google Chrome (channel: 'chrome')
 * - chrome-beta: Chrome Beta (channel: 'chrome-beta')
 * 
 * The remote Playwright server should handle these channels when launching browsers.
 */
export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body = await request.json();
    const {
      url,
      browser: browserType = 'chromium',
      width = 1920,
      height = 1080,
      device,
      fullPage = false,
      quality = 80
    } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate browser type
    if (!['chromium', 'firefox', 'webkit', 'msedge'].includes(browserType)) {
      return NextResponse.json(
        { error: 'Invalid browser type. Must be chromium, firefox, webkit, or msedge' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Connect directly to the hardcoded remote Playwright instance
    const playwrightEndpoint =process.env.PLAYWRIGHT_SERVER_ENDPOINT || 'http://localhost:8081';

    // Connect to the remote browser based on browser type
    // Note: For remote connections, the browser type must be configured on the server side
    // The server should be running with the appropriate browser and channel
    const browserEngine = browserType === 'firefox' ? firefox :
      browserType === 'webkit' ? webkit :
        chromium;

    try {
      console.log(`Connecting to Playwright server at ${playwrightEndpoint} for browser: ${browserType}`);
      const browserSpecificOptions = {
        channel: browserType === 'msedge' ? 'msedge' :
          browserType === 'chrome' ? 'chrome' :
            browserType === 'chrome-beta' ? 'chrome-beta' : undefined
      };
      browser = await browserEngine.connect(playwrightEndpoint, {
        timeout: 30000, // 30 second timeout,
        ...browserSpecificOptions
      });
    } catch (connectError) {
      console.error('Failed to connect to Playwright server:', connectError);
      return NextResponse.json(
        {
          error: 'Browser connection failed',
          details: `Unable to connect to the Playwright server at ${playwrightEndpoint}. The server is returning: "${connectError instanceof Error ? connectError.message : String(connectError)}". Please ensure a Playwright WebSocket server is running.`,
          code: 'CONNECTION_FAILED',
          endpoint: playwrightEndpoint,
          browserType: browserType,
          hint: 'The server should be started with: npx playwright run-server --port 8081'
        },
        { status: 503 }
      );
    }

    // Step 4: Take the screenshot
    const page = await browser.newPage();

    // Apply device emulation if specified
    if (device && device !== 'none') {
      // Get device descriptor from Playwright
      const deviceDescriptor = devices[device];

      if (deviceDescriptor) {
        // Create context with device emulation
        const context = await browser.newContext(deviceDescriptor);
        const emulatedPage = await context.newPage();
        await emulatedPage.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Take screenshot with emulated device
        const screenshotBuffer = await emulatedPage.screenshot({
          type: 'jpeg',
          quality: quality,
          fullPage: fullPage,
        });

        await emulatedPage.close();
        await context.close();

        // Convert to base64
        const base64Screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

        return NextResponse.json({
          success: true,
          screenshot: base64Screenshot,
          metadata: {
            url,
            timestamp: new Date().toISOString(),
            resolution: `Device: ${device}`,
            browser: browserType,
            fullPage,
            quality,
          },
        });
      }
    }

    // Set viewport to specified resolution for non-device screenshots
    await page.setViewportSize({ width, height });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: quality,
      fullPage: fullPage,
    });

    // Convert to base64
    const base64Screenshot = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

    // Clean up
    await page.close();

    return NextResponse.json({
      success: true,
      screenshot: base64Screenshot,
      metadata: {
        url,
        timestamp: new Date().toISOString(),
        resolution: device && device !== 'none' ? `Device: ${device}` : `${width}x${height}`,
        browser: browserType,
        fullPage,
        quality,
      },
    });

  } catch (error) {

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Screenshot timeout',
            details: 'The page took too long to load. Please try again with a faster-loading page.',
            code: 'TIMEOUT'
          },
          { status: 504 }
        );
      }

      if (error.message.includes('connect')) {
        return NextResponse.json(
          {
            error: 'Browser connection failed',
            details: 'Unable to connect to the browser instance. The instance may be unavailable.',
            code: 'CONNECTION_FAILED',
            message: error.message
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Screenshot capture failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred while capturing the screenshot.',
        code: 'SCREENSHOT_FAILED'
      },
      { status: 500 }
    );
  } finally {
    // Clean up resources
    try {
      if (browser) {
        await browser.close();
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}
