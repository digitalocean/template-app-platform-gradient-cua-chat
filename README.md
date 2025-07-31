# DigitalOcean Gradient + Playwright MCP CUA Template

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/digitalocean/template-app-platform-gradient-cua-chat/tree/main)

A Next.js application demonstrating DigitalOcean's AI platform capabilities, featuring:

- **Gradient Integration**: Chat with multiple LLM models powered by DigitalOcean's Gradient platform
- **Playwright Browser Automation**: Remote browser control through MCP (Model Context Protocol)
- **DigitalOcean Spaces**: Automatic file upload and optimization for media content
- **Interactive Web Tools**: Screenshot capture and browser automation capabilities

## Features

### Core Applications

#### 1. AI Chat with MCP Browser Automation

- **Multi-Model Support**: Access to various LLMs through DigitalOcean's Gradient (requires models with tool support - see Limitations section)
- **Browser Control**: AI can navigate websites, take screenshots, fill forms, and interact with web pages (OpenAI models recommended)
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
- **Collapsible Content**: Large outputs automatically collapse with expand/collapse controls

#### Advanced Features

- **Debug Mode**: Toggle to view raw message JSON for development
- **Model Parameters**: Adjustable temperature, max tokens, top P, and frequency penalty
- **Streaming Responses**: Real-time token streaming with visual indicators
- **Error Handling**: Graceful error display with retry capabilities

### Technical Features

- **Token Optimization**: Replace large base64 strings with presigned URLs,  automatically uploaded to DigitalOcean Spaces
- **Concurrent Processing**: Batch uploads with concurrency limits for performance
- **MCP Protocol Support**: Full implementation of Model Context Protocol for tool integration
- **Streamable HTTP Transport**: Real-time communication with MCP servers
- **Keyboard Shortcuts**:
  - OS-aware shortcut display (shows ⌘ on Mac, Ctrl on others): Clear chat and start new conversation
  -

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

## Limitations and Requirements

### Model Requirements

The chat interface with browser automation requires LLM models that support **function calling/tools**. Not all models available through Gradient support this feature.

#### Supported Models

The following models have been tested and confirmed to work with browser automation tools:

| Model ID | Provider | Description | Performance |
|----------|----------|-------------|-------------|
| `openai-gpt-41` | OpenAI | GPT-4 Optimized | Best overall performance |
| `openai-gpt-4o` | OpenAI | GPT-4 Optimized | Better than mini, but not as good as 41 |
| `openai-gpt-4o-mini` | OpenAI | GPT-4 Optimized Mini | Cost-effective, fast |
| `alibaba-qwen3-32b` | Alibaba | Qwen 3 32B | Excellent open model |
| `deepseek-r1-distill-llama-70b` | DeepSeek | R1 Distilled Llama 70B | Powerful open model |
| `llama3.3-70b-instruct` | Meta | Llama 3.3 70B Instruct | High-quality open model |
| `mistral-nemo-instruct-2407` | Mistral | Nemo Instruct 2407 | Efficient, good tool support |

**Note**: Other models that support function calling may also work but have not been fully tested.

#### Currently Unsupported Models

The following models have limitations with browser automation in this template:

