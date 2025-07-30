# Deployment Guide for DigitalOcean App Platform

This guide walks you through deploying the Playwright MCP CUA Demo to DigitalOcean App Platform.

## Prerequisites

1. DigitalOcean account with billing enabled
2. GitHub account with the repository forked
3. The following DigitalOcean services configured:
   - Gradient AI access
   - Spaces bucket created
   - API tokens generated

## Quick Deploy

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/digitalocean/template-app-platform-gradient-cua-chatdigitalocean/template-gradient-cua-chat/tree/main)

## Manual Deployment Steps

### 1. Fork the Repository

Fork this repository to your GitHub account so App Platform can access it.

### 2. Create a New App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as your source
4. Select your forked repository

### 3. Configure App Spec

You can either:

- Use the UI to configure components
- Upload the provided `.do/app.yaml` spec file

The app requires 3 components:

- **Web Service**: The Next.js application
- **Worker 1**: Playwright browser server
- **Worker 2**: Playwright MCP server

### 4. Set Environment Variables

Configure these secrets in the App Platform settings:

```bash
# Required Secrets
GRADIENT_API_KEY=<your-gradient-api-key>
DO_SPACES_ACCESS_KEY=<your-spaces-access-key>
DO_SPACES_SECRET_KEY=<your-spaces-secret-key>
DO_SPACES_BUCKET=<your-bucket-name>
```

### 5. Configure Component Settings

#### Web Component

- **Instance Size**: Basic XXS (512 MB RAM, 1 vCPU)
- **HTTP Port**: 3000
- **Routes**: /

#### Playwright Server Worker

- **Instance Size**: Professional XS (1 GB RAM, 1 vCPU)
- **Internal Port**: 8081
- **Dockerfile**: Dockerfile.playwright

#### Playwright MCP Worker

- **Instance Size**: Professional XS (1 GB RAM, 1 vCPU)
- **Internal Port**: 8080
- **Dockerfile**: Dockerfile.mcp

### 6. Deploy

Click "Create Resources" to start the deployment. The initial build may take 10-15 minutes.

## Post-Deployment

### Verify Services

1. Check that all 3 components show as "Running"
2. Visit your app URL to see the homepage
3. Test the Chat interface
4. Test the Screenshotter tool

### Monitor Performance

Use the App Platform metrics to monitor:

- CPU and memory usage
- Request rates
- Error logs

### Scaling

For production use, consider:

- Increasing instance sizes for better performance
- Adding multiple instances for high availability
- Setting up alerts for monitoring

## Cost Estimation

Monthly costs (approximate):

- Web Service (Basic XXS): $5
- Playwright Server (Professional XS): $20
- Playwright MCP (Professional XS): $20
- **Total**: ~$45/month

Plus:

- Gradient AI usage (pay per token)
- Spaces storage and bandwidth

## Troubleshooting Deployment

### Build Failures

If the build fails:

1. Check the build logs for errors
2. Ensure all environment variables are set
3. Verify the Dockerfiles are correct

### Runtime Errors

If services won't start:

1. Check runtime logs
2. Verify internal networking is configured
3. Ensure ports match the configuration

### Connection Issues

If services can't communicate:

1. Use internal hostnames (playwright-server, playwright-mcp)
2. Check the internal ports are correct
3. Verify environment variables point to internal URLs

## Security Considerations

1. **API Keys**: Always use App Platform secrets for sensitive values
2. **Network**: Use internal networking between components
3. **Spaces**: Configure bucket policies to restrict access
4. **Updates**: Keep dependencies updated for security patches

## Support

For issues specific to:

- App Platform: [DigitalOcean Support](https://www.digitalocean.com/support)
- This application: [GitHub Issues](https://github.com/https://github.com/digitalocean/template-gradient-cua-chat/issues)
