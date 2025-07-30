import { NextResponse } from 'next/server';

export async function GET() {
  // Only return non-sensitive configuration
  // These URLs are internal and not sensitive
  const config = {
    playwrightServerEndpoint: process.env.PLAYWRIGHT_SERVER_ENDPOINT || 'http://localhost:8081',
    playwrightMcpEndpoint: process.env.PLAYWRIGHT_MCP_ENDPOINT || 'http://localhost:8080/mcp',
  };

  return NextResponse.json(config);
}