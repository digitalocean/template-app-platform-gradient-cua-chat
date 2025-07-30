import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

/**
 * S3 Utility for handling base64 file uploads
 * 
 * This module provides functionality to:
 * - Upload any base64-encoded file to S3 (DigitalOcean Spaces)
 * - Replace base64 data URLs with presigned S3 URLs to reduce token usage
 * - Process messages and tool calls to automatically handle file uploads
 * 
 * Files are organized as: /uploads/{uuid}/{filename}
 * where filename is either provided or generated based on MIME type
 */

// Initialize S3 client with DigitalOcean Spaces configuration
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || '';
const MAX_CONCURRENT_UPLOADS = 10; // Limit concurrent uploads to prevent overwhelming the system

/**
 * Execute promises in batches with concurrency limit
 */
async function batchPromises<T>(promises: Promise<T>[], batchSize: number): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

interface Base64Data {
  data: string;
  mimeType: string;
}

/**
 * Extract base64 data and mime type from a data URL
 */
function parseDataUrl(dataUrl: string): Base64Data | null {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;

  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

/**
 * Get file extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/json': 'json',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/javascript': 'js',
    'application/octet-stream': 'bin',
  };

  return mimeToExt[mimeType] || mimeType.split('/')[1] || 'bin';
}

/**
 * Upload a base64 file to S3 and return the presigned URL
 */
export async function uploadBase64ToS3(base64Data: string, originalFilename?: string, mimeType?: string): Promise<string> {
  let parsed = parseDataUrl(base64Data);

  // If it's not a data URL, assume it's raw base64
  if (!parsed && mimeType) {
    parsed = {
      data: base64Data,
      mimeType: mimeType,
    };
  }

  if (!parsed) {
    throw new Error('Invalid base64 data URL or missing mimeType for raw base64');
  }

  // Generate a unique directory and filename
  const uuid = crypto.randomUUID();

  // Only add extension if filename doesn't already have one
  let filename: string;
  if (originalFilename) {
    // Check if filename already has an extension
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(originalFilename);
    if (hasExtension) {
      filename = originalFilename;
    } else {
      // Add extension based on mime type
      const fileExtension = getExtensionFromMimeType(parsed.mimeType);
      filename = `${originalFilename}.${fileExtension}`;
    }
  } else {
    // No filename provided, generate one
    const fileExtension = getExtensionFromMimeType(parsed.mimeType);
    filename = `file.${fileExtension}`;
  }

  const fileName = `uploads/${uuid}/${filename}`;

  // Convert base64 to buffer
  const buffer = Buffer.from(parsed.data, 'base64');

  // Upload to S3
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: parsed.mimeType,
    ACL: 'public-read',
  });

  await s3Client.send(putCommand);

  // Generate presigned URL for reading the object
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const presignedUrl = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 3600 * 24 * 7, // 7 days
  });

  return presignedUrl;
}

/**
 * Recursively search and replace base64 data with S3 URLs
 */
async function replaceBase64InObject(obj: unknown, filename?: string, mimeType?: string): Promise<unknown> {
  if (typeof obj === 'string') {
    // Check if it's a data URL
    if (obj.startsWith('data:') && obj.includes(';base64,')) {
      try {
        console.log('Found base64 data URL, uploading to S3...');
        const url = await uploadBase64ToS3(obj, filename);
        console.log('Uploaded to S3:', url);
        return url;
      } catch (error) {
        console.error('Failed to upload to S3:', error);
        return obj; // Return original if upload fails
      }
    }
    // Check if it might be raw base64 (for tool outputs)
    else if (mimeType && /^[A-Za-z0-9+/]+=*$/.test(obj.substring(0, 100))) {
      try {
        console.log('Found raw base64 data, uploading to S3...');
        const url = await uploadBase64ToS3(obj, filename, mimeType);
        console.log('Uploaded to S3:', url);
        return url;
      } catch (error) {
        console.error('Failed to upload to S3:', error);
        return obj; // Return original if upload fails
      }
    }
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => replaceBase64InObject(item, filename, mimeType)));
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Pass mimeType down if we're processing a data field
      const currentMimeType = (key === 'data' && 'mimeType' in obj) ? (obj as Record<string, unknown>).mimeType as string : mimeType;
      result[key] = await replaceBase64InObject(value, filename, currentMimeType);
    }
    return result;
  }

  return obj;
}

/**
 * Process tool arguments and replace base64 data with S3 URLs
 */
export async function processToolCallForBase64(toolCall: {
  toolName: string;
  args: unknown;
}): Promise<{ toolName: string; args: unknown }> {
  // Deep clone the args to avoid mutation
  const processedArgs = JSON.parse(JSON.stringify(toolCall.args));
  console.log(`Processing tool call for ${toolCall.toolName} with args:`, processedArgs);
  // Extract filename from args if available
  let filename: string | undefined;
  if (processedArgs && typeof processedArgs === 'object' && 'filename' in processedArgs) {
    filename = processedArgs.filename as string;
  }

  const updatedArgs = await replaceBase64InObject(processedArgs, filename);

  return {
    toolName: toolCall.toolName,
    args: updatedArgs,
  };
}

/**
 * Process tool results and replace base64 data with S3 URLs
 */
