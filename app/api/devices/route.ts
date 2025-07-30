import { NextResponse } from 'next/server';
import { devices } from 'playwright';

export async function GET() {
  try {
    // Get all device descriptors from Playwright
    const deviceList = Object.entries(devices).map(([name, descriptor]) => ({
      value: name,
      label: name,
      // Include some device properties for reference
      viewport: descriptor.viewport,
      userAgent: descriptor.userAgent,
      isMobile: descriptor.isMobile,
      hasTouch: descriptor.hasTouch,
    }));

    // Sort devices alphabetically
    deviceList.sort((a, b) => a.label.localeCompare(b.label));
    
    // Add "No device emulation" as the first option
    deviceList.unshift({
      value: 'none',
      label: 'No device emulation',
      isMobile: false,
      hasTouch: false,
    } as typeof deviceList[0]);

    return NextResponse.json({ devices: deviceList });
  } catch (error) {
    console.error('Failed to get devices:', error);
    return NextResponse.json(
      { error: 'Failed to get device list' },
      { status: 500 }
    );
  }
}