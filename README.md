# DigitalOcean Playwright MCP CUA Demo

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/digitalocean/template-app-platform-gradient-cua-chatdigitalocean/template-gradient-cua-chat/tree/main)

A Next.js application demonstrating DigitalOcean's AI platform capabilities, featuring:

- **Gradient AI Integration**: Chat with multiple LLM models powered by DigitalOcean's Gradient AI platform
- **Playwright Browser Automation**: Remote browser control through MCP (Model Context Protocol)
- **DigitalOcean Spaces**: Automatic file upload and optimization for media content
- **Interactive Web Tools**: Screenshot capture and browser automation capabilities

## Features

### Core Applications

#### 1. AI Chat with MCP Browser Automation

- **Multi-Model Support**: Access to various LLMs through DigitalOcean's Gradient AI
- **Browser Control**: AI can navigate websites, take screenshots, fill forms, and interact with web pages
- **Visual AI**: Support for vision capabilities - AI can see and understand screenshots
- **PDF Processing**: AI can read and process PDF documents
- **Media Support**: Display images, videos, audio, PDFs, and documents inline

#### 2. Screenshotter Tool

- **Multi-Browser Support**: Chromium, Firefox, Safari (WebKit), and Microsoft Edge
- **Device Emulation**: Simulate various devices (iPhones, iPads, Android devices)
- **Resolution Presets**: Common desktop and mobile resolutions
- **Full Page Screenshots**: Capture entire scrollable pages
- **High Quality Mode**: Toggle between compressed and high-quality screenshots

### User Interface

#### Chat Interface

