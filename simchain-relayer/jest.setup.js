// Mock crypto for consistent hashing in tests
const crypto = require('crypto');

// Mock crypto.subtle for consistent behavior
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: async (algorithm, data) => {
        if (algorithm === 'SHA-256') {
          return crypto.createHash('sha256').update(data).digest();
        }
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
    }
  }
});

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 