- **Anthropic Claude models** (Claude 3 Opus, Sonnet, Haiku) - While these models do support tools, the current implementation uses the [AI SDK's OpenAI-compatible provider](https://v5.ai-sdk.dev/providers/openai-compatible-providers#openai-compatible-providers) which doesn't properly support tool calling for Anthropic models through Gradient
- Most open-source models without function calling support
- Text-only models without tool capabilities

### Feature Limitations

1. **Browser automation** only works with tool-supporting models
2. **Without tool support**, the chat will function as a standard LLM chat without browser control
3. **Screenshot tool** requires Playwright servers to be running and accessible
4. **File uploads** require configured DigitalOcean Spaces access
5. **Browser sessions** are not maintained between messages - each browser action starts fresh (AI SDK limitation)

### Technical Notes

- This template uses the [AI SDK](https://sdk.vercel.ai/) with an OpenAI-compatible provider to communicate with Gradient
- Tool calling implementation follows OpenAI's function calling format
- The [Playwright MCP server](https://github.com/microsoft/playwright-mcp) supports sessions for maintaining browser state across requests, but the [AI SDK doesn't yet support MCP session management](https://v5.ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#mcp-tools)
- Future updates may add:
  - Native support for Anthropic models once the AI SDK's provider properly supports their tool format through Gradient
  - Session support once the AI SDK implements MCP session management

## DigitalOcean Spaces Integration

The application uses DigitalOcean Spaces (S3-compatible object storage) to optimize token usage by automatically uploading base64-encoded files and replacing them with presigned URLs.

### How it works

1. **Automatic Detection**: The system detects base64 data in:
   - Message content (images and files)
   - Tool inputs (before execution)
   - Tool outputs (after execution)

2. **S3 Upload**: Base64 data is uploaded to S3 with the structure:

   ```bash
   /uploads/{uuid}/{original-filename}
   ```

3. **URL Replacement**: Base64 data is replaced with presigned URLs that expire after 7 days

4. **Supported Formats**: Most file types are supported, including:
   - Images (PNG, JPEG, GIF, WebP, SVG)
   - Videos (MP4, WebM)
   - Audio (MP3, WAV, OGG)
   - Documents (PDF, JSON, TXT, HTML, CSS, JS)

### Performance Features

- Concurrent uploads with batching (max 10 simultaneous)
- Non-blocking async operations
- 7-day presigned URL expiration
- Automatic MIME type detection

## Getting Started

### Prerequisites

- Node.js 22.14.0 or higher (< 23)
- Yarn 1.22.22
- Docker and Docker Compose (for running Playwright servers)
- DigitalOcean account with:
  - [Gradient Serverless Inference access](https://docs.digitalocean.com/products/gradientai-platform/how-to/use-serverless-inference/#create)
  - [Spaces bucket created](https://docs.digitalocean.com/products/spaces/how-to/create/)
  - [Spaces API credentials](https://cloud.digitalocean.com/account/api/spaces)

### Local Development

1. **Clone and install**:

   ```bash
   git clone https://github.com/digitalocean/template-app-platform-gradient-cua-chat
   cd template-app-platform-playwright-mcp-cua
   yarn install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env.local
   ```

3. **Update `.env.local`** with your credentials (see Environment Variables section below for details)

4. **Start Playwright servers**:

   **Using Docker Compose Locally (recommended):**

   ```bash
   docker-compose up -d
   ```

5. **Start the app**:

   ```bash
   yarn dev
   ```

6. **Access the application**:
   - Homepage: <http://localhost:3000>
   - Chat: <http://localhost:3000/chat>
   - Screenshotter: <http://localhost:3000/screenshotter>

7. **Stop services** (when using Docker Compose):

   ```bash
   docker-compose down
   ```

## Environment Variables

The application requires several environment variables for different services. Copy `.env.example` to `.env.local` and configure:

### Base Configuration

```bash
# Base URL for the Next.js application
# Set to your deployed app URL in production
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Gradient Configuration

[Gradient](https://docs.digitalocean.com/products/gradientai-platform/) is DigitalOcean's AI platform for running LLMs.

```bash
# Get your API key from: https://cloud.digitalocean.com/ai-ml/inference
# How to create: https://docs.digitalocean.com/products/gradientai-platform/how-to/use-serverless-inference/#create
GRADIENT_API_KEY=your_gradient_api_key_here

# Gradient inference endpoint (typically doesn't need changes)
GRADIENT_BASE_URL="https://inference.do-ai.run/v1"
```

### DigitalOcean Spaces Configuration

[Spaces](https://docs.digitalocean.com/products/spaces/) is DigitalOcean's S3-compatible object storage for uploading chat media.

```bash
# Create a Space: https://docs.digitalocean.com/products/spaces/how-to/create/
# Available regions: nyc3, ams3, sfo3, sgp1, fra1, syd1
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3

# Generate keys: https://cloud.digitalocean.com/account/api/spaces
DO_SPACES_ACCESS_KEY=your_spaces_access_key_here
DO_SPACES_SECRET_KEY=your_spaces_secret_key_here

# Your Space name (must be globally unique)
DO_SPACES_BUCKET=your_bucket_name_here
```

### Playwright MCP Server Configuration

The Playwright MCP server enables browser automation in chat:

#### For Local Development

```bash
# Default ports for local services (these are the defaults if not specified)
PLAYWRIGHT_SERVER_ENDPOINT=http://localhost:8081
PLAYWRIGHT_MCP_ENDPOINT=http://localhost:8080/mcp
```

**Note**: If these environment variables are not set, the application will automatically use the local development defaults shown above.

#### For Production (App Platform)

Option 1 - External Access (through public internet):

```bash
PLAYWRIGHT_SERVER_ENDPOINT=https://my-app-name.ondigitalocean.app/playwright-server
PLAYWRIGHT_MCP_ENDPOINT=https://my-app-name.ondigitalocean.app/playwright-mcp/mcp
```

Option 2 - Internal App Network Access (recommended for performance & security):

```bash
PLAYWRIGHT_SERVER_ENDPOINT=http://playwright-server:8081
PLAYWRIGHT_MCP_ENDPOINT=http://playwright-mcp:8080/mcp
```

## Deployment on DigitalOcean App Platform

### Prerequisites

1. DigitalOcean account with billing enabled
2. GitHub account with the repository forked
3. The following DigitalOcean services configured:
   - [Gradient Serverless Inference access](https://docs.digitalocean.com/products/gradientai-platform/how-to/use-serverless-inference/#create)
   - [Spaces bucket created](https://docs.digitalocean.com/products/spaces/how-to/create/)
   - [API tokens generated](https://cloud.digitalocean.com/account/api/spaces)

### Quick Deploy

Click the button above or use this link:

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/digitalocean/template-app-platform-gradient-cua-chat/tree/main)

### Manual Deployment Steps

#### 1. Fork the Repository

Fork this repository to your GitHub account so App Platform can access it.

#### 2. Create a New App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as your source
4. Select your forked repository

#### 3. Configure App Spec

You can either:

- Use the UI to configure components
- Upload the provided `.do/app.yaml` spec file

The app requires 3 components:

- **Web Service**: The Next.js application
- **Worker 1**: Playwright browser server
- **Worker 2**: Playwright MCP server

#### 4. Set Environment Variables

Configure these environment variables in the App Platform settings (see Environment Variables section above for details):

**Required Secrets:**

- `GRADIENT_API_KEY` - Your Gradient API key
- `DO_SPACES_ACCESS_KEY` - Your Spaces access key
- `DO_SPACES_SECRET_KEY` - Your Spaces secret key
- `DO_SPACES_BUCKET` - Your Spaces bucket name
- `DO_SPACES_ENDPOINT` - Your Spaces endpoint (e.g., <https://nyc3.digitaloceanspaces.com>)
- `DO_SPACES_REGION` - Your Spaces region (e.g., nyc3)

**Required for Production (choose one option):**

- For internal networking (recommended):
  - `PLAYWRIGHT_SERVER_ENDPOINT=http://playwright-server:8081`
  - `PLAYWRIGHT_MCP_ENDPOINT=http://playwright-mcp:8080/mcp`
- For external access:
  - `PLAYWRIGHT_SERVER_ENDPOINT=https://your-app-name.ondigitalocean.app/playwright-server`
  - `PLAYWRIGHT_MCP_ENDPOINT=https://your-app-name.ondigitalocean.app/playwright-mcp/mcp`

#### 5. Configure Component Settings

##### Web Component

- **Instance Size**: Basic XXS (512 MB RAM, 1 vCPU)
- **HTTP Port**: 3000
- **Routes**: /

##### Playwright Server Worker

- **Instance Size**: Professional XS (1 GB RAM, 1 vCPU)
- **Internal Port**: 8081
- **Dockerfile**: Dockerfile.playwright

##### Playwright MCP Worker

- **Instance Size**: Professional XS (1 GB RAM, 1 vCPU)
- **Internal Port**: 8080
- **Dockerfile**: Dockerfile.mcp

#### 6. Deploy

Click "Create Resources" to start the deployment. The initial build may take 10-15 minutes.

### Post-Deployment

#### Verify Services

1. Check that all 3 components show as running and healthy
2. Visit your app URL to see the homepage
3. Test the Chat interface
4. Test the Screenshotter tool

#### Monitor Performance

Use the App Platform metrics to monitor:

- CPU and memory usage
- Request rates
- Error logs

### Troubleshooting Deployment

#### Build Failures

If the build fails:

1. Check the build logs for errors
2. Ensure the correct values are in the arguments to the runners
3. Verify the Dockerfiles are correct

#### Runtime Errors

#### Connection Issues

If services can't communicate:

1. Use internal hostnames (playwright-server, playwright-mcp)
2. Check the internal ports are correct
3. Verify environment variables point to internal URLs

### Security Considerations

1. **API Keys**: Always use App Platform secrets for sensitive values
2. **Network**: Use internal networking between components
3. **Spaces**: Configure bucket policies to restrict access
4. **Updates**: Keep dependencies updated for security patches

## Project Structure

```text
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

1. **"Bad Request" errors in chat**
   - **Most common cause**: Max Tokens setting in Advanced Settings is too high
   - See "Max Tokens Configuration" section below for detailed explanation

2. **"Cannot connect to Playwright server"**
   - Ensure both Playwright containers are running
   - Check ports 8080 and 8081 are not in use (when running locally)
   - Verify environment variables are set correctly

3. **"Gradient API error"**
   - Verify your API key is correct
   - Check you have access to Gradient
   - Ensure you're not exceeding rate limits

4. **"Spaces upload failed"**
   - Verify bucket exists and is accessible
   - Check access keys have write permissions
   - Ensure bucket name is globally unique

5. **"Screenshot timeout"**
   - Check Playwright server is running and reachable
   - Try different browser options
   - Check if the site requires authentication

### Max Tokens Configuration

The most common cause of "Bad Request" errors in the chat interface is incorrect Max Tokens settings in the Advanced Settings panel.

#### How Max Tokens Actually Works

The number of tokens a model generates is determined by:

```javascript
generated_tokens = min(request.max_tokens, (model_context_length - prompt_token_length))
```

Where:

- `request.max_tokens` - The value you set in Advanced Settings
- `model_context_length` - The model's total context window (varies by model)
- `prompt_token_length` - Tokens used by your messages + system prompt + tool definitions

#### Common Issues and Solutions

1. **Setting Max Tokens too high**
   - If you set Max Tokens to 32,000 but your prompt uses 30,000 tokens, the model can only generate 2,000 tokens
   - If Max Tokens exceeds available space, you'll get a "Bad Request" error

2. **Solution**
   - Start with a lower Max Tokens value (e.g., 4,096)
   - If you get "max tokens reached" warnings, gradually increase it
   - Monitor the token usage shown in the chat interface

3. **Model-Specific Context Limits**
   - Each model has different context lengths
   - Check the model's documentation for its specific limit
   - Leave room for both input and output tokens

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues specific to:

- App Platform: [DigitalOcean Support](https://www.digitalocean.com/support)
- This application: [GitHub Issues](https://github.com/digitalocean/template-gradient-cua-chat/issues)

## License

This is a template application provided by DigitalOcean. See LICENSE for details.