- **Responsive Design**: Full-width messages with proper mobile support
- **Resizable Sidebar**: Drag to resize between 280px-600px
- **Syntax Highlighting**: Code blocks with VS Code Dark+ theme
- **Message Styling**:
  - User messages: Blue background (#3b82f6)
  - Assistant messages: Green background (#22c55e)
  - Tool results: Gray background with proper formatting
- **Collapsible Content**: Large outputs automatically collapse with expand/collapse controls

#### Advanced Features

- **Debug Mode**: Toggle to view raw message JSON for development
- **Model Parameters**: Adjustable temperature, max tokens, top P, and frequency penalty
- **Streaming Responses**: Real-time token streaming with visual indicators
- **Error Handling**: Graceful error display with retry capabilities

### Technical Features

- **Automatic File Upload**: Base64 content automatically uploaded to DigitalOcean Spaces
- **Token Optimization**: Replace large base64 strings with presigned URLs
- **Concurrent Processing**: Batch uploads with concurrency limits for performance
- **MCP Protocol Support**: Full implementation of Model Context Protocol for tool integration
- **WebSocket Transport**: Real-time communication with MCP servers
- **Keyboard Shortcuts**:
  - `Ctrl+K` / `Cmd+K`: Clear chat and start new conversation
  - OS-aware shortcut display (shows ⌘ on Mac, Ctrl on others)

## Architecture

### Services

1. **Next.js Web App** (Port 3000)
   - Main application with chat and screenshotter interfaces
   - Server-side API routes for AI and browser operations
   - React components with TypeScript

2. **Playwright Server** (Port 8081)
   - Headless browser instance management
   - WebSocket API for browser control
   - Supports Chromium, Firefox, WebKit, and Edge

3. **Playwright MCP Server** (Port 8080)
   - Model Context Protocol implementation
   - Bridges AI tools with browser automation
   - Provides screenshot, navigation, and interaction capabilities

### API Endpoints

- `/api/chat` - Main chat endpoint with streaming responses
- `/api/gradient-models` - Fetch available AI models
- `/api/screenshot` - Direct screenshot API
- `/api/devices` - Get device emulation profiles

## DigitalOcean Spaces Integration

The application uses DigitalOcean Spaces (S3-compatible object storage) to optimize token usage by automatically uploading base64-encoded files and replacing them with presigned URLs.

### How it works

1. **Automatic Detection**: The system detects base64 data in:
   - Message content (images and files)
   - Tool inputs (before execution)
   - Tool outputs (after execution)

2. **S3 Upload**: Base64 data is uploaded to S3 with the structure:

   ```
   /uploads/{uuid}/{original-filename}
   ```

3. **URL Replacement**: Base64 data is replaced with presigned URLs that expire after 7 days

4. **Supported Formats**: All file types are supported, including:
   - Images (PNG, JPEG, GIF, WebP, SVG)
   - Videos (MP4, WebM)
   - Audio (MP3, WAV, OGG)
   - Documents (PDF, JSON, TXT, HTML, CSS, JS)

### Performance Optimizations

To prevent UI blocking during heavy operations:

- **Concurrent Uploads**: Multiple files are uploaded in parallel using Promise.all
- **Batching with Concurrency Limits**: Uploads are processed in batches of 3 to prevent overwhelming the system
- **Non-blocking Operations**: All S3 uploads happen asynchronously without blocking the main thread

### Supported File Types

- **Images**: PNG, JPEG, GIF, WebP, SVG
- **Videos**: MP4, WebM
- **Audio**: MP3, WAV, OGG  
- **Documents**: PDF, JSON, TXT, HTML, CSS, JS
- **Binary**: Any other file type

### Performance Features

- Concurrent uploads with batching (max 10 simultaneous)
- Non-blocking async operations
- 7-day presigned URL expiration
- Automatic MIME type detection

## Getting Started

### Prerequisites

- Node.js 22.14.0 or higher (< 23)
- Yarn 1.22.22
- DigitalOcean account with:
  - Gradient AI access
  - Spaces bucket created
  - API credentials

### Local Development

1. **Clone and install**:

   ```bash
   git clone <repository-url>
   cd template-app-platform-playwright-mcp-cua
   yarn install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env.local
   ```

3. **Update `.env.local`** with your credentials:
   - Get Gradient API key: <https://cloud.digitalocean.com/ai-ml/inference>
   - Create Spaces bucket: <https://cloud.digitalocean.com/spaces>
   - Generate Spaces access keys: <https://cloud.digitalocean.com/account/api/spaces>

4. **Start Playwright servers** (in separate terminals):

   ```bash
   # Terminal 1: Playwright Server
   docker run -p 8081:8081 mcr.microsoft.com/playwright:v1.54.1 \
     npx playwright run-server --port 8081 --host 0.0.0.0
   
   # Terminal 2: Playwright MCP Server  
   docker run -p 8080:8080 -v $(pwd)/playwright-config.json:/app/config.json \
     mcr.microsoft.com/playwright/mcp:v0.0.32 \
     node cli.js --config /app/config.json --host 0.0.0.0 --port 8080
   ```

5. **Start the app**:

   ```bash
   yarn dev
   ```

6. **Access the application**:
   - Homepage: <http://localhost:3000>
   - Chat: <http://localhost:3000/chat>
   - Screenshotter: <http://localhost:3000/screenshotter>

## Deployment on DigitalOcean App Platform

### App Structure

The application consists of three services that need to be deployed:

1. **Web App** (Next.js)
2. **Playwright Server** (Browser automation)
3. **Playwright MCP** (MCP protocol server)

### Deployment Steps

1. **Prepare Docker images**:
   - Web app uses standard Node.js buildpack
   - Playwright services use provided Dockerfiles

2. **Configure App Platform**:
   - Create a new app with 3 components
   - Set up internal networking between services
   - Configure environment variables

3. **Environment Variables**:

   ```env
   # For production deployment
   PLAYWRIGHT_SERVER_ENDPOINT=http://playwright-server:8081
   PLAYWRIGHT_MCP_ENDPOINT=http://playwright-mcp:8080/mcp
   ```

### Service Configuration

#### Web Component

- **Type**: Web Service
- **Build**: Node.js buildpack
- **Run Command**: `yarn start`
- **HTTP Port**: 3000
- **Routes**: `/`

#### Playwright Server Component  

- **Type**: Worker
- **Dockerfile**: `Dockerfile.playwright`
- **Internal Port**: 8081

#### Playwright MCP Component

- **Type**: Worker  
- **Dockerfile**: `Dockerfile.mcp`
- **Internal Port**: 8080

## Project Structure

```
├── app/
│   ├── api/               # API routes
│   │   ├── chat/         # Main chat endpoint
│   │   ├── gradient-models/ # Model listing
│   │   ├── screenshot/   # Screenshot API
│   │   └── devices/      # Device profiles
│   ├── chat/             # Chat interface
│   ├── screenshotter/    # Screenshot tool
│   └── page.tsx          # Homepage
├── components/
│   ├── chat/             # Chat UI components
│   │   ├── ChatSidebar.tsx
│   │   ├── Message.tsx
│   │   └── MessagesArea.tsx
│   └── media-renderers/  # Media display components
│       ├── MediaRenderer.tsx  # Main router
│       ├── PDFRenderer.tsx    # PDF viewer
│       └── DocumentRenderer.tsx # Documents
├── lib/
│   ├── mcp-transport.ts  # MCP WebSocket client
│   ├── tool-handlers.tsx # Tool result rendering
│   └── s3-utils.ts       # Spaces upload logic
├── hooks/                # React hooks
├── Dockerfile.mcp        # MCP server image
└── Dockerfile.playwright # Browser server image
```

## Development

### Available Scripts

```bash
# Development with Turbopack
yarn dev

# Production build
yarn build
yarn start

# Testing
yarn test          # Run all tests
yarn test:watch    # Watch mode
yarn test:coverage # Coverage report

# Linting
yarn lint
```

### Testing

The project includes comprehensive test coverage:

- Unit tests for components
- API route tests
- Hook tests
- Utility function tests

Run `yarn test:coverage` to see the full coverage report.

## Troubleshooting

### Common Issues

1. **"Cannot connect to Playwright server"**
   - Ensure both Playwright containers are running
   - Check ports 8080 and 8081 are not in use
   - Verify environment variables are set correctly

2. **"Gradient API error"**
   - Verify your API key is correct
   - Check you have access to Gradient AI
   - Ensure you're not exceeding rate limits

3. **"Spaces upload failed"**
   - Verify bucket exists and is accessible
   - Check access keys have write permissions
   - Ensure bucket name is globally unique

4. **"Screenshot timeout"**
   - Some sites may block automated browsers
   - Try different browser options
   - Check if the site requires authentication

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This is a demo application provided by DigitalOcean. See LICENSE for details.
