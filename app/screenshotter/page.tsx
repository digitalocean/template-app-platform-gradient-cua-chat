"use client";

import { useState, useEffect } from "react";
import { CameraIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// Browser options
const BROWSER_OPTIONS = [
  { value: "chromium", label: "Chromium" },
  { value: "firefox", label: "Firefox" },
  { value: "webkit", label: "Safari (WebKit)" },
  { value: "msedge", label: "Microsoft Edge" },
];

// Resolution presets
const RESOLUTION_PRESETS = [
  { value: "1920x1080", label: "Full HD (1920x1080)" },
  { value: "1366x768", label: "Laptop (1366x768)" },
  { value: "1440x900", label: "MacBook (1440x900)" },
  { value: "1280x720", label: "HD (1280x720)" },
  { value: "375x667", label: "iPhone 8 (375x667)" },
  { value: "390x844", label: "iPhone 14 (390x844)" },
  { value: "360x800", label: "Android (360x800)" },
  { value: "768x1024", label: "iPad (768x1024)" },
];

// Device interface
interface Device {
  value: string;
  label: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export default function ScreenshotterPage() {
  const [url, setUrl] = useState("https://digitalocean.com");
  const [browser, setBrowser] = useState("chromium");
  const [resolution, setResolution] = useState("1920x1080");
  const [device, setDevice] = useState("none");
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [fullPage, setFullPage] = useState(false);
  const [highQuality, setHighQuality] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Fetch devices from API
  useEffect(() => {
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        setDeviceList(data.devices || []);
        setDevicesLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load devices:", err);
        setDevicesLoading(false);
        // Fallback to a basic list if API fails
        setDeviceList([
          { value: "none", label: "No device emulation" },
          { value: "iPhone 14", label: "iPhone 14" },
          { value: "iPhone SE", label: "iPhone SE" },
          { value: "iPad", label: "iPad" },
          { value: "Pixel 7", label: "Pixel 7" },
        ]);
      });
  }, []);

  const handleScreenshot = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);
    setScreenshot(null);

    try {
      // Parse resolution
      const [width, height] = resolution.split("x").map(Number);

      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          browser,
          width,
          height,
          device: device !== "none" ? device : undefined,
          fullPage,
          quality: highQuality ? 100 : 80,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to take screenshot");
      }

      const data = await response.json();
      setScreenshot(data.screenshot);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!screenshot) return;

    const link = document.createElement("a");
    link.href = screenshot;
    link.download = `screenshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="py-8 px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Screenshot Tool</h1>
          <p className="text-gray-600 mt-2">
            Capture screenshots of any website using Playwright server
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website URL
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder="https://digitalocean.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={handleScreenshot}
                  disabled={loading || !url}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Taking Screenshot...
                    </>
                  ) : (
                    <>
                      <CameraIcon className="h-5 w-5" />
                      Take Screenshot
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="mt-2">
                  {(() => {
                    // Check if the error contains JSON
                    try {
                      // Try to parse as JSON first
                      const parsed = JSON.parse(error);
                      return (
                        <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs">
                          <code>{JSON.stringify(parsed, null, 2)}</code>
                        </pre>
                      );
                    } catch {
                      // If not JSON, check if it looks like a code/technical error
                      if (
                        error.includes("{") ||
                        error.includes("Error:") ||
                        error.length > 100
                      ) {
                        return (
                          <pre className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto text-xs">
                            <code>{error}</code>
                          </pre>
                        );
                      }
                      // Otherwise, display as regular text
                      return (
                        <div className="text-sm text-red-600">{error}</div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Screenshot Options</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="browser"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Browser
                  </label>
                  <select
                    id="browser"
                    value={browser}
                    onChange={(e) => setBrowser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {BROWSER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="resolution"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Resolution
                  </label>
                  <select
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {RESOLUTION_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Device emulation */}
              <div className="mt-4">
                <label
                  htmlFor="device"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Device Emulation
                </label>
                <select
                  id="device"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={devicesLoading}
                >
                  {devicesLoading ? (
                    <option>Loading devices...</option>
                  ) : (
                    deviceList.map((deviceOption) => (
                      <option key={deviceOption.value} value={deviceOption.value}>
                        {deviceOption.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="mt-4 space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fullPage}
                    onChange={(e) => setFullPage(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Capture full page (including scrolled content)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={highQuality}
                    onChange={(e) => setHighQuality(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    High quality (100% JPEG quality)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot Preview */}
        {screenshot && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Screenshot Result
              </h2>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download
              </button>
            </div>
            <div 
              className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setShowLightbox(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot}
                alt="Screenshot"
                className="w-full h-auto hover:opacity-95 transition-opacity"
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <div>
                <p className="font-medium">Creating browser session...</p>
                <p className="text-sm">This may take a few seconds</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Lightbox */}
      {showLightbox && screenshot && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-full max-h-full overflow-auto">
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Download button in lightbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute top-4 left-4 px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download
            </button>
            
            {/* Full size image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshot}
              alt="Screenshot"
              className="max-w-full max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
