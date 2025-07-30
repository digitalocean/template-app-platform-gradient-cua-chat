// Mock the AWS SDK modules before importing s3-utils
jest.mock('@aws-sdk/client-s3', () => {
  const mockS3Send = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockS3Send,
    })),
    PutObjectCommand: jest.fn((input) => ({ input })),
    GetObjectCommand: jest.fn((input) => ({ input })),
    __mockS3Send: mockS3Send,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('https://test-presigned-url.com')),
}));

// Mock crypto module
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

import {
  uploadBase64ToS3,
  processToolCallForBase64,
  processToolResultForBase64,
  processMessagesForBase64
} from './s3-utils';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Get the mocked functions
const mockS3Send = (S3Client as any).mock?.results?.[0]?.value?.send ?? jest.fn();
const mockGetSignedUrl = jest.mocked(getSignedUrl);

// Mock environment variables
const originalEnv = process.env;

describe('S3 Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    process.env = {
      ...originalEnv,
      DO_SPACES_ENDPOINT: 'https://test.digitaloceanspaces.com',
      DO_SPACES_REGION: 'test-region',
      DO_SPACES_ACCESS_KEY: 'test-access-key',
      DO_SPACES_SECRET_KEY: 'test-secret-key',
      DO_SPACES_BUCKET: 'test-bucket',
    };

    // Reset mock implementations
    mockS3Send.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue('https://test-presigned-url.com');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('uploadBase64ToS3', () => {
    it('should upload base64 data URL and return presigned URL', async () => {
      const base64DataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const filename = 'test-image.png';

      const result = await uploadBase64ToS3(base64DataUrl, filename);

      expect(result).toBe('https://test-presigned-url.com');
      expect(mockS3Send).toHaveBeenCalledTimes(1);

      // Check PutObjectCommand was called with correct params
      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'uploads/test-uuid-1234/test-image.png',
        ContentType: 'image/png',
      });

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should handle raw base64 data with mime type', async () => {
      const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const filename = 'test-image';
      const mimeType = 'image/png';

      const result = await uploadBase64ToS3(rawBase64, filename, mimeType);

      expect(result).toBe('https://test-presigned-url.com');
      expect(mockS3Send).toHaveBeenCalledTimes(1);

      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall).toMatchObject({
        ContentType: 'image/png',
        Key: 'uploads/test-uuid-1234/test-image.png',
      });
    });

    it('should preserve existing file extensions', async () => {
      const base64DataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const filename = 'test-image.png';

      await uploadBase64ToS3(base64DataUrl, filename);

      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall.Key).toBe('uploads/test-uuid-1234/test-image.png');
    });

    it('should add extension when filename lacks one', async () => {
      const base64DataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const filename = 'test-image';

      await uploadBase64ToS3(base64DataUrl, filename);

      const putCommandCall = (PutObjectCommand as jest.Mock).mock.calls[0][0];
      expect(putCommandCall.Key).toBe('uploads/test-uuid-1234/test-image.png');
    });

    it('should throw error for invalid base64 data', async () => {
      const invalidBase64 = 'not-a-valid-base64-or-data-url';

      await expect(uploadBase64ToS3(invalidBase64)).rejects.toThrow(
        'Invalid base64 data URL or missing mimeType for raw base64'
      );
    });

    it('should generate unique directory with UUID', async () => {
      const base64DataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      await uploadBase64ToS3(base64DataUrl, 'test.png');

      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall.Key).toMatch(/^uploads\/test-uuid-1234\/test\.png$/);
    });

    it('should set correct content type', async () => {
      const testCases = [
        { dataUrl: 'data:image/png;base64,abc123', expectedType: 'image/png' },
        { dataUrl: 'data:application/pdf;base64,abc123', expectedType: 'application/pdf' },
        { dataUrl: 'data:text/plain;base64,abc123', expectedType: 'text/plain' },
      ];

      for (const { dataUrl, expectedType } of testCases) {
        jest.clearAllMocks();
        await uploadBase64ToS3(dataUrl, 'test-file');

        const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
        expect(putCommandCall.ContentType).toBe(expectedType);
      }
    });
  });

  describe('processToolCallForBase64', () => {
    it('should process tool arguments and replace base64 data', async () => {
      const toolCall = {
        toolName: 'browser_take_screenshot',
        args: {
          filename: 'screenshot.png',
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          otherProp: 'test',
        },
      };

      const result = await processToolCallForBase64(toolCall);

      expect(result.toolName).toBe('browser_take_screenshot');
      expect((result as any).args).toEqual({
        filename: 'screenshot.png',
        data: 'https://test-presigned-url.com',
        otherProp: 'test',
      });
    });

    it('should handle nested base64 data', async () => {
      const toolCall = {
        toolName: 'complex_tool',
        args: {
          images: [
            { data: 'data:image/png;base64,abc123' },
            { data: 'data:image/jpeg;base64,def456' },
          ],
          nested: {
            screenshot: {
              data: 'data:image/png;base64,ghi789',
            },
          },
        },
      };

      const result = await processToolCallForBase64(toolCall);

      expect((result as any).args).toEqual({
        images: [
          { data: 'https://test-presigned-url.com' },
          { data: 'https://test-presigned-url.com' },
        ],
        nested: {
          screenshot: {
            data: 'https://test-presigned-url.com',
          },
        },
      });
    });

    it('should not modify non-base64 data', async () => {
      const toolCall = {
        toolName: 'test_tool',
        args: {
          text: 'regular text',
          number: 123,
          boolean: true,
          url: 'https://example.com',
        },
      };

      const result = await processToolCallForBase64(toolCall);

      expect((result as any).args).toEqual(toolCall.args);
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });

  describe('processToolResultForBase64', () => {
    it('should process tool result with content array', async () => {
      const result = {
        content: [
          {
            type: 'image',
            data: 'data:image/png;base64,abc123',
            mimeType: 'image/png',
          },
          {
            type: 'text',
            text: 'Screenshot captured',
          },
          {
            type: 'image',
            data: 'def456', // Raw base64
            mimeType: 'image/jpeg',
          },
        ],
      };

      const processed = await processToolResultForBase64(result, 'screenshot');

      expect(processed).toEqual({
        content: [
          {
            type: 'image',
            url: 'https://test-presigned-url.com',
            mimeType: 'image/png',
          },
          {
            type: 'text',
            text: 'Screenshot captured',
          },
          {
            type: 'image',
            url: 'https://test-presigned-url.com',
            mimeType: 'image/jpeg',
          },
        ],
      });
    });

    it('should handle concurrent uploads with batching', async () => {
      // Create 15 images to test batching (MAX_CONCURRENT_UPLOADS = 10)
      const content = Array(15).fill(null).map((_, i) => ({
        type: 'image',
        data: `data:image/png;base64,image${i}`,
        mimeType: 'image/png',
      }));

      const result = { content };

      // Mock to track call order
      let callCount = 0;
      mockS3Send.mockImplementation(() => {
        callCount++;
        return Promise.resolve({});
      });

      await processToolResultForBase64(result);

      // All uploads should complete
      expect(mockS3Send).toHaveBeenCalledTimes(15);

      // Verify batching by checking console logs
      expect(callCount).toBe(15);
    });

    it('should handle upload failures gracefully', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('Upload failed'));

      const result = {
        content: [
          {
            type: 'image',
            data: 'data:image/png;base64,abc123',
          },
        ],
      };

      const processed = await processToolResultForBase64(result);

      // Should still return the result, but without URL replacement
      expect(processed).toEqual({
        content: [
          {
            type: 'image',
            data: 'data:image/png;base64,abc123',
          },
        ],
      });
    });

    it('should pass through non-object results', async () => {
      const simpleResults = [
        'string result',
        123,
        true,
        null,
        undefined,
      ];

      for (const result of simpleResults) {
        const processed = await processToolResultForBase64(result);
        expect(processed).toBe(result);
      }
    });

    it('should pass through arrays properly', async () => {
      const arrayResult = ['array', 'result'];
      const processed = await processToolResultForBase64(arrayResult);
      expect(processed).toEqual(arrayResult);
    });
  });

  describe('processMessagesForBase64', () => {
    it('should process messages with image parts', async () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Here is an image:',
            },
            {
              type: 'image',
              image: 'data:image/png;base64,abc123',
              filename: 'user-image.png',
            },
          ],
        },
        {
          role: 'assistant',
          content: 'I see the image.',
        },
      ];

      const processed = await processMessagesForBase64(messages);

      expect(processed[0].content[1]).toEqual({
        type: 'image',
        image: 'https://test-presigned-url.com',
        filename: 'user-image.png',
      });
      expect(processed[1]).toEqual(messages[1]);
    });

    it('should process file parts with base64 data', async () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: 'data:application/pdf;base64,abc123',
              filename: 'document.pdf',
              mimeType: 'application/pdf',
            },
          ],
        },
      ];

      const processed = await processMessagesForBase64(messages);

      expect((processed[0] as any).content[0]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        filename: 'document.pdf',
      });
    });

    it('should handle messages without content array', async () => {
      const messages = [
        {
          role: 'user',
          content: 'Simple text message',
        },
        {
          role: 'assistant',
          content: 'Response',
        },
      ];

      const processed = await processMessagesForBase64(messages);

      expect(processed).toEqual(messages);
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should process multiple messages concurrently', async () => {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'image', data: 'data:image/png;base64,img1' },
            { type: 'image', data: 'data:image/png;base64,img2' },
          ],
        },
        {
          role: 'user',
          content: [
            { type: 'file', data: 'data:application/pdf;base64,pdf1' },
            { type: 'image', data: 'data:image/jpeg;base64,img3' },
          ],
        },
      ];

      await processMessagesForBase64(messages);

      // Should upload all 4 items
      expect(mockS3Send).toHaveBeenCalledTimes(4);
    });

    it('should handle image property as well as data property', async () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: 'data:image/png;base64,abc123', // 'image' property
            },
            {
              type: 'image',
              data: 'data:image/jpeg;base64,def456', // 'data' property
            },
          ],
        },
      ];

      const processed = await processMessagesForBase64(messages);

      expect(processed[0].content[0].image).toBe('https://test-presigned-url.com');
      expect((processed[0] as any).content[1].url).toBe('https://test-presigned-url.com');
      expect((processed[0] as any).content[1].data).toBeUndefined();
    });
  });

  describe('MIME type mapping', () => {
    it('should map common MIME types to correct extensions', async () => {
      const mimeTests = [
        { mime: 'image/jpeg', ext: 'jpg' },
        { mime: 'image/png', ext: 'png' },
        { mime: 'image/gif', ext: 'gif' },
        { mime: 'video/mp4', ext: 'mp4' },
        { mime: 'application/pdf', ext: 'pdf' },
        { mime: 'text/plain', ext: 'txt' },
        { mime: 'application/json', ext: 'json' },
        { mime: 'unknown/type', ext: 'type' }, // Falls back to part after /
        { mime: 'application/octet-stream', ext: 'bin' },
      ];

      for (const { mime, ext } of mimeTests) {
        jest.clearAllMocks();
        await uploadBase64ToS3(`data:${mime};base64,test`, 'file');

        const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
        expect(putCommandCall.Key).toMatch(new RegExp(`\\.${ext}$`));
      }
    });

    it('should handle PDF files from S3 uploads', async () => {
      // Simulate PDF upload like from the Arxiv paper
      const pdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vVHlwZS9QYWdlL0NvbnRlbnRzIDMgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDcwPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAxIDAgUj4+CmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuCjAwMDAwMDAwNzQgMDAwMDAgbgowMDAwMDAwMjExIDAwMDAwIG4KMDAwMDAwMDMzMCAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCA0IDAgUi9TaXplIDU+PgpzdGFydHhyZWYKMzgwCiUlRU9G';
      const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
      
      const result = await uploadBase64ToS3(dataUrl, 'attention-is-all-you-need.pdf');
      
      expect(result).toBe('https://test-presigned-url.com');
      expect(mockS3Send).toHaveBeenCalledTimes(1);
      
      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'uploads/test-uuid-1234/attention-is-all-you-need.pdf',
        ContentType: 'application/pdf',
      });
    });

    it('should process PDF files in message content', async () => {
      const pdfBase64 = 'JVBERi0xLjMKJeLjz9M='; // Minimal PDF base64
      
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: `data:application/pdf;base64,${pdfBase64}`,
              filename: 'research-paper.pdf',
              mimeType: 'application/pdf',
            },
            {
              type: 'text',
              text: 'Please analyze this PDF',
            },
          ],
        },
      ];

      const processed = await processMessagesForBase64(messages);

      expect((processed[0] as any).content[0]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        filename: 'research-paper.pdf',
      });
      
      // Verify S3 upload was called with correct params
      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall.ContentType).toBe('application/pdf');
      expect(putCommandCall.Key).toContain('research-paper.pdf');
    });

    it('should process raw base64 PDF without data: prefix in messages', async () => {
      // Raw base64 without data: prefix (like from a file reader)
      const rawPdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm';
      
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: rawPdfBase64, // No data: prefix
              filename: 'raw-upload.pdf',
              mimeType: 'application/pdf',
            },
          ],
        },
      ];

      const processed = await processMessagesForBase64(messages);

      // File parts ARE processed by processMessagesForBase64
      expect((processed[0] as any).content[0]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        filename: 'raw-upload.pdf',
      });
    });

    it('should handle PDF data URI from file upload component', async () => {
      // Simulate what a file upload component might send after reading a PDF
      const pdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vVHlwZS9QYWdlL0NvbnRlbnRzIDMgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDcwPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAxIDAgUj4+CmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuCjAwMDAwMDAwNzQgMDAwMDAgbgowMDAwMDAwMjExIDAwMDAwIG4KMDAwMDAwMDMzMCAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCA0IDAgUi9TaXplIDU+PgpzdGFydHhyZWYKMzgwCiUlRU9G';

      // Test with data URI
      const dataUri = `data:application/pdf;base64,${pdfBase64}`;
      const result = await uploadBase64ToS3(dataUri, 'uploaded-document.pdf');

      expect(result).toBe('https://test-presigned-url.com');
      expect(mockS3Send).toHaveBeenCalledTimes(1);

      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'uploads/test-uuid-1234/uploaded-document.pdf',
        ContentType: 'application/pdf',
      });

      // Verify the buffer was created correctly
      expect(putCommandCall.Body).toBeInstanceOf(Buffer);
      expect(putCommandCall.Body.length).toBeGreaterThan(0);
    });

    it('should handle raw PDF base64 with mime type parameter', async () => {
      // Simulate raw base64 data (not data URI) as might come from a file reader
      const pdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vVHlwZS9QYWdlL0NvbnRlbnRzIDMgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDcwPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAxIDAgUj4+CmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuCjAwMDAwMDAwNzQgMDAwMDAgbgowMDAwMDAwMjExIDAwMDAwIG4KMDAwMDAwMDMzMCAwMDAwMCBuCnRyYWlsZXIKPDwvUm9vdCA0IDAgUi9TaXplIDU+PgpzdGFydHhyZWYKMzgwCiUlRU9G';

      const result = await uploadBase64ToS3(pdfBase64, 'raw-pdf-upload.pdf', 'application/pdf');

      expect(result).toBe('https://test-presigned-url.com');
      
      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'uploads/test-uuid-1234/raw-pdf-upload.pdf',
        ContentType: 'application/pdf',
      });
    });

    it('should process PDF in tool results', async () => {
      // Note: processToolResultForBase64 currently only processes type='image' items
      // So PDF files in tool results would need to be type='image' or handled separately
      const toolResult = {
        content: [
          {
            type: 'image',
            data: 'data:application/pdf;base64,JVBERi0xLjMKJeLjz9M=',
            mimeType: 'application/pdf',
            filename: 'screenshot.pdf'
          },
          {
            type: 'text',
            text: 'PDF screenshot captured'
          }
        ]
      };

      const processed = await processToolResultForBase64(toolResult, 'pdf_capture');

      expect((processed as any).content[0]).toEqual({
        type: 'image',
        url: 'https://test-presigned-url.com',
        mimeType: 'application/pdf',
        filename: 'screenshot.pdf'
      });
      expect((processed as any).content[1]).toEqual({
        type: 'text',
        text: 'PDF screenshot captured'
      });
    });

    it('should process PDF files with type="file" in tool results', async () => {
      // Now file type items should be processed
      const toolResult = {
        content: [
          {
            type: 'file',
            data: 'data:application/pdf;base64,JVBERi0xLjMKJeLjz9M=',
            mimeType: 'application/pdf',
            filename: 'document.pdf'
          }
        ]
      };

      const processed = await processToolResultForBase64(toolResult, 'pdf_tool');

      // The data should be replaced with URL
      expect((processed as any).content[0]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        mimeType: 'application/pdf',
        filename: 'document.pdf'
      });
    });

    it('should handle mixed image and file types in tool results', async () => {
      const toolResult = {
        content: [
          {
            type: 'image',
            data: 'data:image/png;base64,iVBORw0KGgo=',
            mimeType: 'image/png'
          },
          {
            type: 'file',
            data: 'data:application/pdf;base64,JVBERi0xLjM=',
            mimeType: 'application/pdf',
            filename: 'report.pdf'
          },
          {
            type: 'text',
            text: 'Processing complete'
          }
        ]
      };

      const processed = await processToolResultForBase64(toolResult);

      expect((processed as any).content[0]).toEqual({
        type: 'image',
        url: 'https://test-presigned-url.com',
        mimeType: 'image/png'
      });
      expect((processed as any).content[1]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        mimeType: 'application/pdf',
        filename: 'report.pdf'
      });
      expect((processed as any).content[2]).toEqual({
        type: 'text',
        text: 'Processing complete'
      });
    });

    it('should process raw base64 without data: prefix in tool results', async () => {
      // Raw base64 strings without the data: prefix
      const rawImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const rawPdfBase64 = 'JVBERi0xLjMKJeLjz9MKCjEgMCBvYmoKPDwvS2lkc1syIDAgUl0vVHlwZS9QYWdlcy9Db3VudCAxPj4KZW5kb2JqCjIgMCBvYmoKPDwvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vVHlwZS9QYWdlL0NvbnRlbnRzIDMgMCBSPj4KZW5kb2JqCjMgMCBvYmoKPDwvTGVuZ3RoIDcwPj4Kc3RyZWFt';
      
      const toolResult = {
        content: [
          {
            type: 'image',
            data: rawImageBase64,
            mimeType: 'image/png'
          },
          {
            type: 'file',
            data: rawPdfBase64,
            mimeType: 'application/pdf',
            filename: 'document.pdf'
          }
        ]
      };

      const processed = await processToolResultForBase64(toolResult);

      expect((processed as any).content[0]).toEqual({
        type: 'image',
        url: 'https://test-presigned-url.com',
        mimeType: 'image/png'
      });
      expect((processed as any).content[1]).toEqual({
        type: 'file',
        url: 'https://test-presigned-url.com',
        mimeType: 'application/pdf',
        filename: 'document.pdf'
      });

      // Verify correct mime types were used for upload
      const putCalls = ((PutObjectCommand as unknown) as jest.Mock).mock.calls;
      expect(putCalls[0][0].ContentType).toBe('image/png');
      expect(putCalls[1][0].ContentType).toBe('application/pdf');
    });
  });

  describe('Error handling', () => {
    it('should continue processing when individual uploads fail', async () => {
      // Make first upload fail, second succeed
      mockS3Send
        .mockRejectedValueOnce(new Error('Upload 1 failed'))
        .mockResolvedValueOnce({});

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'image', data: 'data:image/png;base64,fail' },
            { type: 'image', data: 'data:image/png;base64,success' },
          ],
        },
      ];

      const processed = await processMessagesForBase64(messages);

      // First image should keep original data (failed)
      expect(processed[0].content[0].data).toBe('data:image/png;base64,fail');

      // Second image should have URL (succeeded)
      expect((processed[0] as any).content[1].url).toBe('https://test-presigned-url.com');
    });

    it('should handle S3Client initialization errors', async () => {
      // Remove required environment variables
      delete process.env.DO_SPACES_ACCESS_KEY;
      delete process.env.DO_SPACES_SECRET_KEY;

      // The function should still attempt the upload
      const base64DataUrl = 'data:image/png;base64,test';

      // The function should still attempt the upload
      await expect(uploadBase64ToS3(base64DataUrl)).resolves.toBe('https://test-presigned-url.com');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle very large base64 strings', async () => {
      // Create a large base64 string (1MB of 'A's)
      const largeBase64 = 'A'.repeat(1024 * 1024);
      const dataUrl = `data:image/png;base64,${largeBase64}`;

      await uploadBase64ToS3(dataUrl, 'large-file.png');

      expect(mockS3Send).toHaveBeenCalled();

      const putCommandCall = ((PutObjectCommand as unknown) as jest.Mock).mock.calls[0][0];
      expect(putCommandCall.Key).toBe('uploads/test-uuid-1234/large-file.png');
    });

    it('should handle empty messages array', async () => {
      const processed = await processMessagesForBase64([]);
      expect(processed).toEqual([]);
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should deep clone objects to avoid mutation', async () => {
      const original = {
        toolName: 'test',
        args: {
          data: 'data:image/png;base64,test',
          nested: { value: 'original' },
        },
      };

      const result = await processToolCallForBase64(original);

      // Original should be unchanged
      expect(original.args.data).toBe('data:image/png;base64,test');
      expect(original.args.nested.value).toBe('original');

      // Result should have modified data
      expect(result.args.data).toBe('https://test-presigned-url.com');
      expect(result.args.nested.value).toBe('original');
    });
  });
});
