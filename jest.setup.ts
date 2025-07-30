import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DO_SPACES_ENDPOINT = 'https://test.digitaloceanspaces.com';
process.env.DO_SPACES_REGION = 'test-region';
process.env.DO_SPACES_ACCESS_KEY = 'test-access-key';
process.env.DO_SPACES_SECRET_KEY = 'test-secret-key';
process.env.DO_SPACES_BUCKET = 'test-bucket';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock fetch for tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});