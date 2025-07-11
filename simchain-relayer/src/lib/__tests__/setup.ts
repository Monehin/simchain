// Test setup file for Jest
import { jest } from '@jest/globals';

// Mock crypto module for consistent hashing in tests
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => new Uint8Array(32).fill(1)) // Mock hash
    }))
  }))
}));

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 