export async function processToolResultForBase64(result: unknown, filename?: string): Promise<unknown> {
  // If result has content array, process it
  if (result && typeof result === 'object' && 'content' in result && Array.isArray((result as Record<string, unknown>).content)) {
    const clonedResult = JSON.parse(JSON.stringify(result));
    const content = (clonedResult as Record<string, unknown>).content as unknown[];

    // Collect all upload promises
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < content.length; i++) {
      const item = content[i] as Record<string, unknown>;

      // Check for items with base64 data (both 'image' and 'file' types)
      if ((item.type === 'image' || item.type === 'file') && item.data && typeof item.data === 'string') {
        const isDataUrl = item.data.startsWith('data:');
        const isBase64 = !isDataUrl && /^[A-Za-z0-9+/]+=*$/.test(item.data.substring(0, 100));

        if (isDataUrl || isBase64) {
          // Create upload promise
          const uploadPromise = (async () => {
            try {
              console.log(`Processing tool result ${item.type} ${i}`);
              
              // Use mimeType if provided, otherwise default based on type
              const mimeType = item.mimeType as string || (item.type === 'image' ? 'image/jpeg' : 'application/octet-stream');

              // Use the filename from the item or tool input, or generate based on type
              const uploadFilename = (item.filename as string) || filename || (item.type === 'image' ? 'screenshot' : 'file');

              const url = await uploadBase64ToS3(item.data as string, uploadFilename, isBase64 ? mimeType : undefined);

              // Replace data with url
              delete item.data;
              item.url = url;
              console.log(`Processed ${item.type} ${i}: uploaded to ${url}`);

              // Keep mimeType for now for debugging
              // if (item.mimeType) {
              //   delete item.mimeType;
              // }
            } catch (error) {
              console.error(`Failed to process tool result ${item.type} ${i}:`, error);
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }
    }

    // Wait for all uploads to complete with concurrency limit
    if (uploadPromises.length > 0) {
      console.log(`Starting ${uploadPromises.length} uploads with max concurrency of ${MAX_CONCURRENT_UPLOADS}...`);
      await batchPromises(uploadPromises, MAX_CONCURRENT_UPLOADS);
      console.log('All uploads completed');
    }

    return clonedResult;
  }

  // Otherwise, process it as a generic object
  return replaceBase64InObject(result, filename);
}

/**
 * Process messages and replace base64 data with S3 URLs
 */
export async function processMessagesForBase64(messages: unknown[]): Promise<unknown[]> {
  // Deep clone to avoid mutation
  const clonedMessages = JSON.parse(JSON.stringify(messages));
  const uploadPromises: Promise<void>[] = [];

  // Process each message
  for (let i = 0; i < clonedMessages.length; i++) {
    const message = clonedMessages[i];

    // Check if message has content with parts
    if (message.content && Array.isArray(message.content)) {
      for (let j = 0; j < message.content.length; j++) {
        const part = message.content[j];

        // Check for image parts with base64 data
        if (part.type === 'image') {
          // Handle both 'image' and 'data' properties
          const imageData = part.image || part.data;
          if (imageData && typeof imageData === 'string') {
            // Check if it's base64 (either data URL or raw base64)
            const isDataUrl = imageData.startsWith('data:');
            const isBase64 = !isDataUrl && /^[A-Za-z0-9+/]+=*$/.test(imageData.substring(0, 100));

            if (isDataUrl || isBase64) {
              const uploadPromise = (async () => {
                try {
                  console.log(`Processing image in message ${i}, part ${j}`);
                  const filename = part.filename || 'image';
                  const mimeType = part.mimeType || 'image/jpeg'; // Default to JPEG for images
                  const url = await uploadBase64ToS3(imageData, filename, isBase64 ? mimeType : undefined);

                  // Replace the appropriate property with URL
                  if (part.image) {
                    part.image = url;
                  } else if (part.data) {
                    delete part.data;
                    part.url = url;
                  }
                  // Remove mimeType if it exists since we're now using URL
                  if (part.mimeType) {
                    delete part.mimeType;
                  }
                } catch (error) {
                  console.error('Failed to process image:', error);
                }
              })();
              uploadPromises.push(uploadPromise);
            }
          }
        }

        // Check for file parts with base64 data
        if (part.type === 'file' && part.data && typeof part.data === 'string') {
          // Check if it's base64 (either data URL or raw base64)
          const isDataUrl = part.data.startsWith('data:');
          const isBase64 = !isDataUrl && /^[A-Za-z0-9+/]+=*$/.test(part.data.substring(0, 100));

          if (isDataUrl || isBase64) {
            const uploadPromise = (async () => {
              try {
                console.log(`Processing file in message ${i}, part ${j}`);
                const filename = part.filename || part.name || 'file';
                const mimeType = part.mimeType || part.mediaType || 'application/octet-stream';
                const url = await uploadBase64ToS3(part.data, filename, isBase64 ? mimeType : undefined);
                // Remove data property and add url
                delete part.data;
                part.url = url;
                // Remove mimeType if it exists since we're now using URL
                if (part.mimeType) {
                  delete part.mimeType;
                }
              } catch (error) {
                console.error('Failed to process file:', error);
              }
            })();
            uploadPromises.push(uploadPromise);
          }
        }
      }
    }
  }

  // Wait for all uploads to complete with concurrency limit
  if (uploadPromises.length > 0) {
    console.log(`Starting ${uploadPromises.length} message uploads with max concurrency of ${MAX_CONCURRENT_UPLOADS}...`);
    await batchPromises(uploadPromises, MAX_CONCURRENT_UPLOADS);
    console.log('All message uploads completed');
  }

  return clonedMessages;
}
